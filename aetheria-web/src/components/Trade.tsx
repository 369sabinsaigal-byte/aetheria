import React, { useState } from 'react';
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export const Trade: React.FC = () => {
  const [symbol, setSymbol] = useState('BTC');
  const [side, setSide] = useState('BUY');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleTrade = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      setResult('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await API.post('/trade', {
        symbol: symbol.toUpperCase(),
        side: side.toUpperCase(),
        quantity: parseFloat(quantity)
      });
      
      setResult(`Trade executed successfully! Order ID: ${response.data.orderId}`);
      setQuantity('');
    } catch (error: any) {
      setResult(`Trade failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trade">
      <h2>Trade Crypto</h2>
      
      <div className="trade-form">
        <div className="form-group">
          <label>Symbol:</label>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="BNB">BNB</option>
            <option value="SOL">SOL</option>
            <option value="XRP">XRP</option>
          </select>
        </div>

        <div className="form-group">
          <label>Side:</label>
          <select value={side} onChange={(e) => setSide(e.target.value)}>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>

        <div className="form-group">
          <label>Quantity:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter quantity"
            step="0.0001"
            min="0"
          />
        </div>

        <button 
          onClick={handleTrade} 
          disabled={loading}
          className="trade-btn"
        >
          {loading ? 'Executing...' : 'Execute Trade'}
        </button>

        {result && (
          <div className="trade-result">
            {result}
          </div>
        )}
      </div>
    </div>
  );
};