import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import FloatingBox from './FloatingBox';

const SubscriptionCard = ({ item }) => {
  const { colors } = useTheme();
  
  // Calculate days left
  const calculateDaysLeft = (renewalDateStr) => {
    if (!renewalDateStr) return '';
    const now = new Date();
    const renewal = new Date(renewalDateStr);
    
    // Set both to midnight to compare days
    now.setHours(0,0,0,0);
    renewal.setHours(0,0,0,0);
    
    const diffTime = renewal - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    return `${diffDays}d left`;
  };

  const daysLeft = calculateDaysLeft(item.renewalDate);

  return (
    <FloatingBox style={styles.container}>
      <View style={styles.leftContainer}>
        <View style={[styles.iconPlaceholder, { backgroundColor: item.color || '#333' }]}> 
          <Text style={styles.iconText}>{item.name ? item.name.charAt(0).toUpperCase() : '?'}</Text>
        </View>
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.daysLeft, { color: colors.textSecondary }]}>{daysLeft}</Text>
        </View>
      </View>
      <View>
        <Text style={[styles.price, { color: colors.text }]}>${item.price}</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
            {item.renewalDate ? new Date(item.renewalDate).toLocaleDateString() : ''}
        </Text>
      </View>
    </FloatingBox>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cycle: {
    fontSize: 12,
  },
  daysLeft: {
    fontSize: 12,
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  date: {
    fontSize: 12,
    textAlign: 'right',
  },
});

export default SubscriptionCard;
