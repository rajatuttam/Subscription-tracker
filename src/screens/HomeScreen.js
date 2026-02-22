import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadSubscriptions, deleteSubscription } from '../utils/storage';
import { scheduleAllNotifications, requestPermissions } from '../utils/notifications';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 140;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Spend Chart (Pure View — no SVG dependency) ──────────────────────────────
function SpendChart({ subscriptions }) {
  const now = new Date();
  const currentMonth = now.getMonth();

  const monthData = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth - 5 + i + 12) % 12;
    const base = subscriptions.reduce((sum, s) => sum + parseFloat(s.price || 0), 0);
    const variance = i === 5 ? 0 : Math.sin(i * 1.3) * base * 0.2;
    return {
      label: MONTHS[monthIndex],
      value: Math.max(0, parseFloat((base + variance).toFixed(2))),
    };
  });

  const maxVal = Math.max(...monthData.map((d) => d.value), 1);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Monthly Spend</Text>

      {/* Y-axis labels + bars area */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT }}>
        {/* Y-axis */}
        <View style={{ width: 38, height: CHART_HEIGHT, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6, paddingBottom: 20 }}>
          {[1, 0.75, 0.5, 0.25, 0].map((ratio, i) => (
            <Text key={i} style={styles.chartYLabel}>${(maxVal * ratio).toFixed(0)}</Text>
          ))}
        </View>

        {/* Bars */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT, paddingBottom: 20 }}>
          {monthData.map((d, i) => {
            const isLast = i === 5;
            const barHeightPct = maxVal > 0 ? (d.value / maxVal) : 0;
            const barHeight = Math.max(4, barHeightPct * (CHART_HEIGHT - 20));
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_HEIGHT - 20 }}>
                {/* Value label on top of current month bar */}
                {isLast && d.value > 0 && (
                  <Text style={styles.chartBarValue}>${d.value.toFixed(0)}</Text>
                )}
                <View style={[
                  styles.chartBar,
                  { height: barHeight, backgroundColor: isLast ? '#fff' : '#222' },
                ]} />
              </View>
            );
          })}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={{ flexDirection: 'row', marginLeft: 38 }}>
        {monthData.map((d, i) => (
          <Text key={i} style={[styles.chartXLabel, i === 5 && { color: '#fff' }]}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Subscription Card ─────────────────────────────────────────────────────────
function SubCard({ sub, onDelete }) {
  const renewDate = new Date(sub.renewalDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = renewDate - today;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isUrgent = daysLeft <= 2 && daysLeft >= 0;
  const isOverdue = daysLeft < 0;

  const confirmDelete = () => {
    Alert.alert('Delete', `Remove "${sub.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => onDelete(sub.id),
      },
    ]);
  };

  return (
    <View style={[styles.card, isUrgent && styles.cardUrgent]}>
      <View style={styles.cardLeft}>
        <View style={styles.cardIconCircle}>
          <Text style={styles.cardIconText}>{sub.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{sub.name}</Text>
          <Text style={styles.cardCycle}>{sub.cycle || 'Monthly'}</Text>
          <Text style={[
            styles.cardDaysLeft,
            isUrgent && styles.textUrgent,
            isOverdue && styles.textOverdue,
          ]}>
            {isOverdue
              ? `Overdue by ${Math.abs(daysLeft)}d`
              : daysLeft === 0
                ? 'Due today'
                : `${daysLeft}d left`}
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardPrice}>${parseFloat(sub.price).toFixed(2)}</Text>
        <Text style={styles.cardDate}>{renewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
        <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Info Modal ────────────────────────────────────────────────────────────────
function InfoModal({ visible, onClose }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>SubTracker</Text>
          <View style={styles.modalDivider} />
          <Text style={styles.modalRow}>Author  <Text style={styles.modalValue}>Anthony</Text></Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://github.com/ring')}
            style={styles.modalLinkRow}
          >
            <Text style={styles.modalRow}>GitHub  </Text>
            <Text style={styles.modalLink}>ring</Text>
          </TouchableOpacity>
          <View style={styles.modalDivider} />
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── HomeScreen ────────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [infoVisible, setInfoVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const subs = await loadSubscriptions();
        setSubscriptions(subs);
        await requestPermissions();
        await scheduleAllNotifications(subs);
      })();
    }, [])
  );

  const handleDelete = async (id) => {
    const updated = await deleteSubscription(id);
    setSubscriptions(updated);
  };

  const totalMonthly = subscriptions.reduce((sum, s) => {
    const price = parseFloat(s.price) || 0;
    if (s.cycle === 'Yearly') return sum + price / 12;
    if (s.cycle === 'Weekly') return sum + price * 4;
    return sum + price;
  }, 0);

  // Upcoming: next 7 days
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcoming = subscriptions
    .filter((s) => {
      const d = new Date(s.renewalDate);
      const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Total Monthly</Text>
            <Text style={styles.headerAmount}>${totalMonthly.toFixed(2)}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.infoBtn} onPress={() => setInfoVisible(true)}>
              <Text style={styles.infoBtnText}>i</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddSubscription')}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        <SpendChart subscriptions={subscriptions} />

        {/* Upcoming Bills */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Bills</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcoming.map((sub) => {
                const d = new Date(sub.renewalDate);
                const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
                return (
                  <View key={sub.id} style={styles.upcomingCard}>
                    <View style={styles.upcomingIconCircle}>
                      <Text style={styles.upcomingIcon}>{sub.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.upcomingName} numberOfLines={1}>{sub.name}</Text>
                    <Text style={styles.upcomingPrice}>${parseFloat(sub.price).toFixed(2)}</Text>
                    <Text style={styles.upcomingDays}>
                      {diff === 0 ? 'Today' : `${diff}d left`}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* All Subscriptions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Subscriptions
            <Text style={styles.sectionCount}>  {subscriptions.length}</Text>
          </Text>

          {subscriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>◎</Text>
              <Text style={styles.emptyText}>No subscriptions yet.</Text>
              <Text style={styles.emptySubText}>Tap + Add to get started.</Text>
            </View>
          ) : (
            subscriptions
              .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
              .map((sub) => (
                <SubCard key={sub.id} sub={sub} onDelete={handleDelete} />
              ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  headerSub: {
    color: '#555',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerAmount: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -1,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  addBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // Chart
  chartContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  chartTitle: {
    color: '#555',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 12,
  },
  chartBar: {
    width: '70%',
    borderRadius: 4,
  },
  chartBarValue: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  chartYLabel: {
    color: '#333',
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  chartXLabel: {
    flex: 1,
    color: '#444',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  sectionCount: {
    color: '#444',
    fontWeight: '400',
    fontSize: 14,
  },

  // Upcoming card
  upcomingCard: {
    backgroundColor: '#0d0d0d',
    borderRadius: 14,
    padding: 14,
    marginRight: 10,
    width: 110,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  upcomingIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  upcomingIcon: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
  },
  upcomingName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  upcomingPrice: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  upcomingDays: {
    color: '#555',
    fontSize: 10,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  // Sub card
  card: {
    backgroundColor: '#0d0d0d',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  cardUrgent: {
    borderColor: '#fff',
    borderWidth: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2f2f2f',
  },
  cardIconText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  cardName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  cardCycle: {
    color: '#444',
    fontSize: 11,
    marginTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 0.5,
  },
  cardDaysLeft: {
    color: '#555',
    fontSize: 11,
    marginTop: 3,
  },
  textUrgent: {
    color: '#fff',
    fontWeight: '700',
  },
  textOverdue: {
    color: '#888',
    textDecorationLine: 'line-through',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cardPrice: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
  cardDate: {
    color: '#444',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  deleteBtn: {
    marginTop: 4,
    padding: 4,
  },
  deleteBtnText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 40,
    color: '#222',
    marginBottom: 12,
  },
  emptyText: {
    color: '#444',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#333',
    fontSize: 13,
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: '#0d0d0d',
    borderRadius: 18,
    padding: 28,
    width: SCREEN_WIDTH * 0.78,
    borderWidth: 1,
    borderColor: '#222',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#1f1f1f',
    marginVertical: 14,
  },
  modalRow: {
    color: '#555',
    fontSize: 14,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  modalValue: {
    color: '#fff',
    fontWeight: '600',
  },
  modalLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalLink: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  modalCloseBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  modalCloseTxt: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
