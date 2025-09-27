import { Buffer } from 'buffer';
import process from 'process';

// Make these available globally
(window as any).global = window;
(window as any).Buffer = Buffer;
(window as any).process = process;

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { WalletConnectorprovider } from "./providers/WalletConnectorprovider.tsx";


createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <WalletConnectorprovider>
      <App />
    </WalletConnectorprovider>
  </BrowserRouter>
);
