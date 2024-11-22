import { type WalletConnectorsMethod, type WalletMetadata } from '@dynamic-labs/wallet-connector-core';
import { CrossAppTransportConfig } from './SequenceCrossAppConnector.js';
export declare const createSequenceCrossAppConnector: (metadata: WalletMetadata, transportConfig: CrossAppTransportConfig) => WalletConnectorsMethod;
