import { type EthereumWalletConnectorOpts } from '@dynamic-labs/ethereum-core';
import { EthereumInjectedConnector, type IEthereum } from '@dynamic-labs/ethereum';
import { SequenceWaasTransportProvider } from './SequenceWaasTransportProvider.js';
export type CrossAppTransportConfig = {
    projectAccessKey: string;
    walletUrl: string;
    initialChainId: number;
};
export declare class SequenceCrossAppConnector extends EthereumInjectedConnector {
    private readonly nodesUrl;
    private readonly walletName;
    sequenceWaasTransportProvider: SequenceWaasTransportProvider;
    get name(): string;
    constructor(props: EthereumWalletConnectorOpts & {
        transportConfig: CrossAppTransportConfig;
    });
    supportsNetworkSwitching(): boolean;
    isInstalledOnBrowser(): boolean;
    findProvider(): IEthereum | undefined;
    signMessage(message: string): Promise<string>;
    endSession(): Promise<void>;
}
