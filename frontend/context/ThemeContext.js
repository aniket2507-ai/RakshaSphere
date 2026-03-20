import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
  dark: {
    name: 'dark',
    bg:          '#020817',
    bgBase:      '#0a1628',
    bgCard:      'rgba(255,255,255,0.04)',
    border:      'rgba(255,255,255,0.07)',
    textPrimary: '#f1f5f9',
    textSecond:  '#94a3b8',
    textMuted:   '#64748b',
    textDim:     '#334155',
    searchBg:    'rgba(255,255,255,0.97)',
    searchText:  '#1a1a2e',
    badgeBg:     'rgba(255,255,255,0.92)',
    badgeText:   '#333',
    tileUrl:     'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    sidebarBg:   'linear-gradient(180deg, #0a1628 0%, #060d1a 100%)',
    topbarBg:    'linear-gradient(90deg, rgba(10,22,40,0.98) 0%, rgba(2,8,23,0.98) 100%)',
    accent:      '#3b82f6',
    accentDim:   'rgba(59,130,246,0.15)',
    accentBorder:'rgba(59,130,246,0.3)',
  },
  light: {
    name: 'light',
    bg:          '#f8fafc',
    bgBase:      '#ffffff',
    bgCard:      'rgba(0,0,0,0.02)',
    border:      'rgba(0,0,0,0.07)',
    textPrimary: '#0f172a',
    textSecond:  '#475569',
    textMuted:   '#64748b',
    textDim:     '#94a3b8',
    searchBg:    'rgba(255,255,255,0.98)',
    searchText:  '#1a1a2e',
    badgeBg:     'rgba(255,255,255,0.95)',
    badgeText:   '#333',
    tileUrl:     'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    sidebarBg:   'linear-gradient(180deg, #ffffff 0%, #f0f4f8 100%)',
    topbarBg:    'linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
    accent:      '#2563eb',
    accentDim:   'rgba(37,99,235,0.1)',
    accentBorder:'rgba(37,99,235,0.25)',
  },
};

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('dark');
  const theme = THEMES[themeName];

  const toggle = () => setThemeName(n => n === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.background = theme.bg;
    }
  }, [theme.bg]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
