import { ethers } from 'ethers';
import { type EIP1193Provider } from '@0xsequence/network';
import { ProviderTransport } from './ProviderTransport.js';
export declare class SequenceWaasTransportProvider extends ethers.AbstractProvider implements EIP1193Provider {
    projectAccessKey: string;
    walletUrl: string;
    initialChainId: number;
    nodesUrl: string;
    jsonRpcProvider: ethers.JsonRpcProvider;
    currentNetwork: ethers.Network;
    transport: ProviderTransport;
    constructor(projectAccessKey: string, walletUrl: string, initialChainId: number, nodesUrl: string);
    request({ method, params }: {
        method: string;
        params?: any[];
    }): Promise<any>;
    getTransaction(txHash: string): Promise<ethers.TransactionResponse | null>;
    detectNetwork(): Promise<ethers.Network>;
    getChainId(): number;
    disconnect(): void;
}
