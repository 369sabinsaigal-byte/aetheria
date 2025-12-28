const WebSocket = require('ws');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Set();
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket Client Connected');
            this.clients.add(ws);
            
            // Send welcome message
            ws.send(JSON.stringify({ type: 'connected', message: 'Connected to Exchange Stream' }));

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'subscribe' && data.channel) {
                        ws.subscription = data.channel;
                        ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }));
                    }
                } catch (e) {
                    console.error('WS Error:', e);
                }
            });

            ws.on('close', () => {
                this.clients.delete(ws);
            });
        });
    }

    broadcast(type, data, channel = null) {
        const payload = JSON.stringify({ type, data, timestamp: Date.now() });
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                if (!channel || client.subscription === channel) {
                    client.send(payload);
                }
            }
        });
    }
    
    // Specific Broadcasts
    broadcastDepth(depth, symbol = 'BTC/USDT') {
        this.broadcast('depth', depth, symbol);
    }
    
    broadcastTrade(trade, symbol = 'BTC/USDT') {
        this.broadcast('trade', trade, symbol);
    }
}

let instance = null;

module.exports = {
    init: (server) => {
        instance = new WebSocketServer(server);
        return instance;
    },
    get: () => instance
};
