
export enum MessageType {
    CREATE_ROOM = 'CREATE_ROOM',
    JOIN_ROOM = 'JOIN_ROOM',
    LEAVE_ROOM = 'LEAVE_ROOM',
    GAME_START = 'GAME_START',
    MOVE = 'MOVE',
    GAME_OVER = 'GAME_OVER',
    ERROR = 'ERROR',
    PLAYER_DISCONNECTED = 'PLAYER_DISCONNECTED',
    REMATCH_REQUEST = 'REMATCH_REQUEST',
    REMATCH_NOTIFY = 'REMATCH_NOTIFY'
}

export interface WSMessage {
    type: MessageType;
    payload?: any;
}

type MessageHandler = (data: any) => void;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private handlers: Map<MessageType, MessageHandler[]> = new Map();
    private startCallbacks: Array<() => void> = [];
    private isConnected = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 2000;
    private shouldReconnect = true;
    private connectionListeners: Array<(connected: boolean) => void> = [];

    constructor(private url: string = import.meta.env.VITE_WS_URL || 'ws://localhost:3000') { }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            this.shouldReconnect = true;
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('WebSocket 连接成功');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.notifyConnectionListeners(true);
                this.startCallbacks.forEach(cb => cb());
                this.startCallbacks = [];
                resolve();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: WSMessage = JSON.parse(event.data);
                    this.trigger(message.type, message.payload);
                } catch (e) {
                    console.error('收到无效消息:', event.data);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket 错误:', error);
                if (!this.isConnected) {
                    reject(error);
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket 连接断开');
                const wasConnected = this.isConnected;
                this.isConnected = false;
                this.notifyConnectionListeners(false);

                // 尝试自动重连
                if (this.shouldReconnect && wasConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                    setTimeout(() => {
                        this.connect().catch(err => {
                            console.error('重连失败:', err);
                        });
                    }, this.reconnectDelay * this.reconnectAttempts);
                }
            };
        });
    }

    send(type: MessageType, payload: any = {}): boolean {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket 未连接，无法发送消息');
            return false;
        }
        const message: WSMessage = { type, payload };
        this.ws.send(JSON.stringify(message));
        return true;
    }

    on(type: MessageType, handler: MessageHandler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type)?.push(handler);
    }

    off(type: MessageType, handler: MessageHandler) {
        const handlers = this.handlers.get(type);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    // 监听连接状态变化
    onConnectionChange(listener: (connected: boolean) => void) {
        this.connectionListeners.push(listener);
        return () => {
            const index = this.connectionListeners.indexOf(listener);
            if (index > -1) {
                this.connectionListeners.splice(index, 1);
            }
        };
    }

    private notifyConnectionListeners(connected: boolean) {
        this.connectionListeners.forEach(listener => listener(connected));
    }

    private trigger(type: MessageType, payload: any) {
        const handlers = this.handlers.get(type);
        if (handlers) {
            handlers.forEach(handler => handler(payload));
        }
    }

    getConnectionStatus(): boolean {
        return this.isConnected;
    }

    close() {
        this.shouldReconnect = false;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const wsClient = new WebSocketClient();
