import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Modal,
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

const DARK = {
  bg: '#000000', surface: '#0d0d0d', surface2: '#111111',
  border: '#1f1f1f', border2: '#2a2a2a',
  text: '#ffffff', textMuted: '#666666', textDim: '#333333', textSub: '#888888',
  accent: '#ffffff', accentText: '#000000',
  chartBar: '#222222', chartBarActive: '#ffffff',
  iconBg: '#1a1a1a', urgentBorder: '#ffffff',
  deleteColor: '#333333', toggleBg: '#1a1a1a',
  modalOverlay: 'rgba(0,0,0,0.88)',
};

const LIGHT = {
  bg: '#f5f5f5', surface: '#ffffff', surface2: '#eeeeee',
  border: '#e0e0e0', border2: '#cccccc',
  text: '#000000', textMuted: '#888888', textDim: '#bbbbbb', textSub: '#666666',
  accent: '#000000', accentText: '#ffffff',
  chartBar: '#e0e0e0', chartBarActive: '#000000',
  iconBg: '#eeeeee', urgentBorder: '#000000',
  deleteColor: '#cccccc', toggleBg: '#e5e5e5',
  modalOverlay: 'rgba(0,0,0,0.5)',
};

function SpendChart({ subscriptions, T }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const monthData = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth - 5 + i + 12) % 12;
    const base = subscriptions.reduce((sum, s) => sum + parseFloat(s.price || 0), 0);
    const variance = i === 5 ? 0 : Math.sin(i * 1.3) * base * 0.2;
    return { label: MONTHS[monthIndex], value: Math.max(0, Math.round(base + variance)) };
  });
  const maxVal = Math.max(...monthData.map(d => d.value), 1);

  return (
    <View style={[styles.chartContainer, { backgroundColor: T.surface, borderColor: T.border }]}>
      <Text style={[styles.chartTitle, { color: T.textMuted }]}>Monthly Spend</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT }}>
        <View style={{ width: 48, height: CHART_HEIGHT, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 8, paddingBottom: 20 }}>
          {[1, 0.5, 0].map((r, i) => (
            <Text key={i} style={[styles.chartYLabel, { color: T.textMuted }]}>
              ₹{Math.round(maxVal * r)}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT, paddingBottom: 20 }}>
          {monthData.map((d, i) => {
            const isLast = i === 5;
            const barHeight = Math.max(4, (d.value / maxVal) * (CHART_HEIGHT - 24));
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_HEIGHT - 24 }}>
                {isLast && d.value > 0 && (
                  <Text style={[styles.chartBarValue, { color: T.chartBarActive }]}>₹{d.value}</Text>
                )}
                <View style={[styles.chartBar, { height: barHeight, backgroundColor: isLast ? T.chartBarActive : T.chartBar }]} />
              </View>
            );
          })}
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginLeft: 48 }}>
        {monthData.map((d, i) => (
          <Text key={i} style={[styles.chartXLabel, { color: i === 5 ? T.text : T.textMuted, fontWeight: i === 5 ? '700' : '400' }]}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function SubCard({ sub, onDelete, T }) {
  const renewDate = new Date(sub.renewalDate);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((renewDate - today) / 86400000);
  const isUrgent = daysLeft <= 2 && daysLeft >= 0;
  const isOverdue = daysLeft < 0;

  return (
    <View style={[styles.card, { backgroundColor: T.surface, borderColor: isUrgent ? T.urgentBorder : T.border, borderWidth: isUrgent ? 1.5 : 1 }]}>
      <View style={styles.cardLeft}>
        <View style={[styles.cardIconCircle, { backgroundColor: T.iconBg, borderColor: T.border2 }]}>
          <Text style={[styles.cardIconText, { color: T.text }]}>{sub.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardName, { color: T.text }]}>{sub.name}</Text>
          <Text style={[styles.cardCycle, { color: T.textMuted }]}>{sub.cycle || 'Monthly'}</Text>
          <Text style={[styles.cardDaysLeft, {
            color: isUrgent ? T.text : isOverdue ? T.textSub : T.textMuted,
            fontWeight: isUrgent ? '700' : '400',
            textDecorationLine: isOverdue ? 'line-through' : 'none',
          }]}>
            {isOverdue ? `Overdue ${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? '⚡ Due today' : isUrgent ? `⚡ ${daysLeft}d left` : `${daysLeft}d left`}
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.cardPrice, { color: T.text }]}>₹{parseFloat(sub.price).toFixed(0)}</Text>
        <Text style={[styles.cardDate, { color: T.textMuted }]}>
          {renewDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => Alert.alert('Delete', `Remove "${sub.name}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(sub.id) },
        ])} style={styles.deleteBtn}>
          <Text style={[styles.deleteBtnText, { color: T.deleteColor }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoModal({ visible, onClose, T }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: T.modalOverlay }]} activeOpacity={1} onPress={onClose}>
        <View style={[styles.modalBox, { backgroundColor: T.surface, borderColor: T.border }]}>
          <Text style={[styles.modalAppName, { color: T.text }]}>SubTracker</Text>
          <Text style={[styles.modalTagline, { color: T.textMuted }]}>Track your subscriptions effortlessly.</Text>
          <View style={[styles.modalDivider, { backgroundColor: T.border }]} />
          <View style={styles.modalRow}>
            <Text style={[styles.modalLabel, { color: T.textMuted }]}>Author</Text>
            <Text style={[styles.modalValue, { color: T.text }]}>Anthony</Text>
          </View>
          <View style={styles.modalRow}>
            <Text style={[styles.modalLabel, { color: T.textMuted }]}>GitHub</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://github.com/ring')}>
              <Text style={[styles.modalLink, { color: T.text }]}>ring ↗</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalRow}>
            <Text style={[styles.modalLabel, { color: T.textMuted }]}>Version</Text>
            <Text style={[styles.modalValue, { color: T.text }]}>1.0.0</Text>
          </View>
          <View style={[styles.modalDivider, { backgroundColor: T.border }]} />
          <TouchableOpacity onPress={onClose} style={[styles.modalCloseBtn, { backgroundColor: T.surface2, borderColor: T.border }]}>
            <Text style={[styles.modalCloseTxt, { color: T.text }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function HomeScreen({ navigation }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [infoVisible, setInfoVisible] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const T = isDark ? DARK : LIGHT;

  useFocusEffect(useCallback(() => {
    (async () => {
      const subs = await loadSubscriptions();
      setSubscriptions(subs);
      await requestPermissions();
      await scheduleAllNotifications(subs);
    })();
  }, []));

  const handleDelete = async (id) => {
    const updated = await deleteSubscription(id);
    setSubscriptions(updated);
  };

  const totalMonthly = subscriptions.reduce((sum, s) => {
    const p = parseFloat(s.price) || 0;
    if (s.cycle === 'Yearly') return sum + p / 12;
    if (s.cycle === 'Weekly') return sum + p * 4.33;
    return sum + p;
  }, 0);

  const now = new Date(); now.setHours(0, 0, 0, 0);
  const upcoming = subscriptions
    .filter(s => { const d = Math.ceil((new Date(s.renewalDate) - now) / 86400000); return d >= 0 && d <= 7; })
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={T.bg} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerLabel, { color: T.textMuted }]}>Total Monthly</Text>
            <Text style={[styles.headerAmount, { color: T.text }]}>₹{Math.round(totalMonthly)}</Text>
            <Text style={[styles.headerSubs, { color: T.textMuted }]}>
              {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {/* Theme toggle */}
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: T.surface2, borderColor: T.border }]}
              onPress={() => setIsDark(!isDark)}
            >
              <Text style={styles.iconBtnEmoji}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            {/* Info */}
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: T.surface2, borderColor: T.border }]}
              onPress={() => setInfoVisible(true)}
            >
              <Text style={[styles.infoBtnText, { color: T.textMuted }]}>i</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        <SpendChart subscriptions={subscriptions} T={T} />

        {/* Upcoming Bills */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: T.text }]}>Upcoming Bills</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcoming.map(sub => {
                const diff = Math.ceil((new Date(sub.renewalDate) - now) / 86400000);
                return (
                  <View key={sub.id} style={[styles.upcomingCard, { backgroundColor: T.surface, borderColor: T.border }]}>
                    <View style={[styles.upcomingIconCircle, { backgroundColor: T.accent }]}>
                      <Text style={[styles.upcomingIconText, { color: T.accentText }]}>
                        {sub.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.upcomingName, { color: T.text }]} numberOfLines={1}>{sub.name}</Text>
                    <Text style={[styles.upcomingPrice, { color: T.text }]}>₹{parseFloat(sub.price).toFixed(0)}</Text>
                    <Text style={[styles.upcomingDays, { color: T.textMuted }]}>{diff === 0 ? 'Today' : `${diff}d left`}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Subscriptions List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: T.text }]}>Subscriptions</Text>
            <View style={[styles.countBadge, { backgroundColor: T.surface2, borderColor: T.border }]}>
              <Text style={[styles.countBadgeText, { color: T.textMuted }]}>{subscriptions.length}</Text>
            </View>
          </View>

          {subscriptions.length === 0 ? (
            <View style={[styles.emptyState, { borderColor: T.border }]}>
              <Text style={styles.emptyIcon}>◎</Text>
              <Text style={[styles.emptyText, { color: T.textMuted }]}>No subscriptions yet</Text>
              <Text style={[styles.emptySubText, { color: T.textDim }]}>Tap + below to add one</Text>
            </View>
          ) : (
            [...subscriptions]
              .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
              .map(sub => <SubCard key={sub.id} sub={sub} onDelete={handleDelete} T={T} />)
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: T.accent, shadowColor: T.text }]}
          onPress={() => navigation.navigate('AddSubscription')}
          activeOpacity={0.85}
        >
          <Text style={[styles.fabText, { color: T.accentText }]}>＋  Add Subscription</Text>
        </TouchableOpacity>
      </View>

      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} T={T} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 52 : 60 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 4 },
  headerAmount: { fontSize: 44, fontWeight: '800', letterSpacing: -2 },
  headerSubs: { fontSize: 12, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  headerActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconBtnEmoji: { fontSize: 18 },
  infoBtnText: { fontSize: 17, fontStyle: 'italic', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  chartContainer: { borderRadius: 18, padding: 16, marginBottom: 28, borderWidth: 1 },
  chartTitle: { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 12 },
  chartBar: { width: '68%', borderRadius: 5 },
  chartBarValue: { fontSize: 9, fontWeight: '700', marginBottom: 3, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  chartYLabel: { fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  chartXLabel: { flex: 1, fontSize: 9, textAlign: 'center', marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  countBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  countBadgeText: { fontSize: 12, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },

  upcomingCard: { borderRadius: 16, padding: 14, marginRight: 10, width: 112, alignItems: 'center', borderWidth: 1 },
  upcomingIconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  upcomingIconText: { fontWeight: '800', fontSize: 18 },
  upcomingName: { fontWeight: '600', fontSize: 12, textAlign: 'center', marginBottom: 4 },
  upcomingPrice: { fontWeight: '700', fontSize: 14 },
  upcomingDays: { fontSize: 10, marginTop: 3, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },

  card: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  cardIconCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cardIconText: { fontWeight: '800', fontSize: 19 },
  cardName: { fontWeight: '600', fontSize: 15, marginBottom: 2 },
  cardCycle: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  cardDaysLeft: { fontSize: 11, marginTop: 4 },
  cardRight: { alignItems: 'flex-end', gap: 3 },
  cardPrice: { fontWeight: '800', fontSize: 18 },
  cardDate: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  deleteBtn: { marginTop: 6, padding: 4 },
  deleteBtnText: { fontSize: 14, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 52, borderWidth: 1, borderRadius: 18, borderStyle: 'dashed' },
  emptyIcon: { fontSize: 44, marginBottom: 12, color: '#ccc' },
  emptyText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptySubText: { fontSize: 13 },

  fabWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingBottom: 34 },
  fab: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 50, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12 },
  fabText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalBox: { borderRadius: 22, padding: 28, width: SCREEN_WIDTH * 0.82, borderWidth: 1 },
  modalAppName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  modalTagline: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  modalDivider: { height: 1, marginVertical: 16 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalLabel: { fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  modalValue: { fontSize: 13, fontWeight: '700' },
  modalLink: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  modalCloseBtn: { alignItems: 'center', paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
  modalCloseTxt: { fontWeight: '700', fontSize: 14 },
});
  
