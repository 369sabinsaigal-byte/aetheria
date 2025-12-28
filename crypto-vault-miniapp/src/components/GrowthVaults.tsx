import React, { useEffect, useState } from 'react';
import { triggerHaptic } from '../telegram';
import TradingModal from './TradingModal';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  allocation: number;
  current_price?: number;
  change_24h?: number;
}

interface Vault {
  id: string;
  title: string;
  description: string;
  coins: Coin[];
  risk: 'Low' | 'Medium' | 'High';
  horizon: string;
  type: 'foundation' | 'momentum';
}

interface GrowthVaultsProps {
  startParam?: string;
}

const GrowthVaults: React.FC<GrowthVaultsProps> = ({ startParam }) => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [highlightedVault, setHighlightedVault] = useState<string | null>(null);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState<boolean>(false);
  const [selectedVault, setSelectedVault] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedAssetPrice, setSelectedAssetPrice] = useState<number>(0);

  useEffect(() => {
    fetch('http://localhost:3000/api/vaults/enhanced')
      .then(res => res.json())
      .then(data => {
        setVaults(data);
        setLoading(false);
        
        // Handle startapp parameter highlighting
        if (startParam) {
          if (startParam.includes('foundation')) {
            setHighlightedVault('foundation');
            triggerHaptic('medium');
          } else if (startParam.includes('momentum')) {
            setHighlightedVault('momentum');
            triggerHaptic('medium');
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch vaults:', err);
        setLoading(false);
      });
  }, [startParam]);

  const handleInvest = (vaultId: string) => {
    triggerHaptic('medium');
    console.log(`Invest clicked for ${vaultId}`);
    // For now, open the first asset in the vault for trading
    const vault = vaults.find(v => v.id === vaultId);
    if (vault && vault.coins.length > 0) {
      const firstAsset = vault.coins[0];
      setSelectedVault(vaultId);
      setSelectedAsset(firstAsset.symbol);
      setSelectedAssetPrice(firstAsset.current_price || 0);
      setIsTradingModalOpen(true);
    }
  };

  const handleAssetTrade = (vaultId: string, assetSymbol: string, assetPrice: number) => {
    triggerHaptic('light');
    setSelectedVault(vaultId);
    setSelectedAsset(assetSymbol);
    setSelectedAssetPrice(assetPrice);
    setIsTradingModalOpen(true);
  };

  if (loading) {
    return <div className="loading-state">Loading Vaults...</div>;
  }

  return (
    <section className="vaults-section">
      <div className="section-header">
        <h2>Growth Vaults</h2>
        {highlightedVault && (
          <div className="highlight-badge">
            🔗 Deep linked to {highlightedVault}
          </div>
        )}
      </div>
      <div className="vaults-grid">
        {vaults.map((vault) => (
          <div 
            key={vault.id} 
            className={`vault-card ${vault.type} ${highlightedVault === vault.id ? 'highlighted' : ''}`}
          >
            <div className="vault-header">
              <h3 className="vault-title">{vault.title}</h3>
              <span className={`vault-risk ${vault.risk.toLowerCase()}`}>{vault.risk} Risk</span>
            </div>
            <p className="vault-desc">{vault.description}</p>
            <div className="vault-details">
              <div className="detail-item">
                <span className="label">Composition</span>
                <div className="asset-list">
                  {vault.coins.map(coin => (
                    <div key={coin.symbol} className="asset-row">
                        <span className="asset-name">{coin.name} ({coin.symbol})</span>
                        <div className="asset-meta">
                            <span className="asset-alloc">{coin.allocation}%</span>
                            {coin.current_price && (
                                <span 
                                  className={`asset-price ${coin.change_24h && coin.change_24h >= 0 ? 'green' : 'red'}`}
                                  onClick={() => handleAssetTrade(vault.id, coin.symbol, coin.current_price || 0)}
                                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    ${coin.current_price.toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="detail-item">
                <span className="label">Horizon</span>
                <span className="value">{vault.horizon}</span>
              </div>
            </div>
            <button 
              className="primary-btn vault-btn"
              onClick={() => handleInvest(vault.id)}
            >
              Invest
            </button>
          </div>
        ))}
      </div>
      
      <TradingModal
        isOpen={isTradingModalOpen}
        onClose={() => setIsTradingModalOpen(false)}
        vaultId={selectedVault}
        asset={selectedAsset}
        currentPrice={selectedAssetPrice}
      />
    </section>
  );
};

export default GrowthVaults;
