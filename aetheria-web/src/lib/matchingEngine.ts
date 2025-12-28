import { v4 as uuid } from 'uuid';
import type { Order, Trade, Side } from './types';

export class MatchingEngine {
  buys: Order[] = [];
  sells: Order[] = [];
  onUpdate: (p: any) => void;

  constructor(onUpdate = (_p: any) => {}) {
    this.onUpdate = onUpdate;
  }

  applySnapshot(s: { buys: Order[]; sells: Order[]; trades?: Trade[] }) {
    this.buys = s.buys.slice().sort((a, b) => b.price! - a.price!);
    this.sells = s.sells.slice().sort((a, b) => a.price! - b.price!);
    this.onUpdate({
      type: 'snapshot',
      buys: this.buys,
      sells: this.sells,
      trades: s.trades || [],
    });
  }

  place(o: Omit<Order, 'id' | 'createdAt'>) {
    const order: { [k: string]: any } = {
      ...o,
      id: uuid(),
      createdAt: Date.now(),
      filled: 0,
    };
    if (order.type === 'market') this.matchMarket(order);
    else this.matchLimit(order);
    this.onUpdate({ type: 'orderbook', buys: this.buys, sells: this.sells });
    return order.id;
  }

  matchMarket(order: any) {
    let r = order.amount;
    if (order.side === 'buy') {
      while (r > 0 && this.sells.length) {
        const b = this.sells[0];
        const filled = b.filled ?? 0;
        const ta = Math.min(r, b.amount - filled);
        if (ta <= 0) {
          this.sells.shift();
          continue;
        }
        this.emitTrade(order, b, b.price!, ta, 'buy');
        r -= ta;
        b.filled = filled + ta;
        if (b.filled >= b.amount) this.sells.shift();
      }
    } else {
      while (r > 0 && this.buys.length) {
        const b = this.buys[0];
        const filled = b.filled ?? 0;
        const ta = Math.min(r, b.amount - filled);
        if (ta <= 0) {
          this.buys.shift();
          continue;
        }
        this.emitTrade(b, order, b.price!, ta, 'sell');
        r -= ta;
        b.filled = filled + ta;
        if (b.filled >= b.amount) this.buys.shift();
      }
    }
  }

  matchLimit(order: any) {
    let r = order.amount;
    if (order.side === 'buy') {
      while (r > 0 && this.sells.length && this.sells[0].price! <= order.price) {
        const b = this.sells[0];
        const filled = b.filled ?? 0;
        const ta = Math.min(r, b.amount - filled);
        this.emitTrade(order, b, b.price!, ta, 'buy');
        r -= ta;
        b.filled = filled + ta;
        if (b.filled >= b.amount) this.sells.shift();
      }
      if (r > 0) {
        this.buys.push({ ...order, amount: r, filled: 0 });
        this.buys.sort((a, b) => b.price! - a.price!);
      }
    } else {
      while (r > 0 && this.buys.length && this.buys[0].price! >= order.price) {
        const b = this.buys[0];
        const filled = b.filled ?? 0;
        const ta = Math.min(r, b.amount - filled);
        this.emitTrade(b, order, b.price!, ta, 'sell');
        r -= ta;
        b.filled = filled + ta;
        if (b.filled >= b.amount) this.buys.shift();
      }
      if (r > 0) {
        this.sells.push({ ...order, amount: r, filled: 0 });
        this.sells.sort((a, b) => a.price! - b.price!);
      }
    }
  }

  emitTrade(
    buy: Order | any,
    sell: Order | any,
    price: number,
    amount: number,
    takerSide: Side
  ) {
    const trade: Trade = {
      id: uuid(),
      buyOrderId: buy.id,
      sellOrderId: sell.id,
      price,
      amount,
      timestamp: Date.now(),
      takerSide,
    };
    this.onUpdate({
      type: 'trade',
      trade,
      buys: this.buys,
      sells: this.sells,
    });
  }
}
