import { EthereumInjectedConnector } from '@dynamic-labs/ethereum';
import { DynamicError } from '@dynamic-labs/utils';
import { findWalletBookWallet } from '@dynamic-labs/wallet-book';
import { toHex } from 'viem';
import { SequenceWaasTransportProvider } from './SequenceWaasTransportProvider.js';
export class SequenceCrossAppConnector extends EthereumInjectedConnector {
    get name() {
        return this.walletName;
    }
    supportsNetworkSwitching() {
        return false;
    }
    isInstalledOnBrowser() {
        return true;
    }
    findProvider() {
        return this.sequenceWaasTransportProvider;
    }
    async signMessage(message) {
        const provider = this.findProvider();
        if (!provider) {
            throw new DynamicError('No provider found');
        }
        const address = await this.getAddress();
        return await provider.request({
            method: 'personal_sign',
            params: [
                toHex(message),
                address
            ]
        });
    }
    endSession() {
        this.sequenceWaasTransportProvider.disconnect();
        return Promise.resolve();
    }
    constructor(props){
        var _props_metadata;
        super(props);
        this.nodesUrl = 'https://nodes.sequence.app';
        if (!((_props_metadata = props.metadata) == null ? void 0 : _props_metadata.id)) {
            throw new Error('Metadata prop id is required');
        }
        this.walletName = props.metadata.id;
        this.sequenceWaasTransportProvider = new SequenceWaasTransportProvider(props.transportConfig.projectAccessKey, props.transportConfig.walletUrl, props.transportConfig.initialChainId, this.nodesUrl);
        this.wallet = findWalletBookWallet(this.walletBook, this.key);
    }
}
