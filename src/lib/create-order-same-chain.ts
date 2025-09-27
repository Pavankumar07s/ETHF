import {
  FusionSDK,
  OrderStatus,
  PresetEnum,
  Web3ProviderConnector,
} from "@1inch/fusion-sdk";
import { ethers } from "ethers";
import { abi as ERC20_ABI } from "../../contracts/ABIs/ERC20.json";

const RPC_URLs = {
  1: "https://eth.llamarpc.com",
  137: "https://polygon-mainnet.infura.io/v3/aff93f7de91f453bbe779e4815d4eaf2",
  56: "https://bsc-mainnet.infura.io/v3/aff93f7de91f453bbe779e4815d4eaf2",
};

// Network configurations for wallet_addEthereumChain
const NETWORK_CONFIGS = {
  1: {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://eth.llamarpc.com"],
    blockExplorerUrls: ["https://etherscan.io"],
  },
  56: {
    chainId: "0x38",
    chainName: "BNB Smart Chain",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.binance.org"],
    blockExplorerUrls: ["https://bscscan.com"],
  },
  137: {
    chainId: "0x89",
    chainName: "Polygon Mainnet",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"],
  },
  42161: {
    chainId: "0xa4b1",
    chainName: "Arbitrum One",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://arbiscan.io"],
  },
  10: {
    chainId: "0xa",
    chainName: "Optimism",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.optimism.io"],
    blockExplorerUrls: ["https://optimistic.etherscan.io"],
  },
  43114: {
    chainId: "0xa86a",
    chainName: "Avalanche Network",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://snowtrace.io"],
  },
  8453: {
    chainId: "0x2105",
    chainName: "Base",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"],
  },
  324: {
    chainId: "0x144",
    chainName: "zkSync Era",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.era.zksync.io"],
    blockExplorerUrls: ["https://explorer.zksync.io"],
  },
};

// Function to add network to wallet
const addNetworkToWallet = async (chainId: number): Promise<void> => {
  if (!window.ethereum) {
    throw new Error("No ethereum provider found");
  }

  const networkConfig = NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS];
  if (!networkConfig) {
    throw new Error(`Network configuration not found for chain ${chainId}`);
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [networkConfig],
    });
  } catch (error) {
    console.error("Failed to add network:", error);
    throw new Error(`Failed to add ${networkConfig.chainName} network to wallet`);
  }
};

// Function to switch network with fallback to add network
const switchOrAddNetwork = async (chainId: number): Promise<void> => {
  if (!window.ethereum) {
    throw new Error("No ethereum provider found");
  }

  try {
    // Try to switch to the network first
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ethers.toBeHex(chainId) }],
    });
  } catch (switchError: unknown) {
    console.log("Switch network error:", switchError);
    
    // If the network is not added (error code 4902), add it first
    if (switchError && typeof switchError === 'object' && 'code' in switchError && switchError.code === 4902) {
      console.log(`Network ${chainId} not found in wallet, adding it...`);
      await addNetworkToWallet(chainId);
      
      // After adding, try to switch again
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ethers.toBeHex(chainId) }],
        });
      } catch (secondSwitchError) {
        console.error("Failed to switch after adding network:", secondSwitchError);
        throw new Error(`Failed to switch to network ${chainId} after adding it`);
      }
    } else {
      // If it's a different error, throw it
      const errorMessage = switchError && typeof switchError === 'object' && 'message' in switchError 
        ? String(switchError.message) 
        : 'Unknown error';
      throw new Error(`Failed to switch to network ${chainId}: ${errorMessage}`);
    }
  }
};

