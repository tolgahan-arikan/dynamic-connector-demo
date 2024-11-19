import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";
import { SequenceCrossAppConnector } from "./connector";

const App = () => (
  <DynamicContextProvider
    settings={{
      environmentId: "b01b80c1-0610-4d0a-84a5-ba34b371b0f4",
      walletConnectors: [() => [SequenceCrossAppConnector]],
    }}
  >
    <DynamicWidget />
  </DynamicContextProvider>
);

export default App;
