I will implement the **Telegram-Native Trading Interface** following your 48-hour sprint roadmap. I will start with **Phase 1: The Visual Core**, focusing on the "Top-Movers Strip" and the "One-Tap Chart Room" to immediately upgrade the user experience.

### **Phase 1: Visual Core & Navigation (Current Sprint)**

1.  **Create `TopMoversStrip.tsx`**
    *   **Goal:** Replace the static coin buttons with a Telegram-native horizontal swipe band.
    *   **Tech:** Custom HTML Canvas for 1KB sparklines (no heavy charting lib here).
    *   **Data:** Poll Binance/Backend for 24h% and prices.
    *   **UX:** CSS Scroll Snap for "swipe left for next 5" behavior.

2.  **Create `ChartRoom.tsx` (The "One-Tap" Experience)**
    *   **Goal:** Full-screen immersive chart that slides up over the UI.
    *   **Tech:** `lightweight-charts` (already installed) customized with Aetheria "midnight" theme.
    *   **Features:**
        *   Candle Canvas (1m intervals).
        *   Depth Heat-map (visual bid/ask walls).
        *   Last-Price Line (pulsating on big moves).
    *   **Integration:** Slides up when a coin in the Top-Movers strip is tapped.

3.  **Refactor `AdvancedTradingUI.tsx`**
    *   **Goal:** Orchestrate the new components.
    *   **Changes:**
        *   Remove legacy coin grid.
        *   Mount `TopMoversStrip` at the bottom/top as specified.
        *   Manage state for the full-screen `ChartRoom` overlay.

### **Phase 2: Trading Mechanics (Next Steps)**

4.  **Upgrade `TradingTabs.tsx` to "Trade Ticket"**
    *   **Goal:** Floating bottom sheet (60% height).
    *   **UI:** Implement "Price Wheel" and "Multi-HODL Slider".
    *   **Logic:** Add "Slippage Guard" and "Price Glue" logic (client-side checks before sending to backend).

5.  **Backend Enhancements (`trading-service.js`)**
    *   **Goal:** Support the new order types and risk checks.
    *   **Logic:** Implement the "Internal limit book" match logic (simulated for now) and "Multi-HODL" chain unwinding.

### **Execution Plan**
I will start by creating the `TopMoversStrip` and `ChartRoom` components to get the visual structure in place immediately.
