import { type EthereumWalletConnectorOpts } from "@dynamic-labs/ethereum-core";
import {
  EthereumInjectedConnector,
  type IEthereum,
} from "@dynamic-labs/ethereum";
import { DynamicError } from "@dynamic-labs/utils";
import {
  WalletMetadata,
  WalletConnectorsMethod,
} from "@dynamic-labs/wallet-connector-core";
import { findWalletBookWallet } from "@dynamic-labs/wallet-book";
import { toHex, getAddress, TransactionRejectedRpcError } from "viem";
import { ethers } from "ethers";
import { allNetworks, EIP1193Provider } from "@0xsequence/network";

import { ProviderTransport } from "./providerTransport";

export const createSequenceCrossAppConnector = (
  metadata: WalletMetadata,
  transportConfig: CrossAppTransportConfig
): WalletConnectorsMethod => {
  return () => [
    class extends SequenceCrossAppConnector {
      constructor(props: EthereumWalletConnectorOpts) {
        super({
          ...props,
          metadata,
          transportConfig,
        });
      }
    },
  ];
};

export type CrossAppTransportConfig = {
  projectAccessKey: string;
  walletUrl: string;
  initialChainId: number;
};

export class SequenceCrossAppConnector extends EthereumInjectedConnector {
  private walletName: string;

  private nodesUrl = "https://nodes.sequence.app";

  sequenceWaasTransportProvider: SequenceWaasTransportProvider;

  /**
   * The name of the wallet connector
   * @override Required override from the base connector class
   */
  override get name() {
    return this.walletName;
  }

  /**
   * The constructor for the connector, with the relevant metadata
   * @param props The options for the connector
   */
  constructor(
    props: EthereumWalletConnectorOpts & {
      transportConfig: CrossAppTransportConfig;
    }
  ) {
    super({
      ...props,
    });

    this.walletName = props.metadata!.id;

    this.sequenceWaasTransportProvider = new SequenceWaasTransportProvider(
      props.transportConfig.projectAccessKey,
      props.transportConfig.walletUrl,
      props.transportConfig.initialChainId,
      this.nodesUrl
    );

    this.wallet = findWalletBookWallet(this.walletBook, this.key);
  }

  override supportsNetworkSwitching(): boolean {
    return false;
  }

  override isInstalledOnBrowser(): boolean {
    return true;
  }

  override findProvider(): IEthereum | undefined {
    return this.sequenceWaasTransportProvider as unknown as IEthereum;
  }

  override async signMessage(message: string): Promise<string> {
    const provider = this.findProvider();
    if (!provider) {
      throw new DynamicError("No provider found");
    }
    const address = await this.getAddress();
    return (await provider.request({
      method: "personal_sign",
      params: [toHex(message), address],
    })) as unknown as string;
  }

  override endSession(): Promise<void> {
    this.sequenceWaasTransportProvider.disconnect();
    return Promise.resolve();
  }
}

class SequenceWaasTransportProvider
  extends ethers.AbstractProvider
  implements EIP1193Provider
{
  jsonRpcProvider: ethers.JsonRpcProvider;
  currentNetwork: ethers.Network;

  transport: ProviderTransport;

  constructor(
    public projectAccessKey: string,
    public walletUrl: string,
    public initialChainId: number,
    public nodesUrl: string
  ) {
    super(initialChainId);

    const initialChainName = allNetworks.find(
      (n) => n.chainId === initialChainId
    )?.name;
    const initialJsonRpcProvider = new ethers.JsonRpcProvider(
      `${nodesUrl}/${initialChainName}/${projectAccessKey}`
    );

    this.transport = new ProviderTransport(walletUrl);
    this.jsonRpcProvider = initialJsonRpcProvider;
    this.currentNetwork = ethers.Network.from(initialChainId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async request({ method, params }: { method: string; params?: any[] }) {
    if (method === "eth_requestAccounts") {
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
      return [account];
    }

    if (method === "wallet_switchEthereumChain") {
      const chainId = normalizeChainId(params?.[0].chainId);

      const networkName = allNetworks.find((n) => n.chainId === chainId)?.name;
      const jsonRpcProvider = new ethers.JsonRpcProvider(
        `${this.nodesUrl}/${networkName}/${this.projectAccessKey}`
      );

      this.jsonRpcProvider = jsonRpcProvider;
      this.currentNetwork = ethers.Network.from(chainId);

      return null;
    }

    if (method === "eth_chainId") {
      return ethers.toQuantity(this.currentNetwork.chainId);
    }

    if (method === "eth_accounts") {
      const address = this.transport.getWalletAddress();
      if (!address) {
        return [];
      }
      const account = getAddress(address);
      return [account];
    }

    if (method === "eth_sendTransaction") {
      if (!params) {
        throw new Error("No params");
      }

      try {
        const response = await this.transport.sendRequest(
          method,
          params,
          this.getChainId()
        );

        if (response.code === "transactionFailed") {
          // Failed
          throw new TransactionRejectedRpcError(
            new Error(`Unable to send transaction: ${response.data.error}`)
          );
        }

        if (response.code === "transactionReceipt") {
          // Success
          const { txHash } = response.data;
          return txHash;
        }
      } catch (e) {
        console.log("error in sendTransaction", e);
        throw new TransactionRejectedRpcError(
          new Error(`Unable to send transaction: wallet window was closed.`)
        );
      }
    }

    if (
      method === "eth_sign" ||
      method === "eth_signTypedData" ||
      method === "eth_signTypedData_v4" ||
      method === "personal_sign"
    ) {
      if (!params) {
        throw new Error("No params");
      }
      try {
        const response = await this.transport.sendRequest(
          method,
          params,
          this.getChainId()
        );

        return response.data.signature;
      } catch (e) {
        console.log("error in sign", e);
        throw new TransactionRejectedRpcError(
          new Error(`Unable to sign: wallet window was closed.`)
        );
      }
    }

    return await this.jsonRpcProvider.send(method, params ?? []);
  }

  override async getTransaction(txHash: string) {
    return await this.jsonRpcProvider.getTransaction(txHash);
  }

  detectNetwork(): Promise<ethers.Network> {
    return Promise.resolve(this.currentNetwork);
  }

  getChainId() {
    return Number(this.currentNetwork.chainId);
  }

  disconnect() {
    this.transport.disconnect();
  }
}

function normalizeChainId(
  chainId: string | number | bigint | { chainId: string }
) {
  if (typeof chainId === "object") return normalizeChainId(chainId.chainId);
  if (typeof chainId === "string")
    return Number.parseInt(
      chainId,
      chainId.trim().substring(0, 2) === "0x" ? 16 : 10
    );
  if (typeof chainId === "bigint") return Number(chainId);
  return chainId;
}
