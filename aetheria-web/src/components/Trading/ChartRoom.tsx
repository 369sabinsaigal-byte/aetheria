import React, { useEffect, useRef, useContext } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { useTelegram } from '../../hooks/useTelegram';
import { theme } from '../../theme';
import { MarketContext } from '../../context/MarketContext';

interface ChartRoomProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  embedded?: boolean;
  onOrderPlaced?: () => void;
}

const ChartRoom: React.FC<ChartRoomProps> = ({ isOpen, onClose, symbol: _symbol, embedded = false }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const { webApp } = useTelegram();
  const { state } = useContext(MarketContext);

  // Expand Telegram WebApp when chart opens (only if not embedded)
  useEffect(() => {
    if (embedded) return;
    
    if (isOpen && webApp) {
      webApp.expand();
      webApp.BackButton.show();
      webApp.BackButton.onClick(onClose);
    } else if (webApp) {
      webApp.BackButton.hide();
      webApp.BackButton.offClick(onClose);
    }
  }, [isOpen, webApp, onClose, embedded]);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // cleanup previous chart if any
    if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: embedded ? theme.colors.surface : theme.colors.background },
        textColor: theme.colors.textSecondary,
        fontSize: 12,
      },
      grid: {
        vertLines: { color: theme.colors.border, visible: true },
        horzLines: { color: theme.colors.border, visible: true },
      },
      crosshair: {
        vertLine: {
          color: theme.colors.primary,
          labelBackgroundColor: theme.colors.border,
        },
        horzLine: {
          color: theme.colors.primary,
          labelBackgroundColor: theme.colors.border,
        },
      },
      rightPriceScale: {
        borderColor: theme.colors.border,
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: theme.colors.border,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    // Add candlestick series
    const series = chart.addSeries(CandlestickSeries, {
      upColor: theme.colors.success,
      downColor: theme.colors.error,
      borderVisible: false,
      wickUpColor: theme.colors.success,
      wickDownColor: theme.colors.error,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (chartRef.current) {
         chartRef.current.remove();
         chartRef.current = null;
         seriesRef.current = null;
      }
    };
  }, [embedded]);

  // Update data from context
  useEffect(() => {
    if (!seriesRef.current || state.candles.length === 0) return;

    // Lightweight charts requires unique, sorted time
    // Our context handles uniqueness/sorting generally, but let's be safe
    // If it's a new candle update vs full load
    
    // For simplicity, just set data (it's fast enough for <1000 points)
    // In strict real-time, we would use .update() for the last point
    // But setData works fine for small arrays
    
    const uniqueData = state.candles
        .filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.time === v.time) === i)
        .sort((a: any, b: any) => a.time - b.time);

    seriesRef.current.setData(uniqueData as any);
  }, [state.candles]);

  if (!isOpen && !embedded) return null;


  return (
    <div className={`flex flex-col h-full w-full bg-[var(--bg-secondary)] ${isOpen && !embedded ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header - Only show if not embedded or if needed */}
      {!embedded && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
           <div className="flex items-center space-x-3">
             <button onClick={onClose} className="p-1 -ml-1 text-[var(--text-secondary)]">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             </button>
             <h2 className="text-lg font-bold text-[var(--text-primary)]">BTC/USDT</h2>
           </div>
        </div>
      )}
      
      {/* Chart Container */}
      <div className="flex-1 relative w-full h-full min-h-[300px]">
         <div ref={chartContainerRef} className="absolute inset-0" />
      </div>
    </div>
  );
};

export default ChartRoom;
