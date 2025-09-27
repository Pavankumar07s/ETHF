import React, { useState } from 'react';
import tokensData from '../constants/tokens.json';
import { createOrder } from '../lib/order-service';

interface Token {
  chainId: number;
  address: string;
  name: string;
  decimals: number;
  symbol: string;
  logoURI: string;
  tags?: string[];
}

interface Chain {
  name: string;
  tokens: Token[];
}

interface TokensData {
  [chainId: string]: Chain;
}

interface OrderResponse {
  success: boolean;
  message: string;
  uid?: string;
  order?: object;
  error?: string;
}

const chainNames: { [key: string]: string } = {
  '1': 'Ethereum Mainnet',
  '10': 'Optimism',
  '56': 'BNB Smart Chain',
  '100': 'Gnosis Chain',
  '137': 'Polygon',
  '250': 'Fantom',
  '42161': 'Arbitrum One',
  '43114': 'Avalanche',
  '8453': 'Base',
  '59144': 'Linea',
  '324': 'zkSync Era',
  '534352': 'Scroll',
  '1101': 'Polygon zkEVM',
};

const chainLogos: { [key: string]: React.ReactElement } = {
  '1': ( // Ethereum
    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
    </svg>
  ),
  '10': ( // Optimism
    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="7" cy="12" r="3"/>
      <circle cx="17" cy="12" r="3"/>
      <path d="M7 9a3 3 0 0 0-3 3v0a3 3 0 0 0 6 0v0a3 3 0 0 0-3-3zM17 9a3 3 0 0 0-3 3v0a3 3 0 0 0 6 0v0a3 3 0 0 0-3-3z"/>
    </svg>
  ),
  '56': ( // BNB Smart Chain
    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 3.09L22 8l-3.09 3.09L22 14l-6.91 6.91L12 22l-3.09-1.09L2 14l3.09-3.09L2 8l6.91-6.91L12 2zm0 2.83L9.17 7.66 5.83 11 9.17 14.34 12 17.17l2.83-2.83L18.17 11l-3.34-3.34L12 4.83z"/>
    </svg>
  ),
  '100': ( // Gnosis Chain
    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 8v6m11-7h-6m-8 0H1m15.5-6.5l-4.24 4.24m-8.48 0L7.5 6.5m12.02 12.02l-4.24-4.24m-8.48 0l4.24 4.24"/>
    </svg>
  ),
  '137': ( // Polygon
    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  ),
  '250': ( // Fantom
    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l10 5.5v9L12 22l-10-5.5v-9L12 2zm0 2.2L4.5 8.8v6.4L12 19.8l7.5-4.6V8.8L12 4.2z"/>
      <path d="M12 6l6 3v6l-6 3-6-3V9l6-3z"/>
    </svg>
  ),
  '42161': ( // Arbitrum One
    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l10 18H2L12 2zm0 4L6 16h12L12 6z"/>
    </svg>
  ),
  '43114': ( // Avalanche
    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 22h20L12 2zm0 4l6 12H6l6-12z"/>
      <path d="M12 8l3 6H9l3-6z"/>
    </svg>
  ),
  '8453': ( // Base
    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 12h8M12 8v8"/>
    </svg>
  ),
  '59144': ( // Linea
    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 6h20v2H2V6zm0 5h20v2H2v-2zm0 5h20v2H2v-2z"/>
    </svg>
  ),
  '324': ( // zkSync Era
    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L4 6.5v11L12 22l8-4.5v-11L12 2zm0 2.5l6 3.25v8.5l-6 3.25-6-3.25v-8.5l6-3.25z"/>
      <path d="M12 8v8l4-2v-4l-4-2zm-4 2v4l4 2V8l-4 2z"/>
    </svg>
  ),
  '534352': ( // Scroll
    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/>
      <circle cx="2" cy="7" r="1"/>
      <circle cx="2" cy="12" r="1"/>
      <circle cx="2" cy="17" r="1"/>
    </svg>
  ),
  '1101': ( // Polygon zkEVM
    <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
};

const TokenSelector: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showTokens, setShowTokens] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResponse | null>(null);
  
  // Order form state
  const [orderForm, setOrderForm] = useState({
    merchant: '0x2736AA5eae06a273AceAa9C9FA3eA88c0a669652',
    usdCents: '1000', // $10.00
    deadlineSec: '6000' // 100 minutes
  });

  const data = tokensData as TokensData;
  const availableChains = Object.keys(data).filter(chainId => chainNames[chainId]);

  const createOrderHandler = async () => {
    if (!selectedToken || !selectedChain) return;
    
    setIsCreatingOrder(true);
    setOrderResult(null);
    
    const orderRequest = {
      merchant: orderForm.merchant,
      outToken: selectedToken.address,
      outChain: selectedChain,
      usdCents: orderForm.usdCents,
      deadlineSec: orderForm.deadlineSec
    };
    
    try {
      const result: OrderResponse = await createOrder(orderRequest);
      setOrderResult(result);
      
      if (result.success) {
        console.log('Order created successfully:', result);
      } else {
        console.error('Order creation failed:', result.error);
      }
    } catch (error) {
      console.error('Network error:', error);
      setOrderResult({
        success: false,
        message: 'Network error occurred',
        error: error instanceof Error ? error.message : 'Unknown network error'
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleChainSelect = (chainId: string) => {
    setSelectedChain(chainId);
    setSelectedToken(null);
    setShowTokens(true);
    setShowOrderForm(false);
    setOrderResult(null);
  };

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setShowOrderForm(false);
    setOrderResult(null);
  };

  const handleProceed = () => {
    setShowOrderForm(true);
  };

  const handleBack = () => {
    if (orderResult) {
      setOrderResult(null);
    } else if (showOrderForm) {
      setShowOrderForm(false);
    } else if (selectedToken) {
      setSelectedToken(null);
    } else if (showTokens) {
      setShowTokens(false);
      setSelectedChain('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Enhanced Header */}
        <div className="mb-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-fade-in">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Token Selector</h1>
                <p className="text-gray-600">Select blockchain and token for trading</p>
              </div>
            </div>
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-6 4h4" />
                </svg>
                <span className="text-gray-600 font-medium">Home</span>
              </div>
              {selectedChain && (
                <>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-300">
                    <span className="text-gray-700 font-medium">{chainNames[selectedChain]}</span>
                  </div>
                </>
              )}
              {selectedToken && (
                <>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-black text-white rounded-full">
                    <img
                      src={selectedToken.logoURI}
                      alt={selectedToken.symbol}
                      className="w-4 h-4 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/16x16/gray/white?text=' + selectedToken.symbol.charAt(0);
                      }}
                    />
                    <span className="font-medium">{selectedToken.symbol}</span>
                  </div>
                </>
              )}
              {showOrderForm && (
                <>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-600 text-white rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">Order Details</span>
                  </div>
                </>
              )}
              {orderResult && (
                <>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 text-white rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="font-medium">Order Result</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Back Button */}
        {(showTokens || selectedToken || showOrderForm || orderResult) && (
          <button
            onClick={handleBack}
            className="mb-6 inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-all duration-200 animate-fade-in"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        )}

        {/* Chain Selection */}
        {!showTokens && !selectedToken && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Select Blockchain Network</h2>
                  <p className="text-gray-600">Choose a blockchain to view available tokens</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableChains.map((chainId) => (
                  <button
                    key={chainId}
                    onClick={() => handleChainSelect(chainId)}
                    className="group p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300 text-left transform hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-gray-100 group-hover:bg-black rounded-lg flex items-center justify-center transition-colors duration-300">
                        {chainLogos[chainId] || (
                          <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-500 group-hover:text-black transition-colors duration-300">Chain ID</div>
                        <div className="text-lg font-bold text-black">{chainId}</div>
                      </div>
                    </div>
                    <div className="font-bold text-gray-900 text-lg mb-2 group-hover:text-black transition-colors duration-300">
                      {chainNames[chainId]}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
                        {data[chainId]?.tokens?.length || 0} tokens available
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
        )}

        {/* Token List */}
        {showTokens && selectedChain && !selectedToken && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Available Tokens</h2>
                    <p className="text-gray-600">Select a token from {chainNames[selectedChain]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Tokens</div>
                  <div className="text-2xl font-bold text-black">{data[selectedChain]?.tokens?.length || 0}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {data[selectedChain]?.tokens?.slice(0, 50).map((token, index) => (
                  <button
                    key={`${token.address}-${index}`}
                    onClick={() => handleTokenSelect(token)}
                    className="group p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300 text-left transform hover:-translate-y-1"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={token.logoURI}
                          alt={token.symbol}
                          className="w-10 h-10 rounded-full ring-2 ring-gray-200 group-hover:ring-black transition-all duration-300"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/40x40/gray/white?text=' + token.symbol.charAt(0);
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate group-hover:text-black transition-colors duration-300">
                          {token.symbol}
                        </div>
                        <div className="text-sm text-gray-500 truncate group-hover:text-gray-700 transition-colors duration-300">
                          {token.name}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {data[selectedChain]?.tokens?.length > 50 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Showing first 50 of {data[selectedChain].tokens.length} total tokens
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Token Details */}
        {selectedToken && !showOrderForm && !orderResult && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Token Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 p-6 text-white">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <img
                      src={selectedToken.logoURI}
                      alt={selectedToken.symbol}
                      className="w-20 h-20 rounded-full ring-4 ring-white/20"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/80x80/gray/white?text=' + selectedToken.symbol.charAt(0);
                      }}
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-2">{selectedToken.symbol}</h3>
                    <p className="text-gray-200 text-lg">{selectedToken.name}</p>
                    <div className="flex items-center mt-3 space-x-3">
                      <div className="flex items-center px-3 py-1 bg-white/10 rounded-full">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="text-sm font-medium">{chainNames[selectedChain]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Chain Information */}
                  <div className="space-y-4">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Chain Information</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                          </svg>
                          <span className="text-gray-600 font-medium">Network</span>
                        </div>
                        <span className="text-gray-900 font-bold">{chainNames[selectedChain]}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          <span className="text-gray-600 font-medium">Chain ID</span>
                        </div>
                        <span className="text-gray-900 font-bold">{selectedToken.chainId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Token Information */}
                  <div className="space-y-4">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Token Information</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="text-gray-600 font-medium">Symbol</span>
                        </div>
                        <span className="text-gray-900 font-bold">{selectedToken.symbol}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-600 font-medium">Decimals</span>
                        </div>
                        <span className="text-gray-900 font-bold">{selectedToken.decimals}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center mb-2">
                          <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-gray-600 font-medium">Contract Address</span>
                        </div>
                        <div className="font-mono text-sm bg-white p-3 rounded border border-gray-200 break-all">
                          {selectedToken.address}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags Section */}
                {selectedToken.tags && selectedToken.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Tags</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedToken.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full border border-gray-200 hover:bg-gray-900 hover:text-white transition-colors duration-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proceed Button */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center">
                  <button
                    onClick={handleProceed}
                    className="group relative bg-black hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Proceed to Create Order
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Form */}
        {showOrderForm && selectedToken && !orderResult && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Order Form Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 p-6 text-white">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Create Order</h2>
                    <p className="text-gray-200">Configure your trading order parameters</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Selected Token Summary */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg mb-8 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Selected Token</h3>
                      <div className="flex items-center space-x-4">
                        <img
                          src={selectedToken.logoURI}
                          alt={selectedToken.symbol}
                          className="w-12 h-12 rounded-full ring-2 ring-white"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/48x48/gray/white?text=' + selectedToken.symbol.charAt(0);
                          }}
                        />
                        <div>
                          <div className="font-bold text-xl text-gray-900">{selectedToken.symbol}</div>
                          <div className="text-gray-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            {chainNames[selectedChain]}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Contract Address</div>
                      <div className="font-mono text-xs bg-white p-2 rounded border border-gray-300 max-w-40 truncate">
                        {selectedToken.address}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Form Fields */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Order Configuration</h4>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Merchant Address
                        </div>
                      </label>
                      <input
                        type="text"
                        value={orderForm.merchant}
                        onChange={(e) => setOrderForm({...orderForm, merchant: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-300 font-mono text-sm"
                        placeholder="0x..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Amount (USD Cents)
                          </div>
                        </label>
                        <input
                          type="number"
                          value={orderForm.usdCents}
                          onChange={(e) => setOrderForm({...orderForm, usdCents: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-300"
                          placeholder="1000"
                        />
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-sm text-gray-600">Equivalent Amount</div>
                          <div className="text-2xl font-bold text-green-600">
                            ${(parseInt(orderForm.usdCents) / 100).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Deadline (Seconds)
                          </div>
                        </label>
                        <input
                          type="number"
                          value={orderForm.deadlineSec}
                          onChange={(e) => setOrderForm({...orderForm, deadlineSec: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-300"
                          placeholder="6000"
                        />
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-sm text-gray-600">Time Duration</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(parseInt(orderForm.deadlineSec) / 60)} min
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Request Preview */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Request Preview</h4>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-6 rounded-lg border border-gray-200 overflow-x-auto">
                    <pre className="text-sm whitespace-pre-wrap">
{JSON.stringify({
  merchant: orderForm.merchant,
  outToken: selectedToken.address,
  outChain: selectedChain,
  usdCents: orderForm.usdCents,
  deadlineSec: orderForm.deadlineSec
}, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Create Order Button */}
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={createOrderHandler}
                    disabled={isCreatingOrder}
                    className="group relative bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-12 rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg disabled:transform-none disabled:shadow-none"
                  >
                    <div className="flex items-center">
                      {isCreatingOrder ? (
                        <svg className="animate-spin w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 mr-3 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                      {isCreatingOrder ? 'Creating Order...' : 'Create Order'}
                      {!isCreatingOrder && (
                        <svg className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Result */}
        {orderResult && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Result Header */}
              <div className={`p-6 text-white ${orderResult.success ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-red-600 to-red-700'}`}>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mr-4">
                    {orderResult.success ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Order Result</h2>
                    <p className="text-gray-200">
                      {orderResult.success ? 'Your order has been processed' : 'Order processing failed'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {orderResult.success ? (
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Order Created Successfully!</h3>
                    <p className="text-gray-600 mb-8 text-lg">{orderResult.message}</p>
                    
                    {orderResult.uid && (
                      <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200 mb-6">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900">Order UID</h4>
                        </div>
                        <div className="font-mono text-sm font-bold bg-white p-4 rounded border border-green-300 break-all">
                          {orderResult.uid}
                        </div>
                      </div>
                    )}
                    
                    {orderResult.order && (
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-left">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900">Order Details</h4>
                        </div>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded border border-gray-300 overflow-auto max-h-64">
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(orderResult.order, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                      <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Order Creation Failed</h3>
                    <p className="text-gray-600 mb-8 text-lg">{orderResult.message}</p>
                    
                    {orderResult.error && (
                      <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900">Error Details</h4>
                        </div>
                        <div className="bg-white p-4 rounded border border-red-300">
                          <p className="text-sm text-red-700 font-medium">{orderResult.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenSelector;