export const theme = {
  colors: {
    primary: '#3C7EFF',
    background: '#0B0E11',
    surface: '#1E2329',
    surfaceHighlight: '#2B3139',
    textPrimary: '#EAECEF',
    textSecondary: '#848E9C',
    buy: '#0ECB81',
    sell: '#F6465D',
    // Compatibility aliases
    primaryDark: '#0B0E11',
    success: '#0ECB81',
    error: '#F6465D',
    border: '#2B3139',
    blueGradient: 'linear-gradient(135deg, #3C7EFF 0%, #5C9EFF 100%)',
    darkGradient: 'linear-gradient(135deg, #1E2329 0%, #0B0E11 100%)',
    goldGradient: 'linear-gradient(135deg, #FFD700 0%, #FDB931 100%)',
  },
  gradients: {
    blue: 'linear-gradient(135deg, #3C7EFF, #5C9EFF)',
    dark: 'linear-gradient(135deg, #1E2329, #0B0E11)',
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    // Compatibility
    monoFont: "'Roboto Mono', 'Source Code Pro', monospace",
    h1: '2rem',
    h2: '1.5rem',
    h3: '1.25rem',
    body: '0.875rem',
    small: '0.75rem',
  },
  spacing: {
    base: 4,
    unit: 4, // Compatibility
  },
  shadows: {
    soft: '0 4px 20px rgba(0,0,0,0.45)',
  },
  transitions: {
    fast: '150ms',
  },
  animations: {
    gradientSpeed: '7s',
    shimmer: '1.6s',
  },
  effects: {
    glass: 'backdrop-filter: blur(10px); background: rgba(30,35,41,0.6);',
    // Compatibility
    shadow: '0px 4px 24px rgba(0, 0, 0, 0.4)',
    glow: `0 0 15px rgba(60, 126, 255, 0.3)`,
  }
};

export function applyTheme(t: any = theme) {
  const root = document.documentElement;
  function flat(o: any, p = '--ex') {
    for (const k in o) {
      const v = o[k];
      const key = `${p}-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}`;
      if (v && typeof v === 'object') flat(v, key);
      else root.style.setProperty(key, String(v));
    }
  }
  flat(t);
}
