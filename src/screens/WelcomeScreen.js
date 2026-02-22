import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ onFinish }) {
  const logoScale   = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo pops in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Text fades in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(900),
      // Fade everything out
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: fadeOut }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Logo */}
      <Animated.View style={[
        styles.logoWrap,
        { opacity: logoOpacity, transform: [{ scale: logoScale }] },
      ]}>
        <View style={styles.logoOuter}>
          <View style={styles.logoInner}>
            <Text style={styles.logoSymbol}>₹</Text>
          </View>
        </View>
        {/* Decorative ring */}
        <View style={styles.ring1} />
        <View style={styles.ring2} />
      </Animated.View>

      {/* App name */}
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={styles.appName}>Subscription</Text>
        <Text style={styles.appNameBold}>Tracker</Text>
        <View style={styles.taglineLine} />
        <Text style={styles.tagline}>Know what you pay. Always.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
    height: 130,
  },
  logoOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  logoSymbol: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '900',
  },
  ring1: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 63,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 1,
  },
  ring2: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 73,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    zIndex: 0,
  },
  appName: {
    color: '#555',
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  appNameBold: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 8,
    textTransform: 'uppercase',
    marginTop: -4,
  },
  taglineLine: {
    width: 40,
    height: 1,
    backgroundColor: '#333',
    marginVertical: 12,
  },
  tagline: {
    color: '#444',
    fontSize: 12,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
});
