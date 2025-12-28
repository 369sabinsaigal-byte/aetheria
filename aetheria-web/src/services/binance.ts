type BinanceCallback = (data: any) => void;

export class BinanceService {
  private ws: WebSocket | null = null;
  private subscribers: BinanceCallback[] = [];
  private symbol: string = 'btcusdt';
  private reconnectTimer: any = null;
  private isExplicitlyClosed = false;

  constructor(symbol: string = 'btcusdt') {
    this.symbol = symbol.toLowerCase();
  }

  connect() {
    if (this.ws) return;
    this.isExplicitlyClosed = false;

    // Combined stream for efficiency
    // depth20@100ms: Top 20 bids/asks updated every 100ms
    // trade: Real-time trade execution
    // kline_1m: 1-minute candlesticks (optional, but good for charts)
    const streams = [
      `${this.symbol}@depth20@100ms`,
      `${this.symbol}@trade`,
      `${this.symbol}@kline_1m`
    ].join('/');

    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    
    console.log('Connecting to Binance WS:', url);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('Binance WS Connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // message format: { stream: "...", data: { ... } }
        this.notify(message);
      } catch (e) {
        console.error('Binance WS Parse Error', e);
      }
    };

    this.ws.onclose = () => {
      console.log('Binance WS Closed');
      this.ws = null;
      if (!this.isExplicitlyClosed) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      }
    };

    this.ws.onerror = (err) => {
      console.error('Binance WS Error', err);
      this.ws?.close();
    };
  }

  subscribe(callback: BinanceCallback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notify(data: any) {
    this.subscribers.forEach(cb => cb(data));
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async fetchKlines(interval: string = '1m', limit: number = 100) {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${this.symbol.toUpperCase()}&interval=${interval}&limit=${limit}`);
      const data = await response.json();
      // Binance format: [ [time, open, high, low, close, volume, ...], ... ]
      return data.map((d: any[]) => ({
        time: Math.floor(d[0] / 1000),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
      }));
    } catch (e) {
      console.error('Failed to fetch klines', e);
      return [];
    }
  }
}

export const binanceService = new BinanceService();
