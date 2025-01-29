import { FC, FormEventHandler, useState, useEffect } from "react";
import { parseEther, isAddress, getAddress } from "viem";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";

type TypedDataPayload = {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: `0x${string}`;
  };
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: Record<string, unknown>;
};

const defaultTypedData: TypedDataPayload = {
  domain: {
    name: "Example DApp",
    version: "1",
    chainId: 42161,
    verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
  },
  types: {
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" },
    ],
    Mail: [
      { name: "from", type: "Person" },
      { name: "to", type: "Person" },
      { name: "contents", type: "string" },
    ],
  },
  primaryType: "Mail",
  message: {
    from: {
      name: "Alice",
      wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
    },
    to: {
      name: "Bob",
      wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
    },
    contents: "Hello, Bob!",
  },
};

export const Connected: FC = () => {
  const { primaryWallet } = useDynamicContext();
  const [txHash, setTxHash] = useState<string>();
  const [error, setError] = useState<string>();
  const [signature, setSignature] = useState<string>();
  const [typedDataSignature, setTypedDataSignature] = useState<string>();
  const [blockNumber, setBlockNumber] = useState<bigint>();
  const [parsedJson, setParsedJson] = useState<TypedDataPayload>();
  const defaultJson = JSON.stringify(defaultTypedData, null, 2);
  const [jsonInput, setJsonInput] = useState<string>(defaultJson);

  const isWalletConnected = primaryWallet && isEthereumWallet(primaryWallet);

  useEffect(() => {
    // Parse the default JSON on mount
    handleJsonInput(defaultJson);
  }, []); // Empty deps array means this runs once on mount

  useEffect(() => {
    const fetchBlockNumber = async () => {
      if (!isWalletConnected) return;
      try {
        const provider = await primaryWallet.getPublicClient();
        const blockNumber = await provider.getBlockNumber();
        setBlockNumber(blockNumber);
      } catch (e) {
        console.error("Failed to fetch block number:", e);
      }
    };

    fetchBlockNumber();
    // Poll for new blocks every second
    const interval = setInterval(fetchBlockNumber, 1000);
    return () => clearInterval(interval);
  }, [primaryWallet, isWalletConnected]);

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

  const signTypedData = async () => {
    setError(undefined);
    setTypedDataSignature(undefined);

    if (!isWalletConnected) {
      setError("Please connect your wallet");
      return;
    }

    if (!parsedJson) {
      setError("Please paste and validate your typed data JSON first");
      return;
    }

    try {
      const walletClient = await primaryWallet.getWalletClient();

      const signature = await walletClient.signTypedData({
        domain: parsedJson.domain,
        types: parsedJson.types,
        primaryType: parsedJson.primaryType,
        message: parsedJson.message,
      });

      setTypedDataSignature(signature);
      console.log("typed data signature", signature);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to sign typed data");
    }
  };

  const handleJsonInput = (value: string) => {
    setJsonInput(value);
    setError(undefined);
    setParsedJson(undefined);

    if (!value.trim()) return;

    try {
      const parsed = JSON.parse(value);

      // Validate the structure
      if (
        !parsed.domain ||
        !parsed.types ||
        !parsed.primaryType ||
        !parsed.message
      ) {
        throw new Error(
          "Invalid typed data format. Must include domain, types, primaryType, and message."
        );
      }

      if (
        !parsed.domain.name ||
        !parsed.domain.version ||
        !parsed.domain.chainId ||
        !parsed.domain.verifyingContract
      ) {
        throw new Error(
          "Invalid domain format. Must include name, version, chainId, and verifyingContract."
        );
      }

      setParsedJson(parsed as TypedDataPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON format");
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

  const textareaStyle = {
    ...inputStyle,
    minHeight: "120px",
    fontFamily: "monospace",
    resize: "vertical" as const,
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
          {blockNumber !== undefined && (
            <div style={{ marginTop: "8px" }}>
              <strong>Current Block:</strong> {blockNumber.toString()}
            </div>
          )}
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

        <div style={formStyle}>
          <p style={sectionTitleStyle}>Paste JSON Typed Data</p>
          <textarea
            value={jsonInput}
            onChange={(e) => handleJsonInput(e.target.value)}
            placeholder="Paste your typed data JSON here..."
            style={textareaStyle}
          />
          <button
            onClick={signTypedData}
            style={buttonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#4C51BF";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#5A67D8";
            }}
          >
            Sign typed data
          </button>
        </div>

        {typedDataSignature && (
          <div style={resultContainerStyle}>
            <h3 style={sectionTitleStyle}>Typed data signed!</h3>
            <p style={hashStyle}>
              <strong>Signature:</strong> {typedDataSignature}
            </p>
          </div>
        )}

        {parsedJson && (
          <div style={resultContainerStyle}>
            <h3 style={sectionTitleStyle}>Using Typed Data:</h3>
            <pre
              style={{
                ...hashStyle,
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
              }}
            >
              {JSON.stringify(parsedJson, null, 2)}
            </pre>
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
