import {
  SDK as FusionX,
  Web3ProviderConnector,
  HashLock,
  PresetEnum,
} from "@1inch/cross-chain-sdk";
import { ethers } from "ethers";
import { abi as ERC20_ABI } from "../../contracts/ABIs/ERC20.json";

// Constants
const LOP = {
  1: "0x111111125421cA6dc452d289314280a0f8842A65",
  137: "0x111111125421ca6dc452d289314280a0f8842a65", //Polygon
  324: "", //zkSync
  56: "0x111111125421ca6dc452d289314280a0f8842a65", // Binance
  42161: "0x111111125421ca6dc452d289314280a0f8842a65", // Arbitrum
  43114: "0x111111125421ca6dc452d289314280a0f8842a65", // Avalanche
  10: "0x111111125421ca6dc452d289314280a0f8842a65", // Optimism
  250: "0x111111125421ca6dc452d289314280a0f8842a65", // Fantom
  100: "0x111111125421ca6dc452d289314280a0f8842a65", // Gnosis
  8453: "0x111111125421ca6dc452d289314280a0f8842a65", // Coinbase
  59144: "", // Linea
  146: "", // Sonic
  130: "", // Unichain
  // 501 : "", // Solana
} as const;

const RPC_URLs = {
  1: "https://eth.llamarpc.com",
  137: "https://polygon-mainnet.infura.io/v3/aff93f7de91f453bbe779e4815d4eaf2",
  56 : "https://bsc-mainnet.infura.io/v3/aff93f7de91f453bbe779e4815d4eaf2"
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

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      selectedAddress: string;
      isMetaMask?: boolean;
      on?: (...args: unknown[]) => void;
      removeListener?: (...args: unknown[]) => void;
      providers?: unknown[];
      _state?: { accounts?: string[]; isConnected?: boolean };
    };
  }
}

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

export async function crossChainPay(
  inChain: number,
  outChain: number,
  inToken: string,
  outToken: string,
  payAmount: number,
  _usdCents: number,
  _merchant: string,
  merchantOrderUuid: string
) {
  if (!window.ethereum) {
    throw new Error("No ethereum provider found");
  }
  
  // Switch to the input chain first (with auto-add if needed)
  try {
    console.log(`Switching to input network ${inChain}...`);
    await switchOrAddNetwork(inChain);
    console.log(`Successfully switched to network ${inChain}`);
  } catch (error) {
    console.error("Failed to switch to input network:", error);
    throw new Error(`Failed to switch to input network ${inChain}: ${error}`);
  }
  
  const _provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await _provider.getSigner();
  const buyer = await signer.getAddress();
  const Web3 = (await import("web3")).default;
  const web3 = new Web3(window.ethereum);

  const client = new FusionX({
    url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/1inch/cross-chain-x`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blockchainProvider: new Web3ProviderConnector(web3 as any),
  });

  const provider = new ethers.JsonRpcProvider(
    RPC_URLs[inChain as keyof typeof RPC_URLs],
    inChain
  );
  const token = new ethers.Contract(inToken, ERC20_ABI, provider);
  const spender = LOP[inChain as keyof typeof LOP];
  const [decimals, allowance] = await Promise.all([
    token.decimals(),
    token.balanceOf(buyer),
    token.allowance(buyer, spender),
  ]);

  const payAmountWei = ethers.parseUnits(String(payAmount), decimals); // bigint
  // await window.ethereum.request({
  //   method: "wallet_switchEthereumChain",
  //   params: [{ chainId: ethers.toBeHex(inChain) }],
  // });
  if (allowance < payAmountWei) {
    const tokenWithSigner = new ethers.Contract(inToken, ERC20_ABI, signer);
    const tx = await tokenWithSigner.approve(spender, ethers.MaxUint256);
    await tx.wait();
  }
  const quote = await client.getQuote({
    amount: payAmountWei.toString(),
    srcChainId: inChain,
    dstChainId: outChain,
    srcTokenAddress: inToken,
    dstTokenAddress: outToken,
    enableEstimate: true,
    walletAddress: buyer,
  });
  const preset = PresetEnum.fast;
  const secretsCount =
    quote.presets &&
    quote.presets[preset] &&
    typeof quote.presets[preset].secretsCount === "number"
      ? quote.presets[preset].secretsCount
      : 1;
  const secrets = Array.from({ length: secretsCount }).map(() => {
    const b = crypto.getRandomValues(new Uint8Array(32));
    return (
      "0x" +
      Array.from(b)
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("")
    );
  });
  const secretHashes = secrets.map(HashLock.hashSecret);
  const hashLock =
    secrets.length === 1
      ? HashLock.forSingleFill(secrets[0])
      : HashLock.forMultipleFills(HashLock.getMerkleLeaves(secrets));

  const { hash, quoteId, order } = client.createOrder(quote, {
    walletAddress: buyer,
    hashLock,
    receiver: "0xaDFC29f0a6114020b843a940ff39a83df87D79BE",
    preset,
    secretHashes,
  });
  console.log("Order created:", hash);

  // Submit the order mapping to the backend
  try {
    if (token) {
      const mappingResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/order/mapping`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            merchantOrderUuid,
            orderhash: hash,
            quoteId: quote.quoteId,
            secrets,
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
    } else {
      console.warn("No auth token found, skipping order mapping");
    }
  } catch (error) {
    console.error("Error creating order mapping:", error);
    // Don't fail the entire payment process if mapping fails
  }

  const submitResult = await client.submitOrder(
    inChain,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    order as any,
    quoteId,
    secretHashes
  );
  console.log("Order submitted:", submitResult);

  return {
    success: true,
    hash,
    quoteId,
    order,
    submitResult,
    merchantOrderUuid,
  };
}
