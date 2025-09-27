import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, base, mainnet, optimism, polygon, bsc } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'ETH Global Cross-Chain Payment Gateway',
  projectId: '21fef48091f12692cad574a6f7753643',
  chains: [mainnet, polygon, optimism, arbitrum, base, bsc],
});