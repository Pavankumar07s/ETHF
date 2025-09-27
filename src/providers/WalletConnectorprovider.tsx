import * as React from "react";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "../config";

const queryClient = new QueryClient();

export function WalletConnectorprovider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider showRecentTransactions={true} >
          {children}
        </RainbowKitProvider>{" "}
      </QueryClientProvider>
    </WagmiProvider>
  );
}