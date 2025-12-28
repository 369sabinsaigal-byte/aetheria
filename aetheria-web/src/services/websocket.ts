type WebSocketListener = (data: any) => void;

class WebSocketService {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectInterval: number = 3000;
    private shouldReconnect: boolean = true;
    private subscriptions: Set<string> = new Set();
    private listeners: Map<string, Set<WebSocketListener>> = new Map();

    constructor() {
        this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    }

    connect() {
        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('✅ WebSocket Connected');
                this.emit('connected', null);
                // Resubscribe to channels
                this.subscriptions.forEach(channel => {
                    this.send({ type: 'subscribe', channel });
                });
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    
                    if (message.type === 'depth') {
                        this.emit('depthUpdate', message.data);
                    } else if (message.type === 'trade') {
                        this.emit('tradeUpdate', message.data);
                    } else if (message.type === 'ticker') {
                        this.emit('tickerUpdate', message.data);
                    } else if (message.type === 'connected') {
                        console.log('Server welcomed:', message.message);
                    }
                } catch (e) {
                    console.error('Error parsing WS message:', e);
                }
            };

            this.ws.onclose = () => {
                console.log('❌ WebSocket Disconnected');
                this.emit('disconnected', null);
                if (this.shouldReconnect) {
                    setTimeout(() => this.connect(), this.reconnectInterval);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
            };

        } catch (error) {
            console.error('Connection failed:', error);
        }
    }

    subscribe(channel: string) {
        this.subscriptions.add(channel);
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.send({ type: 'subscribe', channel });
        }
    }

    unsubscribe(channel: string) {
        this.subscriptions.delete(channel);
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.send({ type: 'unsubscribe', channel });
        }
    }

    send(data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    disconnect() {
        this.shouldReconnect = false;
        this.ws?.close();
    }

    // Event Emitter logic
    on(event: string, listener: WebSocketListener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
    }

    off(event: string, listener: WebSocketListener) {
        if (this.listeners.has(event)) {
            this.listeners.get(event)!.delete(listener);
        }
    }

    emit(event: string, data: any) {
        if (this.listeners.has(event)) {
            this.listeners.get(event)!.forEach(listener => {
                try {
                    listener(data);
                } catch (e) {
                    console.error(`Error in listener for ${event}:`, e);
                }
            });
        }
    }
}

export const webSocketService = new WebSocketService();
