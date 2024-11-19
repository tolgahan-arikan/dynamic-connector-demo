import { FC, FormEventHandler, useState } from "react";
import { parseEther, isAddress, getAddress } from "viem";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";

export const Connected: FC = () => {
  const { primaryWallet } = useDynamicContext();
  const [txHash, setTxHash] = useState<string>();
  const [error, setError] = useState<string>();
  const [signature, setSignature] = useState<string>();

  const isWalletConnected = primaryWallet && isEthereumWallet(primaryWallet);

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setError(undefined);
    setTxHash(undefined);

    if (!isWalletConnected) {
      setError("Please connect your wallet");
      return;
    }

    try {
      const formData = new FormData(event.currentTarget);
      const address = formData.get("address") as string;
      const amount = formData.get("amount") as string;

      if (!isAddress(address)) {
        throw new Error("Invalid address");
      }

      const publicClient = await primaryWallet.getPublicClient();
      const walletClient = await primaryWallet.getWalletClient();

      const transaction = {
        to: getAddress(address),
        value: amount ? parseEther(amount) : undefined,
      };

      const hash = await walletClient.sendTransaction(transaction);
      setTxHash(hash);

      const receipt = await publicClient.getTransactionReceipt({
        hash,
      });

      console.log("Transaction receipt:", receipt);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to send transaction");
    }
  };

  const signMessage = async () => {
    setError(undefined);
    setSignature(undefined);

    if (!isWalletConnected) {
      setError("Please connect your wallet");
      return;
    }

    try {
      const signature = await primaryWallet.signMessage("example");
      setSignature(signature);
      console.log("signature", signature);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to sign message");
    }
  };

  if (!isWalletConnected) {
    return null;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Connected Wallet: {primaryWallet.connector.name}</h2>
      <div style={{ marginBottom: "20px" }}>
        Address: {primaryWallet.address}
      </div>

      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "300px",
          marginBottom: "30px",
        }}
      >
        <p>Send ETH</p>
        <input
          name="address"
          type="text"
          required
          placeholder="0x..."
          style={{ padding: "8px" }}
        />
        <input
          name="amount"
          type="text"
          required
          placeholder="0.05"
          style={{ padding: "8px" }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </form>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "300px",
        }}
      >
        <p>Sign Message</p>
        <button
          onClick={signMessage}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Sign message
        </button>
      </div>

      {txHash && (
        <div style={{ marginTop: "20px" }}>
          <h3>Transaction sent!</h3>
          <p>Hash: {txHash}</p>
        </div>
      )}

      {signature && (
        <div style={{ marginTop: "20px", maxWidth: "300px" }}>
          <h3>Message signed!</h3>
          <p style={{ wordBreak: "break-all" }}>Signature: {signature}</p>
        </div>
      )}

      {error && (
        <div style={{ marginTop: "20px", color: "red" }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
