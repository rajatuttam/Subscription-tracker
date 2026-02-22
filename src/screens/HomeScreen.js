import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Switch, StyleSheet, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import FloatingBox from '../components/FloatingBox';
import SubscriptionCard from '../components/SubscriptionCard';
import { getSubscriptions, deleteSubscription } from '../utils/storage';

const HomeScreen = ({ navigation }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [subscriptions, setSubscriptions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [totalMonthly, setTotalMonthly] = useState(0);

  const loadData = async () => {
    const subs = await getSubscriptions();
    setSubscriptions(subs);
    // Calculate total
    const total = subs.reduce((acc, curr) => acc + parseFloat(curr.price || 0), 0);
    setTotalMonthly(total.toFixed(2));
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleDelete = async (id) => {
    // Simple delete confirmation could be added here
    await deleteSubscription(id);
    loadData();
  };

  const renderChart = () => {
      return (
          <FloatingBox style={styles.chartContainer}>
              <Text style={{color: colors.textSecondary, marginBottom: 15, fontSize: 12, letterSpacing: 1}}>MONTHLY SPEND</Text>
              <View style={styles.barsRow}>
                  {[30, 50, 45, 60, 40, 75].map((h, i) => (
                      <View key={i} style={styles.barWrapper}>
                          <View style={[
                              styles.bar, 
                              { 
                                  height: h, 
                                  backgroundColor: i===5 ? (isDarkMode ? '#fff' : '#000') : (isDarkMode ? '#333' : '#ddd') 
                              }
                          ]} />
                          <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                              {['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'][i]}
                          </Text>
                      </View>
                  ))}
              </View>
          </FloatingBox>
      );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}>
          
        {/* Header */}
        <View style={styles.header}>
            <View>
                <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>TOTAL MONTHLY</Text>
                <Text style={[styles.headerValue, { color: colors.text }]}>${totalMonthly}</Text>
            </View>
            <View style={styles.headerButtons}>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.iconButton, { borderColor: colors.border }]}>
                    <Text style={{color: colors.text, fontSize: 16, fontStyle: 'italic', fontWeight: 'bold'}}>i</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('AddSubscription')} 
                    style={[styles.addButton, { backgroundColor: isDarkMode ? '#fff' : '#000' }]}
                >
                    <Text style={[styles.addButtonText, { color: isDarkMode ? '#000' : '#fff' }]}>+ Add</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Chart */}
        {renderChart()}

        {/* Upcoming Bills */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Bills</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {subscriptions.length === 0 ? (
                <Text style={{color: colors.textSecondary, fontStyle: 'italic'}}>No upcoming bills</Text>
            ) : (
                subscriptions.slice(0, 5).map(item => (
                    <View key={item.id} style={{ marginRight: 15 }}>
                        <FloatingBox style={{ width: 100, height: 100, justifyContent: 'center', alignItems: 'center', padding: 10 }}>
                             <View style={[styles.miniIcon, { backgroundColor: item.color || '#333' }]}>
                                <Text style={{color: '#fff', fontWeight: 'bold'}}>{item.name.charAt(0).toUpperCase()}</Text>
                             </View>
                             <Text numberOfLines={1} style={{color: colors.text, fontWeight: 'bold', marginTop: 8, fontSize: 12}}>{item.name}</Text>
                             <Text style={{color: colors.text, fontSize: 10}}>${item.price}</Text>
                        </FloatingBox>
                    </View>
                ))
            )}
        </ScrollView>

        {/* Subscriptions List */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Subscriptions</Text>
        <View style={styles.listContainer}>
            {subscriptions.length === 0 ? (
                 <Text style={{color: colors.textSecondary, textAlign: 'center', marginTop: 20}}>No subscriptions added yet.</Text>
            ) : (
                subscriptions.map(item => (
                    <TouchableOpacity key={item.id} onLongPress={() => handleDelete(item.id)} activeOpacity={0.7}>
                        <SubscriptionCard item={item} />
                    </TouchableOpacity>
                ))
            )}
        </View>

      </ScrollView>

      {/* Info Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[styles.creditText, { color: colors.text }]}>Credit to Rajat</Text>
                
                <View style={styles.switchRow}>
                    <Text style={{ color: colors.text, fontSize: 16 }}>Dark Mode</Text>
                    <Switch 
                        value={isDarkMode} 
                        onValueChange={toggleTheme} 
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
                    />
                </View>

                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                    <Text style={{ color: '#0A84FF', fontSize: 16, fontWeight: 'bold' }}>Close</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  headerLabel: {
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '600',
  },
  headerValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontWeight: 'bold',
  },
  chartContainer: {
    height: 200,
    marginBottom: 24,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 10,
  },
  barWrapper: {
    alignItems: 'center',
  },
  bar: {
    width: 30,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  horizontalScroll: {
    flexGrow: 0,
    marginBottom: 10,
  },
  miniIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
  },
  creditText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  closeButton: {
    padding: 10,
  }
});

export default HomeScreen;
