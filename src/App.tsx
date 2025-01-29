import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";

import { Connected } from "./Connected";

import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { SequenceCrossAppConnector } from "@dynamic-labs-connectors/sequence-cross-app-evm";

const sequenceCrossAppConnector = SequenceCrossAppConnector(
  {
    id: "edenonline",
    name: "Eden Online",
    icon: "https://iconic.dynamic-static-assets.com/icons/sprite.svg#edenonline",
  },
  {
    projectAccessKey: "AQAAAAAAAEGvyZiWA9FMslYeG_yayXaHnSI",
    walletUrl: "https://wallet.edenonline.xyz/",
    initialChainId: 42161,
  }
);

const App = () => (
  <DynamicContextProvider
    settings={{
      environmentId: "b01b80c1-0610-4d0a-84a5-ba34b371b0f4",
      walletConnectors: [EthereumWalletConnectors, sequenceCrossAppConnector],
    }}
  >
    <div
      style={{
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <DynamicWidget />
      <Connected />
    </div>
  </DynamicContextProvider>
);

export default App;
