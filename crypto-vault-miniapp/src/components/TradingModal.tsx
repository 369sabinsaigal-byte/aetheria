import React, { useState } from 'react';
import { triggerHaptic, triggerNotification } from '../telegram';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultId: string;
  asset: string;
  currentPrice?: number;
}

const TradingModal: React.FC<TradingModalProps> = ({ 
  isOpen, 
  onClose, 
  vaultId, 
  asset, 
  currentPrice 
}) => {
  const [amount, setAmount] = useState<string>('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    triggerHaptic('medium');

    try {
      const response = await fetch('http://localhost:3000/api/trade/market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vaultId,
          asset,
          amount: parseFloat(amount),
          side
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setOrderResult(result);
        triggerNotification('success');
      } else {
        alert(`Trade failed: ${result.error}`);
        triggerNotification('error');
      }
    } catch (error) {
      console.error('Trade execution error:', error);
      alert('Failed to execute trade. Please try again.');
      triggerNotification('error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setSide('buy');
    setOrderResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {!orderResult ? (
          <>
            <div className="modal-header">
              <h3>Market Order</h3>
              <button className="modal-close" onClick={handleClose}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="trade-info">
                <span className="asset-label">{asset}</span>
                <span className="vault-label">{vaultId} Vault</span>
                {currentPrice && (
                  <span className="price-label">Current: ${currentPrice.toLocaleString()}</span>
                )}
              </div>

              <form onSubmit={handleSubmit} className="trade-form">
                <div className="form-group">
                  <label>Order Type</label>
                  <div className="side-toggle">
                    <button
                      type="button"
                      className={`side-btn ${side === 'buy' ? 'active' : ''}`}
                      onClick={() => setSide('buy')}
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      className={`side-btn ${side === 'sell' ? 'active' : ''}`}
                      onClick={() => setSide('sell')}
                    >
                      Sell
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Amount ({asset})</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    step="any"
                    min="0"
                    required
                  />
                </div>

                {amount && currentPrice && (
                  <div className="trade-summary">
                    <div className="summary-item">
                      <span>Estimated Cost:</span>
                      <span>${(parseFloat(amount) * currentPrice).toLocaleString()}</span>
                    </div>
                    <div className="summary-item">
                      <span>Fee (0.08%):</span>
                      <span>${(parseFloat(amount) * currentPrice * 0.0008).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  className={`primary-btn ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Executing...' : `Place ${side.toUpperCase()} Order`}
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div className="modal-header">
              <h3>Order Executed</h3>
              <button className="modal-close" onClick={handleClose}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="success-animation">✅</div>
              <div className="order-result">
                <h4>Market {orderResult.side.toUpperCase()} Order Filled</h4>
                <div className="result-details">
                  <div className="detail-item">
                    <span>Asset:</span>
                    <span>{orderResult.asset}</span>
                  </div>
                  <div className="detail-item">
                    <span>Amount:</span>
                    <span>{orderResult.amount}</span>
                  </div>
                  <div className="detail-item">
                    <span>Order ID:</span>
                    <span className="order-id">{orderResult.orderId}</span>
                  </div>
                  <div className="detail-item">
                    <span>Executed:</span>
                    <span>{new Date(orderResult.executedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              
              <button 
                className="primary-btn"
                onClick={handleClose}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TradingModal;