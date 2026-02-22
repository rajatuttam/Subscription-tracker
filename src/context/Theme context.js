import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load saved theme preference
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode ? {
      background: '#000000',
      text: '#FFFFFF',
      card: '#1C1C1E',
      border: '#2C2C2E',
      primary: '#0A84FF',
      textSecondary: '#8E8E93',
      inputBackground: '#1C1C1E',
      buttonText: '#000000',
      buttonBackground: '#FFFFFF'
    } : {
      background: '#F2F2F7', // iOS light gray
      text: '#000000',
      card: '#FFFFFF',
      border: '#E5E5EA',
      primary: '#007AFF',
      textSecondary: '#8E8E93',
      inputBackground: '#FFFFFF',
      buttonText: '#FFFFFF',
      buttonBackground: '#000000'
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

