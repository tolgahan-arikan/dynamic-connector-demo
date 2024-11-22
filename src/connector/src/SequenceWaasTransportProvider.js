import { ethers } from 'ethers';
import { allNetworks } from '@0xsequence/network';
import { getAddress, TransactionRejectedRpcError } from 'viem';
import { ProviderTransport } from './ProviderTransport.js';
export class SequenceWaasTransportProvider extends ethers.AbstractProvider {
    async request({ method, params }) {
        if (method === 'eth_requestAccounts') {
            let walletAddress = this.transport.getWalletAddress();
            if (!walletAddress) {
                try {
                    const res = await this.transport.connect();
                    walletAddress = res.walletAddress;
                } catch (e) {
                    console.log(e);
                    throw e;
                }
            }
            const account = getAddress(walletAddress);
            return [
                account
            ];
        }
        if (method === 'wallet_switchEthereumChain') {
            var _allNetworks_find;
            const chainId = normalizeChainId(params == null ? void 0 : params[0].chainId);
            const networkName = (_allNetworks_find = allNetworks.find((n)=>n.chainId === chainId)) == null ? void 0 : _allNetworks_find.name;
            const jsonRpcProvider = new ethers.JsonRpcProvider(`${this.nodesUrl}/${networkName}/${this.projectAccessKey}`);
            this.jsonRpcProvider = jsonRpcProvider;
            this.currentNetwork = ethers.Network.from(chainId);
            return null;
        }
        if (method === 'eth_chainId') {
            return ethers.toQuantity(this.currentNetwork.chainId);
        }
        if (method === 'eth_accounts') {
            const address = this.transport.getWalletAddress();
            if (!address) {
                return [];
            }
            const account = getAddress(address);
            return [
                account
            ];
        }
        if (method === 'eth_sendTransaction') {
            if (!params) {
                throw new Error('No params');
            }
            try {
                const response = await this.transport.sendRequest(method, params, this.getChainId());
                if (response.code === 'transactionFailed') {
                    throw new TransactionRejectedRpcError(new Error(`Unable to send transaction: ${response.data.error}`));
                }
                if (response.code === 'transactionReceipt') {
                    const { txHash } = response.data;
                    return txHash;
                }
            } catch (e) {
                console.log('error in sendTransaction', e);
                throw new TransactionRejectedRpcError(new Error(`Unable to send transaction: wallet window was closed.`));
            }
        }
        if (method === 'eth_sign' || method === 'eth_signTypedData' || method === 'eth_signTypedData_v4' || method === 'personal_sign') {
            if (!params) {
                throw new Error('No params');
            }
            try {
                const response = await this.transport.sendRequest(method, params, this.getChainId());
                return response.data.signature;
            } catch (e) {
                console.log('error in sign', e);
                throw new TransactionRejectedRpcError(new Error(`Unable to sign: wallet window was closed.`));
            }
        }
        return await this.jsonRpcProvider.send(method, params != null ? params : []);
    }
    async getTransaction(txHash) {
        return await this.jsonRpcProvider.getTransaction(txHash);
    }
    detectNetwork() {
        return Promise.resolve(this.currentNetwork);
    }
    getChainId() {
        return Number(this.currentNetwork.chainId);
    }
    disconnect() {
        this.transport.disconnect();
    }
    constructor(projectAccessKey, walletUrl, initialChainId, nodesUrl){
        var _allNetworks_find;
        super(initialChainId);
        this.projectAccessKey = projectAccessKey;
        this.walletUrl = walletUrl;
        this.initialChainId = initialChainId;
        this.nodesUrl = nodesUrl;
        const initialChainName = (_allNetworks_find = allNetworks.find((n)=>n.chainId === initialChainId)) == null ? void 0 : _allNetworks_find.name;
        const initialJsonRpcProvider = new ethers.JsonRpcProvider(`${nodesUrl}/${initialChainName}/${projectAccessKey}`);
        this.transport = new ProviderTransport(walletUrl);
        this.jsonRpcProvider = initialJsonRpcProvider;
        this.currentNetwork = ethers.Network.from(initialChainId);
    }
}
function normalizeChainId(chainId) {
    if (typeof chainId === 'object') return normalizeChainId(chainId.chainId);
    if (typeof chainId === 'string') return Number.parseInt(chainId, chainId.trim().substring(0, 2) === '0x' ? 16 : 10);
    if (typeof chainId === 'bigint') return Number(chainId);
    return chainId;
}
