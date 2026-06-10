import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeContext } from './ThemeContext';
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      root.dataset.theme = 'dark';
      body.classList.add('bp6-dark');
      localStorage.setItem('theme', 'dark');
    } else {
      delete root.dataset.theme;
      body.classList.remove('bp6-dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  const value = useMemo(() => ({ isDark, toggleTheme }), [isDark, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};