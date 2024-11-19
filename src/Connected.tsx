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

  const pageStyle = {
    maxWidth: "360px",
    width: "100%",
    backgroundColor: "#F7FAFC",
    margin: 0,
    padding: 0,
    borderRadius: "8px",
    marginTop: "16px",
    boxSizing: "border-box" as const,
  };

  const containerStyle = {
    padding: "16px",
    color: "#2D3748",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const headingStyle = {
    color: "#1A365D",
    fontSize: "20px",
    marginBottom: "16px",
    fontWeight: "600" as const,
    wordBreak: "break-word" as const,
  };

  const addressStyle = {
    marginBottom: "24px",
    color: "#4A5568",
    fontSize: "14px",
    padding: "12px",
    backgroundColor: "#EDF2F7",
    borderRadius: "8px",
    wordBreak: "break-all" as const,
    overflowWrap: "break-word" as const,
  };

  const formStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    width: "100%",
    marginBottom: "32px",
  };

  const inputStyle = {
    padding: "12px",
    fontSize: "16px",
    border: "2px solid #E2E8F0",
    borderRadius: "8px",
    color: "#2D3748",
    backgroundColor: "#FFFFFF",
    width: "100%",
    boxSizing: "border-box" as const,
    outline: "none",
    minWidth: 0,
  };

  const buttonStyle = {
    padding: "12px",
    fontSize: "16px",
    cursor: "pointer",
    backgroundColor: "#5A67D8",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    width: "100%",
    fontWeight: "600" as const,
    transition: "background-color 0.2s",
    whiteSpace: "nowrap" as const,
  };

  const sectionTitleStyle = {
    color: "#2D3748",
    fontSize: "16px",
    marginBottom: "12px",
    fontWeight: "600" as const,
  };

  const resultContainerStyle = {
    marginTop: "24px",
    padding: "16px",
    backgroundColor: "#EDF2F7",
    borderRadius: "8px",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const hashStyle = {
    wordBreak: "break-all" as const,
    overflowWrap: "break-word" as const,
    color: "#4A5568",
    fontSize: "14px",
    lineHeight: "1.5",
  };

  const hashLinkStyle = {
    color: "#5A67D8",
    textDecoration: "none",
    ":hover": {
      textDecoration: "underline",
    },
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h2 style={headingStyle}>
          Connected Wallet: {primaryWallet.connector.name}
        </h2>
        <div style={addressStyle}>
          <strong>Address:</strong> {primaryWallet.address}
        </div>

        <form onSubmit={onSubmit} style={formStyle}>
          <p style={sectionTitleStyle}>Send ETH</p>
          <input
            name="address"
            type="text"
            required
            placeholder="0x..."
            style={inputStyle}
          />
          <input
            name="amount"
            type="text"
            required
            placeholder="0.05"
            style={inputStyle}
          />
          <button
            type="submit"
            style={buttonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#4C51BF";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#5A67D8";
            }}
          >
            Send
          </button>
        </form>

        {txHash && (
          <div style={resultContainerStyle}>
            <h3 style={sectionTitleStyle}>Transaction sent!</h3>
            <p style={hashStyle}>
              <strong>Hash:</strong>{" "}
              <a
                href={`https://arbiscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={hashLinkStyle}
              >
                {txHash}
              </a>
            </p>
          </div>
        )}

        <div style={formStyle}>
          <p style={sectionTitleStyle}>Sign Message</p>
          <button
            onClick={signMessage}
            style={buttonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#4C51BF";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#5A67D8";
            }}
          >
            Sign message
          </button>
        </div>

        {signature && (
          <div style={resultContainerStyle}>
            <h3 style={sectionTitleStyle}>Message signed!</h3>
            <p style={hashStyle}>
              <strong>Signature:</strong> {signature}
            </p>
          </div>
        )}

        {error && (
          <div
            style={{
              ...resultContainerStyle,
              backgroundColor: "#FFF5F5",
              borderLeft: "4px solid #F56565",
            }}
          >
            <h3 style={{ ...sectionTitleStyle, color: "#C53030" }}>Error</h3>
            <p style={{ color: "#C53030", fontSize: "14px" }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