export async function connect() {
  if (!window.ethereum) {
    throw new Error("No ethereum provider found");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  console.log("Connected to:", address);
  return { provider, signer, address };
}

export async function sameChainPay(
  chain: number,
  inToken: string,
  outToken: string,
  payAmount: number,
  merchantOrderUuid: string
) {
  console.log("payAmount", payAmount);
  console.log("same chain function started");
  
  if (!window.ethereum) {
    throw new Error("No ethereum provider found");
  }
  
  // Switch to the correct network first (with auto-add if needed)
  try {
    console.log(`Switching to network ${chain}...`);
    await switchOrAddNetwork(chain);
    console.log(`Successfully switched to network ${chain}`);
  } catch (error) {
    console.error("Failed to switch network:", error);
    throw new Error(`Failed to switch to network ${chain}: ${error}`);
  }
  
  const _provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await _provider.getSigner();
  const buyer = await signer.getAddress();
  const Web3 = (await import("web3")).default;
  const web3 = new Web3(window.ethereum);

  const client = new FusionSDK({
    url: "http://localhost:3001/api/1inch/same-chain-x",
    network: chain,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blockchainProvider: new Web3ProviderConnector(web3 as any),
  });

  const provider = new ethers.JsonRpcProvider(
    RPC_URLs[chain as keyof typeof RPC_URLs],
    chain
  );
  
  if (!RPC_URLs[chain as keyof typeof RPC_URLs]) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  
  const token = new ethers.Contract(inToken, ERC20_ABI, provider);

  const [decimals, balance] = await Promise.all([
    token.decimals(),
    token.balanceOf(buyer),
  ]);
  
  console.log("wallet token info: balance =", balance.toString(), "decimals =", decimals);
  const payAmountWei = ethers.parseUnits(String(payAmount), decimals);
  
  // Check if user has sufficient balance
  if (balance < payAmountWei) {
    throw new Error(`Insufficient balance. Required: ${ethers.formatUnits(payAmountWei, decimals)}, Available: ${ethers.formatUnits(balance, decimals)}`);
  }

  console.log("payAmountWei", payAmountWei.toString());

  const params = {
    amount: payAmountWei.toString(),
    fromTokenAddress: inToken,
    toTokenAddress: outToken,
    enableEstimate: true,
    receiver: "0xaDFC29f0a6114020b843a940ff39a83df87D79BE",
    walletAddress: buyer,
  };
  
  console.log("Quote params:", params);
  
  let quote;
  try {
    quote = await client.getQuote(params);
    console.log("Quote received:", quote);
  } catch (error) {
    console.error("Failed to get quote:", error);
    throw new Error("Failed to get quote from 1inch API");
  }
  
  if (!quote || !quote.settlementAddress) {
    throw new Error("Invalid quote received from API");
  }
  
  // Convert Address2 object to string - 1inch SDK returns Address2 object
  const spender = typeof quote.settlementAddress === 'string' 
    ? quote.settlementAddress 
    : quote.settlementAddress.toString();
  console.log("Settlement address (spender):", spender);
  
  // Check and handle allowance with the correct spender
  const allowance = await token.allowance(buyer, spender);
  console.log("Current allowance:", allowance.toString());
  
  if (allowance < payAmountWei) {
    console.log("Approving token spend...");
    const tokenWithSigner = new ethers.Contract(inToken, ERC20_ABI, signer);
    const tx = await tokenWithSigner.approve(spender, ethers.MaxUint256);
    console.log("Approval transaction:", tx.hash);
    await tx.wait();
    console.log("Approval confirmed");
    
    // Wait a moment for the approval to be properly indexed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify the approval was successful
    const newAllowance = await token.allowance(buyer, spender);
    console.log("New allowance after approval:", newAllowance.toString());
  }
  
  const preset = PresetEnum.fast;
  let orderHash;
  
  try {
    console.log("Placing order using placeOrder method...");
    const placeOrderParams = {
      fromTokenAddress: inToken,
      toTokenAddress: outToken,
      amount: payAmountWei.toString(),
      walletAddress: buyer,
      receiver: "0xaDFC29f0a6114020b843a940ff39a83df87D79BE",
      preset,
    };
    console.log("placeOrder params:", placeOrderParams);
    
    const orderResult = await client.placeOrder(placeOrderParams);
    orderHash = orderResult.orderHash;
    console.log("Order placed with hash:", orderHash);

    // Submit order mapping to backend (now we have the actual order hash)
    try {
      const mappingResponse = await fetch(
        "http://localhost:3001/api/order/mapping",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            merchantOrderUuid,
            orderhash: orderHash,
            quoteId: quote.quoteId, // Use the original quote ID
            secrets: [],
          }),
        }
      );

      if (mappingResponse.ok) {
        const mappingData = await mappingResponse.json();
        console.log("Order mapping created:", mappingData);
      } else {
        console.error(
          "Failed to create order mapping:",
          await mappingResponse.text()
        );
      }
    } catch (error) {
      console.error("Error creating order mapping:", error);
      // Don't fail the entire payment process if mapping fails
    }
    
  } catch (error) {
    console.error("Failed to place order:", error);
    
    // Extract more detailed error information
    if (error && typeof error === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = error as any;
      if (axiosError.response) {
        console.error("Error response status:", axiosError.response.status);
        console.error("Error response data:", axiosError.response.data);
        console.error("Error response headers:", axiosError.response.headers);
        
        // Provide user-friendly error messages for common issues
        if (axiosError.response.status === 400) {
          const errorData = axiosError.response.data;
          console.log("Full error data:", JSON.stringify(errorData, null, 2));
          
          if (errorData?.description === "NotEnoughBalanceOrAllowance") {
            throw new Error("This token may not be supported for Fusion orders on BSC, or there may be insufficient liquidity. The API reports 'NotEnoughBalanceOrAllowance' but you have sufficient balance. Try using WBNB, USDT, or USDC instead.");
          } else if (errorData?.description?.includes("token") || errorData?.error?.includes("token")) {
            throw new Error("This token may not be supported for Fusion orders on this network. Try using WBNB, USDT, or USDC instead.");
          } else if (errorData?.description?.includes("amount") || errorData?.description?.includes("minimum")) {
            throw new Error("Order amount may be too small. Try increasing the order size to at least $50 USD equivalent.");
          }
        }
      }
      if (axiosError.request) {
        console.error("Error request config:", axiosError.config);
      }
    }
    
    throw new Error(`Order placement failed. This token may not be supported for Fusion orders on BSC. Try using WBNB, USDT, or USDC instead. Original error: ${error}`);
  }

  // Monitor order status with timeout
  const maxAttempts = 40; // 2 minutes max (3 seconds * 40)
  let attempts = 0;
  
  console.log("Monitoring order status...");
  
  while (attempts < maxAttempts) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const status = await client.getOrderStatus(orderHash);
      console.log(`Order status check ${attempts + 1}:`, status);
      
      if (status.status === OrderStatus.Filled) {
        console.log("Order successfully filled!");
        return {
          success: true,
          orderHash,
          status: status.status,
          details: status,
          merchantOrderUuid,
        };
      }
      
      if (status.status === OrderStatus.Expired) {
        throw new Error("Order expired - please try again with a new order");
      }
      
      if (status.status === OrderStatus.Cancelled) {
        throw new Error("Order was cancelled");
      }
      
      attempts++;
    } catch (statusError) {
      console.error("Error checking order status:", statusError);
      if (attempts >= maxAttempts - 1) {
        throw new Error(`Order status monitoring failed: ${statusError}`);
      }
      attempts++;
    }
  }
  
  throw new Error("Order processing timeout - please check order status manually");
}
