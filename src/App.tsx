import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";

import { createSequenceCrossAppConnector } from "./connector";

import { Connected } from "./Connected";

const App = () => (
  <DynamicContextProvider
    settings={{
      environmentId: "b01b80c1-0610-4d0a-84a5-ba34b371b0f4",
      walletConnectors: [
        () =>
          createSequenceCrossAppConnector(
            {
              id: "sequence",
              name: "Eden Online",
              icon: "https://pbs.twimg.com/profile_images/1842223593108676608/XYfC4XcH_400x400.jpg",
            },
            {
              projectAccessKey: "AQAAAAAAAEGvyZiWA9FMslYeG_yayXaHnSI",
              walletName: "sequence",
              walletUrl: "https://wallet.edenonline.xyz/",
              initialChainId: 42161,
            }
          ),
      ],
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
