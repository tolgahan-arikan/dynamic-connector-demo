export class ProviderTransport {
    observeCallbacks() {
        const originalSet = this.callbacks.set.bind(this.callbacks);
        const originalDelete = this.callbacks.delete.bind(this.callbacks);
        this.callbacks.set = (key, value)=>{
            const result = originalSet(key, value);
            this.updateWalletCheck();
            return result;
        };
        this.callbacks.delete = (key)=>{
            const result = originalDelete(key);
            this.updateWalletCheck();
            return result;
        };
    }
    updateWalletCheck() {
        if (this.callbacks.size > 0) {
            this.ensureWalletCheckActive();
        } else {
            this.ensureWalletCheckInactive();
        }
    }
    ensureWalletCheckActive() {
        if (this.walletCheckInterval === undefined) {
            this.walletCheckInterval = window.setInterval(()=>{
                if (!this.isWalletOpen()) {
                    this.handleWalletClosed();
                }
            }, 500);
        }
    }
    ensureWalletCheckInactive() {
        if (this.walletCheckInterval !== undefined) {
            clearInterval(this.walletCheckInterval);
            this.walletCheckInterval = undefined;
        }
    }
    loadSession() {
        const sessionData = localStorage.getItem('walletSession');
        if (sessionData) {
            this.session = JSON.parse(sessionData);
            this.connectionState = 'connected';
        }
    }
    saveSession(walletAddress) {
        this.session = {
            walletAddress,
            lastConnected: Date.now()
        };
        localStorage.setItem('walletSession', JSON.stringify(this.session));
    }
    tryCloseWalletWindow() {
        if (this.pendingRequests.size === 0 && this.isWalletOpen()) {
            setTimeout(()=>{
                if (this.pendingRequests.size === 0) {
                    var _this_walletWindow;
                    (_this_walletWindow = this.walletWindow) == null ? void 0 : _this_walletWindow.close();
                    this.walletWindow = null;
                }
            }, 500);
        }
    }
    async connect() {
        if (this.connectionState === 'connected' && this.session) {
            return {
                walletAddress: this.session.walletAddress
            };
        }
        this.connectionState = 'connecting';
        const connectionId = crypto.randomUUID();
        const connectionRequest = {
            type: 'connection',
            id: connectionId
        };
        this.pendingRequests.add(connectionId);
        return new Promise((resolve, reject)=>{
            this.callbacks.set(connectionId, (response)=>{
                this.pendingRequests.delete(connectionId);
                if (response.type === 'connection' && response.status === 'accepted') {
                    this.connectionState = 'connected';
                    this.saveSession(response.walletAddress);
                    resolve({
                        walletAddress: response.walletAddress
                    });
                    this.tryCloseWalletWindow();
                } else {
                    this.connectionState = 'disconnected';
                    reject(new Error('Connection rejected'));
                    this.tryCloseWalletWindow();
                }
            });
            this.openWalletAndPostMessage(connectionRequest);
        });
    }
    async sendRequest(method, params, chainId) {
        if (this.connectionState !== 'connected') {
            throw new Error('Not connected to wallet. Call connect() first.');
        }
        const id = crypto.randomUUID();
        const request = {
            type: 'request',
            id,
            method,
            params,
            chainId
        };
        this.pendingRequests.add(id);
        return new Promise((resolve, reject)=>{
            const sendMessage = async ()=>{
                if (!this.isWalletOpen()) {
                    try {
                        await this.openWalletAndPostMessage(request);
                    } catch (error) {
                        this.callbacks.delete(id);
                        this.pendingRequests.delete(id);
                        reject(error);
                        return;
                    }
                } else {
                    this.postMessageToWallet(request);
                }
            };
            this.callbacks.set(id, (response)=>{
                this.pendingRequests.delete(id);
                if (response.error) {
                    reject(new Error(response.error.message));
                } else {
                    resolve(response.result);
                }
                this.tryCloseWalletWindow();
            });
            sendMessage().catch(reject);
        });
    }
    openWalletAndPostMessage(message) {
        return new Promise((resolve, reject)=>{
            console.log('Opening wallet and posting message:', message);
            if (!this.isWalletOpen()) {
                this.walletWindow = window.open(this.walletOrigin, 'Wallet', 'width=375,height=667');
                if (!this.walletWindow) {
                    reject(new Error('Failed to open wallet window. Please check your pop-up blocker settings.'));
                    return;
                }
                const waitForReady = (event)=>{
                    if (event.origin === this.walletOrigin && event.data === 'ready') {
                        console.log('Received ready message from wallet');
                        window.removeEventListener('message', waitForReady);
                        this.postMessageToWallet(message);
                        resolve();
                    }
                };
                window.addEventListener('message', waitForReady);
            } else {
                this.postMessageToWallet(message);
                resolve();
            }
        });
    }
    postMessageToWallet(message) {
        var _this_walletWindow;
        console.log('Posting message to wallet:', message);
        (_this_walletWindow = this.walletWindow) == null ? void 0 : _this_walletWindow.postMessage(message, {
            targetOrigin: this.walletOrigin
        });
    }
    isWalletOpen() {
        var _this_walletWindow;
        return this.walletWindow !== null && !((_this_walletWindow = this.walletWindow) == null ? void 0 : _this_walletWindow.closed);
    }
    handleWalletClosed() {
        this.walletWindow = null;
        this.callbacks.forEach((callback)=>{
            callback({
                error: {
                    message: 'Wallet window was closed'
                }
            });
        });
        this.callbacks.clear();
        this.pendingRequests.clear();
    }
    disconnect() {
        this.connectionState = 'disconnected';
        this.session = undefined;
        localStorage.removeItem('walletSession');
        if (this.isWalletOpen()) {
            var _this_walletWindow;
            (_this_walletWindow = this.walletWindow) == null ? void 0 : _this_walletWindow.close();
        }
        this.walletWindow = null;
        this.handleWalletClosed();
    }
    getWalletAddress() {
        var _this_session;
        return (_this_session = this.session) == null ? void 0 : _this_session.walletAddress;
    }
    constructor(walletUrl){
        this.walletWindow = null;
        this.callbacks = new Map();
        this.connectionState = 'disconnected';
        this.pendingRequests = new Set();
        this.handleMessage = (event)=>{
            if (event.origin !== this.walletOrigin) return;
            const response = event.data;
            const callback = this.callbacks.get(response.id);
            if (callback) {
                callback(response);
                this.callbacks.delete(response.id);
            }
        };
        const url = new URL(walletUrl);
        this.walletOrigin = url.origin;
        window.addEventListener('message', this.handleMessage);
        this.loadSession();
        this.observeCallbacks();
    }
}
