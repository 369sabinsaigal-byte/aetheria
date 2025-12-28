import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { VaultDetailCard } from './VaultDetailCard';
import { theme } from '../theme';

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
});

interface Vault {
  id: string;
  name: string;
  description: string;
  apy: number;
  tvl: number;
  minInvestment: number;
  strategy: string;
}

export const Vaults: React.FC = () => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVaults = async () => {
      try {
        const response = await API.get('/vaults');
        setVaults(response.data.vaults || []);
      } catch (error) {
        console.error('Failed to fetch vaults:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVaults();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', color: theme.colors.textPrimary }}>Loading vaults...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ 
        color: theme.colors.textPrimary, 
        fontSize: theme.typography.h1, 
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        Growth Vaults
      </h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '2rem' 
      }}>
        {vaults.map((vault) => (
          <VaultDetailCard
            key={vault.id}
            name={vault.name}
            description={vault.description}
            apy={vault.apy}
            tvl={vault.tvl}
            minInvestment={vault.minInvestment}
            strategy={vault.strategy}
            // Mock data for visualizations until API is updated
            allocation={[
              { name: 'Stable', value: 60, color: theme.colors.primary },
              { name: 'Blue Chip', value: 30, color: theme.colors.primaryDark },
              { name: 'Alpha', value: 10, color: theme.colors.success }
            ]}
            performanceData={[10, 12, 11, 14, 16, 15, 18, 20]}
          />
        ))}
      </div>
    </div>
  );
};