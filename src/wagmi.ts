import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, base, mainnet, optimism, polygon } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'RainbowKit demo',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '9ff453fc037b1e1a5d7bc54638d9b51a', // Temporary fallback
  chains: [mainnet, polygon, optimism, arbitrum, base],
});