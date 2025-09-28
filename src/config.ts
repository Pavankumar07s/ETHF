import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { mainnet, polygon, optimism, } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "2f5a6b8c9d1e2f3a4b5c6d7e8f9a0b1c", // Temporary fallback
  chains: [mainnet, polygon, optimism],
  ssr: true, // If your dApp uses server side rendering (SSR)
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
  },
});

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  API_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api",
};