import ProfessionalTradingUI from './Trading/ProfessionalTradingUI';
import React from 'react';

interface TradingProps {
  initialCoin?: string;
}

const Trading: React.FC<TradingProps> = ({ initialCoin = 'BTC' }) => {
  return <ProfessionalTradingUI initialCoin={initialCoin} />;
};

export default Trading;