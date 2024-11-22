export declare class ProviderTransport {
    private walletOrigin;
    private walletWindow;
    private callbacks;
    private connectionState;
    private session;
    private walletCheckInterval;
    private pendingRequests;
    constructor(walletUrl: string);
    private observeCallbacks;
    private updateWalletCheck;
    private ensureWalletCheckActive;
    private ensureWalletCheckInactive;
    private loadSession;
    private saveSession;
    private tryCloseWalletWindow;
    connect(): Promise<{
        walletAddress: string;
    }>;
    sendRequest(method: string, params: any[], chainId: number): Promise<any>;
    private openWalletAndPostMessage;
    private postMessageToWallet;
    private isWalletOpen;
    private handleWalletClosed;
    private handleMessage;
    disconnect(): void;
    getWalletAddress(): string | undefined;
}
