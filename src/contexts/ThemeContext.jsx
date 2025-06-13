import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [ageGroup, setAgeGroup] = useState('teen'); // child, teen, adult

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('cody-verse-theme');
    const savedAgeGroup = localStorage.getItem('cody-verse-age-group');
    
    if (savedTheme) setTheme(savedTheme);
    if (savedAgeGroup) setAgeGroup(savedAgeGroup);
  }, []);

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('cody-verse-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const updateAgeGroup = (newAgeGroup) => {
    setAgeGroup(newAgeGroup);
    localStorage.setItem('cody-verse-age-group', newAgeGroup);
    document.documentElement.setAttribute('data-age-group', newAgeGroup);
  };

  const getThemeStyles = () => {
    const baseTheme = {
      dark: {
        '--primary': '#4F46E5',
        '--secondary': '#22D3EE',
        '--accent': '#FACC15',
        '--background': '#1F2937',
        '--surface': '#111827',
        '--text-primary': '#F9FAFB'
      },
      light: {
        '--primary': '#4F46E5',
        '--secondary': '#22D3EE',
        '--accent': '#FACC15',
        '--background': '#F9FAFB',
        '--surface': '#FFFFFF',
        '--text-primary': '#111827'
      }
    };

    const ageStyles = {
      child: {
        '--radius-base': '1rem',
        '--font-primary': '"Comic Neue", cursive',
        '--animation-speed': '0.5s'
      },
      teen: {
        '--radius-base': '0.75rem',
        '--font-primary': '"Poppins", sans-serif',
        '--animation-speed': '0.3s'
      },
      adult: {
        '--radius-base': '0.5rem',
        '--font-primary': '"Inter", sans-serif',
        '--animation-speed': '0.2s'
      }
    };

    return {
      ...baseTheme[theme],
      ...ageStyles[ageGroup]
    };
  };

  const value = {
    theme,
    ageGroup,
    updateTheme,
    updateAgeGroup,
    getThemeStyles,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};