import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const FloatingBox = ({ children, style }) => {
  const { isDarkMode, colors } = useTheme();

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.card },
      !isDarkMode && styles.shadow,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8, // for Android
  },
});

export default FloatingBox;
