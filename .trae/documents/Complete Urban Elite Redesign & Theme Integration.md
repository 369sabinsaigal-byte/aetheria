# Phase 4: Complete Core Redesign & Theme Integration

I will finalize the redesign by applying the **Urban Elite** design system to the remaining core pages (**Growth Vaults** and **Trading Platform**) to ensure full consistency.

## 1. 🏦 Redesign Growth Vaults
**Goal**: Educate and inspire confidence with a data-rich, animated interface.
- **New Component**: `src/components/VaultDetailCard.tsx`
  - **Visuals**: Professional "Card" style using `theme.surface`.
  - **Charts**: 
    - **Allocation Pie Chart**: Animated SVG ring chart showing asset distribution.
    - **Performance Graph**: Simple line graph using `framer-motion` to visualize APY trends.
  - **Interaction**: "Invest Now" button with gold gradient and hover glow.
- **Update**: `src/components/Vaults.tsx` to use the new `VaultDetailCard` grid layout.

## 2. 📈 Refactor Trading Platform Theme
**Goal**: Align the trading interface with the global `theme.ts` variables.
- **Update**: `ProfessionalTradingUI.tsx`, `ChartRoom.tsx`, `OrderBook.tsx`, `TradingPanel.tsx`.
- **Changes**:
  - Replace hardcoded hex values (e.g., `#0B0B0F`, `#1A1A1E`) with `theme.colors.background` and `theme.colors.surface`.
  - Update primary accents to `theme.colors.primary` (Champagne Gold).
  - Ensure charts and order book colors match `theme.colors.success` and `theme.colors.error`.

## 3. 🧹 Final Polish
- Verify consistency across all pages (Dashboard, Vaults, Trade, Card).
- Ensure all animations (framer-motion) are performant and non-intrusive.
