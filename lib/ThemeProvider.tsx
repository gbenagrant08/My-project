import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { makeTheme, type Theme } from './theme';
import { useAppStore } from './store/AppStore';

const ThemeContext = createContext<Theme>(makeTheme('gold'));

export function ThemeProvider({ children }: { children: ReactNode }) {
  const accent = useAppStore().accent;
  const theme = useMemo(() => makeTheme(accent), [accent]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
