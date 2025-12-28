export type Side = 'buy' | 'sell';
export type OrderType = 'limit' | 'market';

export interface Order {
  id: string;
  side: Side;
  price?: number;
  amount: number;
  filled?: number;
  owner?: string;
  createdAt: number;
  type: OrderType;
}

export interface Trade {
  id: string;
  buyOrderId?: string;
  sellOrderId?: string;
  price: number;
  amount: number;
  timestamp: number;
  takerSide: Side;
}
