import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPublicOrderById } from "../lib/order-service";
import tokensData from "../constants/tokens.json";
import { crossChainPay } from "../lib/create-order-cross-chain";
import { sameChainPay } from "../lib/create-order-same-chain";

interface PaymentOrder {
  uid: string;
  outChain: string;
  outToken: string;
  usdCents: string;
  merchant: string;
  deadline: number;
  createdAt: string;
  status: string;
}

interface Chain {
  chainId: string;
  name: string;
  symbol: string;
  logo: string;
}

interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

interface TokenPriceData {
  success: boolean;
  data?: {
    price: number;
    token: {
      name: string;
      symbol: string;
      decimals: number;
      logoURI: string | null;
      address: string;
    };
    chainId: string;
  };
  message?: string;
}

interface RequiredAmountData {
  success: boolean;
  requiredAmount?: number;
  message?: string;
}

type PaymentStep =
  | "order-details"
  | "chain-selection"
  | "token-selection"
  | "payment-confirmation";

const PaymentPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment flow state
  const [currentStep, setCurrentStep] = useState<PaymentStep>("order-details");
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [tokenPriceData, setTokenPriceData] = useState<TokenPriceData | null>(
    null
  );
  const [requiredAmount, setRequiredAmount] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  
  // Payment processing states
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
  } | null>(null);

  // Helper function to round amount based on token decimals
  const roundTokenAmount = (amount: number, decimals: number): number => {
    // Limit to maximum of token decimals, but at least 2 decimal places for readability
    const maxDecimals = Math.min(decimals, 8); // Cap at 8 for UI readability

    // Use the appropriate number of decimals
    const factor = Math.pow(10, maxDecimals);
    return Math.round(amount * factor) / factor;
  };

  // Validation functions
  const validatePaymentConditions = (): string | null => {
    if (!window.ethereum) {
      return "Please install MetaMask or another Web3 wallet to continue";
    }

    if (!selectedChain || !selectedToken || !order || !requiredAmount) {
      return "Missing required payment information";
    }

    // Check if same token swap (not allowed)
    if (selectedToken.address.toLowerCase() === order.outToken.toLowerCase()) {
      return "Cannot swap the same token. Please select a different input token.";
    }

    // Check minimum amount (prevent dust transactions)
    const minAmount = 0.000001; // Minimum amount threshold
    if (requiredAmount < minAmount) {
      return `Amount too small. Minimum required: ${minAmount} ${selectedToken.symbol}`;
    }

    // For same-chain payments, verify chains match
    const isSameChain = selectedChain.chainId === order.outChain;
    if (isSameChain) {
      return null; // Valid same-chain payment
    } else {
      // Cross-chain payment validation - all networks supported now
      return null; // Valid cross-chain payment
    }
  };

  const checkWalletConnection = async (): Promise<boolean> => {
    try {
      if (!window.ethereum) return false;
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
      return accounts.length > 0;
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      return false;
    }
  };

  // Available chains from tokens.json
  const availableChains: Chain[] = [
    { chainId: "1", name: "Ethereum", symbol: "ETH", logo: "🔷" },
    { chainId: "137", name: "Polygon", symbol: "MATIC", logo: "🟣" },
    { chainId: "56", name: "BSC", symbol: "BNB", logo: "🟡" },
    { chainId: "43114", name: "Avalanche", symbol: "AVAX", logo: "🔺" },
    { chainId: "42161", name: "Arbitrum", symbol: "ETH", logo: "🔷" },
    { chainId: "10", name: "Optimism", symbol: "ETH", logo: "🔴" },
    { chainId: "8453", name: "Base", symbol: "ETH", logo: "🔵" },
    { chainId: "324", name: "zkSync", symbol: "ETH", logo: "⚡" },
  ];
  console.log("selected token", selectedToken);
  interface TokenData {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
  }

  // Load tokens for a specific chain from tokens.json
  const loadTokensForChain = (chainId: string) => {
    const chainData = (tokensData as Record<string, { tokens: TokenData[] }>)[chainId];
    if (chainData && chainData.tokens) {
      // Get first 10 popular tokens for the chain
      const tokens = chainData.tokens.map((token: TokenData) => ({
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoURI: token.logoURI,
      }));
      setAvailableTokens(tokens);
    } else {
      setAvailableTokens([]);
    }
  };

  // Fetch token price from API
  const fetchTokenPrice = async (
    chainId: string,
    tokenAddress: string
  ): Promise<TokenPriceData> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/price/chain/${chainId}/token/${tokenAddress}/`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching token price:", error);
      return {
        success: false,
        message: "Failed to fetch token price",
      };
    }
  };

  // Fetch required token amount
  const fetchRequiredAmount = async (
    chainId: string,
    tokenAddress: string,
    requiredUsd: number
  ): Promise<RequiredAmountData> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/price/get-required-token-amount/chain/${chainId}/token/${tokenAddress}/requiredUsd/${requiredUsd}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching required amount:", error);
      return {
        success: false,
        message: "Failed to fetch required amount",
      };
    }
  };

  // Handle chain selection
  const handleChainSelect = (chain: Chain) => {
    setSelectedChain(chain);
    setSelectedToken(null);
    setTokenPriceData(null);
    setRequiredAmount(null);
    loadTokensForChain(chain.chainId);
    setCurrentStep("token-selection");
  };

  // Handle token selection
  const handleTokenSelect = async (token: Token) => {
    setSelectedToken(token);
    setLoadingPrice(true);

    if (selectedChain && order) {
      // Fetch token price and required amount
      const priceData = await fetchTokenPrice(
        selectedChain.chainId,
        token.address
      );
      setTokenPriceData(priceData);

      const usdAmount = parseInt(order.usdCents) / 100;
      const amountData = await fetchRequiredAmount(
        selectedChain.chainId,
        token.address,
        usdAmount
      );

      if (amountData.success && amountData.requiredAmount) {
        setRequiredAmount(amountData.requiredAmount);
      }

      setCurrentStep("payment-confirmation");

      // Start auto-refresh for prices (every 1 minute)
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }

      const interval = setInterval(async () => {
        const updatedPriceData = await fetchTokenPrice(
          selectedChain.chainId,
          token.address
        );
        setTokenPriceData(updatedPriceData);

        const updatedAmountData = await fetchRequiredAmount(
          selectedChain.chainId,
          token.address,
          usdAmount
        );
        if (updatedAmountData.success && updatedAmountData.requiredAmount) {
          setRequiredAmount(updatedAmountData.requiredAmount);
        }
      }, 60000); // 1 minute

      setRefreshInterval(interval);
    }

    setLoadingPrice(false);
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep === "token-selection") {
      setCurrentStep("chain-selection");
      setSelectedChain(null);
      setAvailableTokens([]);
    } else if (currentStep === "payment-confirmation") {
      setCurrentStep("token-selection");
      setSelectedToken(null);
      setTokenPriceData(null);
      setRequiredAmount(null);
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    } else if (currentStep === "chain-selection") {
      setCurrentStep("order-details");
    }
  };

  // Start payment flow
  const startPayment = () => {
    setCurrentStep("chain-selection");
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  useEffect(() => {
    if (uuid) {
      fetchOrderDetails(uuid);
    } else {
      setError("Order ID not provided");
      setLoading(false);
    }
  }, [uuid]);

  const fetchOrderDetails = async (orderUuid: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getPublicOrderById(orderUuid);

      if (response.success && response.order) {
        // The response.order should match our PaymentOrder interface
        setOrder(response.order as unknown as PaymentOrder);
      } else {
        setError(response.message || "Order not found");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch order details"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (usdCents: string) => {
    return `$${(parseInt(usdCents) / 100).toFixed(2)}`;
  };

  const isExpired = (deadline: number) => {
    return Date.now() / 1000 > deadline;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const handleConfirmPayment = async () => {
    if (processingPayment) {
      console.log("Payment already in progress...");
      return;
    }

    try {
      setProcessingPayment(true);
      setPaymentResult(null);

      // Step 1: Validate all conditions
      const validationError = validatePaymentConditions();
      if (validationError) {
        setPaymentResult({
          success: false,
          message: validationError,
        });
        return;
      }

      // Step 2: Check wallet connection
      const isConnected = await checkWalletConnection();
      if (!isConnected) {
        setPaymentResult({
          success: false,
          message: "Please connect your wallet first",
        });
        return;
      }

      // Safe to proceed - all validations passed
      if (!selectedChain || !selectedToken || !order || !requiredAmount) {
        throw new Error("Missing required data for payment");
      }

      const roundedAmount = roundTokenAmount(requiredAmount, selectedToken.decimals);
      console.log("Processing payment:", {
        selectedChain: selectedChain.chainId,
        selectedToken: selectedToken.address,
        outputChain: order.outChain,
        outputToken: order.outToken,
        amount: roundedAmount,
        orderUid: order.uid,
      });

      // Determine if same-chain or cross-chain
      const isSameChain = selectedChain.chainId === order.outChain;
      
      if (isSameChain) {
        // Same-chain payment
        console.log("Processing same-chain payment...");
        const result = await sameChainPay(
          Number(selectedChain.chainId),
          selectedToken.address,
          order.outToken,
          roundedAmount,
          order.uid
        );

        setPaymentResult({
          success: true,
          message: "Same-chain payment completed successfully!",
          txHash: result.orderHash,
        });

      } else {
        // Cross-chain payment - all networks now supported
        console.log("Processing cross-chain payment...");
        const result = await crossChainPay(
          Number(selectedChain.chainId),
          Number(order.outChain),
          selectedToken.address,
          order.outToken,
          roundedAmount,
          Number(order.usdCents),
          order.merchant,
          order.uid
        );

        setPaymentResult({
          success: true,
          message: "Cross-chain payment completed successfully!",
          txHash: result.hash,
        });
      }

    } catch (error: unknown) {
      console.error("Payment failed:", error);
      
      let errorMessage = "Payment failed. Please try again.";
      
      // Handle specific error types
      if (error instanceof Error && error.message) {
        if (error.message.includes("insufficient")) {
          errorMessage = "Insufficient balance. Please check your wallet balance.";
        } else if (error.message.includes("rejected")) {
          errorMessage = "Transaction was rejected. Please try again.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Transaction timeout. Please check transaction status manually.";
        } else {
          errorMessage = `Payment failed: ${error.message}`;
        }
      }

      setPaymentResult({
        success: false,
        message: errorMessage,
      });

    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="absolute inset-0 w-20 h-20 bg-gray-900 rounded-full opacity-20 blur-sm transform scale-110 mx-auto"></div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Payment Details</h2>
            <p className="text-gray-600">Please wait while we fetch your payment information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 animate-fade-in">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="absolute inset-0 w-20 h-20 bg-red-600 rounded-full opacity-20 blur-sm transform scale-110 mx-auto animate-pulse"></div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Not Found</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Please check the payment link and try again, or contact the merchant for assistance.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No order data available</p>
        </div>
      </div>
    );
  }

  const expired = isExpired(order.deadline);
  const currentStatus =
    expired && order.status === "pending" ? "expired" : order.status;

  // Render different steps based on current step
  const renderContent = () => {
    switch (currentStep) {
      case "order-details":
        return (
          <div className="animate-fade-in">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 p-8 text-white">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Payment Request</h1>
                    <p className="text-gray-200">Secure cross-chain payment processing</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* Amount Display */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {formatAmount(order.usdCents)}
                  </div>
                  <p className="text-gray-600">Total Amount Due</p>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <label className="text-sm font-bold text-gray-700">Merchant</label>
                      </div>
                      <p className="text-gray-900 font-mono text-sm break-all">{order.merchant}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <label className="text-sm font-bold text-gray-700">Order ID</label>
                      </div>
                      <p className="text-gray-900 font-mono text-sm break-all">{order.uid}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <label className="text-sm font-bold text-gray-700">Created</label>
                      </div>
                      <p className="text-gray-900 font-medium">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <label className="text-sm font-bold text-gray-700">Status</label>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(currentStatus)}`}>
                          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Section */}
                <div className="pt-6 border-t border-gray-200">
                  {currentStatus === "pending" && !expired && (
                    <button
                      onClick={startPayment}
                      className="group w-full bg-black hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-3 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Pay Now
                        <svg className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  )}
                  {expired && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-700 font-bold text-lg">This payment request has expired</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "chain-selection":
        return (
          <div className="animate-fade-in">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 p-6 text-white">
                <div className="flex items-center">
                  <button
                    onClick={handleBack}
                    className="mr-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Select Network</h2>
                      <p className="text-gray-200">Choose your preferred blockchain network</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableChains.map((chain) => (
                    <button
                      key={chain.chainId}
                      onClick={() => handleChainSelect(chain)}
                      className="group p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300 text-left transform hover:-translate-y-1"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 group-hover:bg-black rounded-lg flex items-center justify-center transition-colors duration-300">
                          <span className="text-2xl group-hover:text-white transition-colors duration-300">{chain.logo}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-black transition-colors duration-300">
                            {chain.name}
                          </h3>
                          <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                            Pay with {chain.symbol}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-black transition-all duration-300 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "token-selection":
        return (
          <div className="animate-fade-in">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 p-6 text-white">
                <div className="flex items-center">
                  <button
                    onClick={handleBack}
                    className="mr-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Select Token</h2>
                      <p className="text-gray-200">Choose your payment token on {selectedChain?.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {availableTokens.map((token) => (
                    <button
                      key={token.address}
                      onClick={() => handleTokenSelect(token)}
                      className="group w-full p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300 text-left transform hover:-translate-y-1"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          {token.logoURI ? (
                            <img
                              src={token.logoURI}
                              alt={token.symbol}
                              className="w-12 h-12 rounded-full ring-2 ring-gray-200 group-hover:ring-black transition-all duration-300"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-bold">{token.symbol.charAt(0)}</span>
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-black transition-colors duration-300">
                            {token.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                              {token.symbol}
                            </span>
                            <span className="text-xs bg-gray-100 group-hover:bg-gray-900 group-hover:text-white px-2 py-1 rounded-full transition-colors duration-300">
                              {token.decimals} decimals
                            </span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-black transition-all duration-300 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "payment-confirmation":
        return (
          <div className="animate-fade-in">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 p-6 text-white">
                <div className="flex items-center">
                  <button
                    onClick={handleBack}
                    className="mr-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Confirm Payment</h2>
                      <p className="text-gray-200">Review and complete your transaction</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {loadingPrice ? (
                  <div className="text-center py-12">
                    <div className="relative mb-8">
                      <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <div className="absolute inset-0 w-16 h-16 bg-gray-900 rounded-full opacity-20 blur-sm transform scale-110 mx-auto"></div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Loading Token Information</h3>
                    <p className="text-gray-600">Fetching current prices and calculating amounts...</p>
                  </div>
                ) : tokenPriceData?.success && selectedChain && selectedToken ? (
                  <div className="space-y-6">
                    {/* Payment Summary Card */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Payment Summary</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-gray-600 font-medium">Total Amount</span>
                            <span className="text-2xl font-bold text-green-600">{formatAmount(order.usdCents)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-gray-600 font-medium">Network</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{selectedChain.logo}</span>
                              <span className="font-bold text-gray-900">{selectedChain.name}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center py-3">
                            <span className="text-gray-600 font-medium">Payment Token</span>
                            <div className="flex items-center space-x-2">
                              {selectedToken.logoURI && (
                                <img
                                  src={selectedToken.logoURI}
                                  alt={selectedToken.symbol}
                                  className="w-6 h-6 rounded-full"
                                />
                              )}
                              <span className="font-bold text-gray-900">{selectedToken.symbol}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-600 mb-1">Token Price</div>
                            <div className="text-xl font-bold text-gray-900">
                              ${Number(tokenPriceData.data?.price || 0).toFixed(6)}
                            </div>
                          </div>

                          <div className="p-4 bg-black text-white rounded-lg">
                            <div className="text-sm text-gray-300 mb-1">Required Amount</div>
                            <div className="text-2xl font-bold">
                              {selectedToken && requiredAmount
                                ? roundTokenAmount(requiredAmount, selectedToken.decimals).toFixed(Math.min(selectedToken.decimals, 8))
                                : "0"}{" "}
                              {selectedToken.symbol}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Auto-refresh Notice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-blue-700 text-sm font-medium">
                          Prices refresh automatically every minute to ensure accuracy
                        </p>
                      </div>
                    </div>

                    {/* Payment Result Display */}
                    {paymentResult && (
                      <div className={`p-4 rounded-lg border mb-6 ${paymentResult.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center">
                          <svg className={`w-5 h-5 mr-2 ${paymentResult.success ? 'text-green-500' : 'text-red-500'}`} 
                               fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {paymentResult.success ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                          </svg>
                          <p className={`font-medium ${paymentResult.success ? 'text-green-700' : 'text-red-700'}`}>
                            {paymentResult.message}
                          </p>
                        </div>
                        {paymentResult.txHash && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Transaction Hash:</span>
                            <br />
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                              {paymentResult.txHash}
                            </code>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Confirm Payment Button */}
                    <button
                      onClick={handleConfirmPayment}
                      disabled={processingPayment}
                      className={`group w-full font-bold py-4 px-8 rounded-lg transition-all duration-300 transform ${
                        processingPayment 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : paymentResult?.success
                          ? 'bg-gray-600 hover:bg-gray-700 text-white hover:-translate-y-1 hover:shadow-lg'
                          : 'bg-green-600 hover:bg-green-700 text-white hover:-translate-y-1 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        {processingPayment ? (
                          <>
                            <svg className="animate-spin w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing Payment...
                          </>
                        ) : paymentResult?.success ? (
                          <>
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Payment Completed
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-3 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Confirm Payment
                            <svg className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                      </div>
                    </button>

                    {/* Additional Payment Info */}
                    {!processingPayment && !paymentResult && (
                      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-sm text-gray-600">
                          <p className="mb-1">
                            <span className="font-medium">Payment Type:</span> {selectedChain?.chainId === order?.outChain ? 'Same-chain swap' : 'Cross-chain bridge'}
                          </p>
                          <p className="mb-1">
                            <span className="font-medium">Network:</span> {selectedChain?.name}
                          </p>
                          <p>
                            <span className="font-medium">Estimated Time:</span> {selectedChain?.chainId === order?.outChain ? '1-3 minutes' : '5-15 minutes'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to Load Token Information</h3>
                    <p className="text-gray-600 mb-4">Unable to fetch current token prices. Please try again.</p>
                    <button
                      onClick={() => selectedChain && selectedToken && handleTokenSelect(selectedToken)}
                      className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Indicator */}
        {currentStep !== "order-details" && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === "chain-selection" ? "bg-black text-white" : "bg-gray-200 text-gray-600"}`}>
                    1
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === "token-selection" ? "bg-black text-white" : "bg-gray-200 text-gray-600"}`}>
                    2
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === "payment-confirmation" ? "bg-black text-white" : "bg-gray-200 text-gray-600"}`}>
                    3
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Step {currentStep === "chain-selection" ? "1" : currentStep === "token-selection" ? "2" : "3"} of 3
                </div>
              </div>
              <div className="mt-3">
                <div className="flex space-x-2 text-xs">
                  <span className={currentStep === "chain-selection" ? "text-black font-bold" : "text-gray-500"}>Network</span>
                  <span className="text-gray-300">→</span>
                  <span className={currentStep === "token-selection" ? "text-black font-bold" : "text-gray-500"}>Token</span>
                  <span className="text-gray-300">→</span>
                  <span className={currentStep === "payment-confirmation" ? "text-black font-bold" : "text-gray-500"}>Confirm</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {renderContent()}
      </div>
    </div>
  );
};

export default PaymentPage;
