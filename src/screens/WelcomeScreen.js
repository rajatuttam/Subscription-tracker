import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const WelcomeScreen = ({ navigation }) => {
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Use replace to prevent going back to splash screen
      navigation.replace('Home');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>$</Text>
      </View>
      <Text style={[styles.logoText, { color: colors.text }]}>Subscription Tracker</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  iconText: {
    fontSize: 50,
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default WelcomeScreen;
