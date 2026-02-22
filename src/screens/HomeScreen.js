import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Linking, Modal,
  Dimensions, StatusBar, Platform, Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadSubscriptions, deleteSubscription } from '../utils/storage';
import { scheduleAllNotifications, requestPermissions } from '../utils/notifications';
import { DARK, LIGHT } from '../utils/theme';

const { width: SW } = Dimensions.get('window');
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CHART_H = 150;

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function SpendChart({ subs, T }) {
  const now = new Date();
  const cm  = now.getMonth();
  const data = Array.from({ length: 6 }, (_, i) => {
    const mi   = (cm - 5 + i + 12) % 12;
    const base = subs.reduce((s, x) => s + parseFloat(x.price || 0), 0);
    const v    = i === 5 ? 0 : Math.sin(i * 1.4) * base * 0.18;
    return { label: MONTHS[mi], value: Math.max(0, Math.round(base + v)) };
  });
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={[c.chartBox, { backgroundColor: T.surface, borderColor: T.border,
      shadowColor: T.cardShadow, shadowOffset:{width:0,height:4}, shadowOpacity:1, shadowRadius:12, elevation:4 }]}>
      <Text style={[c.chartLabel, { color: T.textMuted }]}>MONTHLY SPEND</Text>
      <View style={{ flexDirection:'row', height: CHART_H }}>
        {/* Y axis */}
        <View style={{ width:44, justifyContent:'space-between', alignItems:'flex-end',
          paddingRight:8, paddingBottom:20, height: CHART_H }}>
          {[1,0.5,0].map((r,i) => (
            <Text key={i} style={[c.yLabel, { color: T.textMuted }]}>
              ₹{Math.round(max * r)}
            </Text>
          ))}
        </View>
        {/* Bars */}
        <View style={{ flex:1, flexDirection:'row', alignItems:'flex-end',
          paddingBottom:20, height: CHART_H }}>
          {data.map((d, i) => {
            const isNow = i === 5;
            const bh = Math.max(4, (d.value / max) * (CHART_H - 28));
            return (
              <View key={i} style={{ flex:1, alignItems:'center',
                justifyContent:'flex-end', height: CHART_H - 28 }}>
                {isNow && d.value > 0 && (
                  <Text style={[c.barVal, { color: T.chartBarActive }]}>₹{d.value}</Text>
                )}
                <View style={[c.bar, { height: bh,
                  backgroundColor: isNow ? T.chartBarActive : T.chartBar }]} />
              </View>
            );
          })}
        </View>
      </View>
      {/* X labels */}
      <View style={{ flexDirection:'row', marginLeft:44 }}>
        {data.map((d,i) => (
          <Text key={i} style={[c.xLabel, {
            color: i === 5 ? T.text : T.textMuted,
            fontWeight: i === 5 ? '700' : '400',
          }]}>{d.label}</Text>
        ))}
      </View>
    </View>
  );
}

// ─── Sub Card ─────────────────────────────────────────────────────────────────
function SubCard({ sub, onDelete, T }) {
  const rd   = new Date(sub.renewalDate);
  const tod  = new Date(); tod.setHours(0,0,0,0);
  const days = Math.ceil((rd - tod) / 86400000);
  const urgent  = days <= 2 && days >= 0;
  const overdue = days < 0;

  const daysText = overdue
    ? `Overdue ${Math.abs(days)}d ago`
    : days === 0 ? '⚡ Due today'
    : urgent ? `⚡ ${days}d left`
    : `${days}d left`;

  return (
    <View style={[c.card, {
      backgroundColor: T.surface,
      borderColor: urgent ? T.urgentBorder : T.border,
      borderWidth: urgent ? 1.5 : 1,
      shadowColor: T.cardShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 14,
      elevation: 5,
    }]}>
      {/* Icon */}
      <View style={[c.cardIcon, { backgroundColor: T.iconBg, borderColor: T.border2 }]}>
        <Text style={[c.cardIconTxt, { color: T.text }]}>
          {sub.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      {/* Info */}
      <View style={{ flex:1, marginLeft:14 }}>
        <Text style={[c.cardName, { color: T.text }]}>{sub.name}</Text>
        <Text style={[c.cardCycle, { color: T.textMuted }]}>{sub.cycle || 'Monthly'}</Text>
        <Text style={[c.cardDays, {
          color: urgent ? T.text : overdue ? T.textMuted : T.textMuted,
          fontWeight: urgent ? '700' : '400',
          textDecorationLine: overdue ? 'line-through' : 'none',
        }]}>{daysText}</Text>
      </View>
      {/* Price + Date + Delete */}
      <View style={{ alignItems:'flex-end', gap:4 }}>
        <Text style={[c.cardPrice, { color: T.text }]}>
          ₹{parseFloat(sub.price).toFixed(0)}
        </Text>
        <Text style={[c.cardDate, { color: T.textMuted }]}>
          {rd.toLocaleDateString('en-IN', { month:'short', day:'numeric' })}
        </Text>
        <TouchableOpacity onPress={() =>
          Alert.alert('Delete', `Remove "${sub.name}"?`, [
            { text:'Cancel', style:'cancel' },
            { text:'Delete', style:'destructive', onPress:() => onDelete(sub.id) },
          ])
        } style={{ padding:4, marginTop:2 }}>
          <Text style={[c.deleteTxt, { color: T.deleteColor }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Info Modal ───────────────────────────────────────────────────────────────
function InfoModal({ visible, onClose, isDark, onToggleDark, T }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity
        style={[c.overlay, { backgroundColor: T.modalOverlay }]}
        activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1}>
          <View style={[c.modal, { backgroundColor: T.surface, borderColor: T.border }]}>

            {/* App logo in modal */}
            <View style={c.modalLogoWrap}>
              <View style={[c.modalLogo, { backgroundColor: T.accent }]}>
                <Text style={[c.modalLogoTxt, { color: T.accentText }]}>₹</Text>
              </View>
            </View>

            <Text style={[c.modalTitle, { color: T.text }]}>Subscription Tracker</Text>
            <Text style={[c.modalSub, { color: T.textMuted }]}>Know what you pay. Always.</Text>

            <View style={[c.divider, { backgroundColor: T.border }]} />

            {/* Dark mode toggle */}
            <View style={c.modalRow}>
              <View>
                <Text style={[c.modalRowLabel, { color: T.text }]}>
                  {isDark ? '🌙  Dark Mode' : '☀️  Light Mode'}
                </Text>
                <Text style={[c.modalRowSub, { color: T.textMuted }]}>
                  Toggle appearance
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={onToggleDark}
                trackColor={{ false: '#ddd', true: '#555' }}
                thumbColor={isDark ? '#fff' : '#000'}
                ios_backgroundColor="#ddd"
              />
            </View>

            <View style={[c.divider, { backgroundColor: T.border }]} />

            {/* Credits */}
            <View style={c.modalRow}>
              <Text style={[c.modalRowLabel, { color: T.textMuted }]}>Developer</Text>
              <Text style={[c.modalRowValue, { color: T.text }]}>Rajat Uttam</Text>
            </View>
            <View style={c.modalRow}>
              <Text style={[c.modalRowLabel, { color: T.textMuted }]}>GitHub</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://github.com/ring')}>
                <Text style={[c.modalLink, { color: T.text }]}>ring ↗</Text>
              </TouchableOpacity>
            </View>
            <View style={c.modalRow}>
              <Text style={[c.modalRowLabel, { color: T.textMuted }]}>Version</Text>
              <Text style={[c.modalRowValue, { color: T.text }]}>1.0.0</Text>
            </View>

            <View style={[c.divider, { backgroundColor: T.border }]} />

            <TouchableOpacity
              onPress={onClose}
              style={[c.closeBtn, { backgroundColor: T.accent }]}>
              <Text style={[c.closeTxt, { color: T.accentText }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const [subs,       setSubs]       = useState([]);
  const [infoOpen,   setInfoOpen]   = useState(false);
  const [isDark,     setIsDark]     = useState(true);
  const T = isDark ? DARK : LIGHT;

  useFocusEffect(useCallback(() => {
    (async () => {
      const list = await loadSubscriptions();
      setSubs(list);
      await requestPermissions();
      await scheduleAllNotifications(list);
    })();
  }, []));

  const handleDelete = async (id) => {
    const updated = await deleteSubscription(id);
    setSubs(updated);
  };

  const total = subs.reduce((sum, s) => {
    const p = parseFloat(s.price) || 0;
    if (s.cycle === 'Yearly') return sum + p / 12;
    if (s.cycle === 'Weekly') return sum + p * 4.33;
    return sum + p;
  }, 0);

  const now = new Date(); now.setHours(0,0,0,0);
  const upcoming = subs
    .filter(s => {
      const d = Math.ceil((new Date(s.renewalDate) - now) / 86400000);
      return d >= 0 && d <= 7;
    })
    .sort((a,b) => new Date(a.renewalDate) - new Date(b.renewalDate));

  return (
    <View style={[c.root, { backgroundColor: T.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={T.bg}
      />

      <ScrollView
        contentContainerStyle={c.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={c.header}>
          <View>
            <Text style={[c.totalLabel, { color: T.textMuted }]}>TOTAL MONTHLY</Text>
            <Text style={[c.totalAmount, { color: T.text }]}>₹{Math.round(total)}</Text>
            <Text style={[c.subCount, { color: T.textMuted }]}>
              {subs.length} subscription{subs.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {/* Info button */}
          <TouchableOpacity
            style={[c.infoBtn, {
              borderColor: T.border2,
              backgroundColor: T.surface,
              shadowColor: T.cardShadow,
              shadowOffset:{width:0,height:3},
              shadowOpacity:1, shadowRadius:8, elevation:3,
            }]}
            onPress={() => setInfoOpen(true)}
          >
            <Text style={[c.infoBtnTxt, { color: T.textMuted }]}>i</Text>
          </TouchableOpacity>
        </View>

        {/* ── Chart ── */}
        <SpendChart subs={subs} T={T} />

        {/* ── Upcoming Bills ── */}
        {upcoming.length > 0 && (
          <View style={c.section}>
            <Text style={[c.sectionTitle, { color: T.text }]}>Upcoming Bills</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcoming.map(sub => {
                const diff = Math.ceil((new Date(sub.renewalDate) - now) / 86400000);
                return (
                  <View key={sub.id} style={[c.upCard, {
                    backgroundColor: T.surface, borderColor: T.border,
                    shadowColor: T.cardShadow, shadowOffset:{width:0,height:4},
                    shadowOpacity:1, shadowRadius:10, elevation:4,
                  }]}>
                    <View style={[c.upIcon, { backgroundColor: T.accent }]}>
                      <Text style={[c.upIconTxt, { color: T.accentText }]}>
                        {sub.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[c.upName, { color: T.text }]} numberOfLines={1}>
                      {sub.name}
                    </Text>
                    <Text style={[c.upPrice, { color: T.text }]}>
                      ₹{parseFloat(sub.price).toFixed(0)}
                    </Text>
                    <Text style={[c.upDays, { color: T.textMuted }]}>
                      {diff === 0 ? 'Today' : `${diff}d left`}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Subscriptions ── */}
        <View style={c.section}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:14 }}>
            <Text style={[c.sectionTitle, { color: T.text }]}>Subscriptions</Text>
            <View style={[c.badge, { backgroundColor: T.surface2, borderColor: T.border }]}>
              <Text style={[c.badgeTxt, { color: T.textMuted }]}>{subs.length}</Text>
            </View>
          </View>

          {subs.length === 0 ? (
            <View style={[c.empty, { borderColor: T.border }]}>
              <Text style={c.emptyIcon}>◎</Text>
              <Text style={[c.emptyTxt, { color: T.textMuted }]}>No subscriptions yet</Text>
              <Text style={[c.emptySub, { color: T.textDim }]}>Tap + below to add one</Text>
            </View>
          ) : (
            [...subs]
              .sort((a,b) => new Date(a.renewalDate) - new Date(b.renewalDate))
              .map(sub => (
                <SubCard key={sub.id} sub={sub} onDelete={handleDelete} T={T} />
              ))
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <View style={c.fabWrap} pointerEvents="box-none">
        <TouchableOpacity
          style={[c.fab, {
            backgroundColor: T.accent,
            shadowColor: T.fabShadow,
            shadowOffset:{width:0,height:8},
            shadowOpacity:0.3,
            shadowRadius:20,
            elevation:14,
          }]}
          onPress={() => navigation.navigate('AddSubscription', { isDark, setIsDark })}
          activeOpacity={0.85}
        >
          <Text style={[c.fabTxt, { color: T.accentText }]}>＋  Add Subscription</Text>
        </TouchableOpacity>
      </View>

      {/* Info Modal */}
      <InfoModal
        visible={infoOpen}
        onClose={() => setInfoOpen(false)}
        isDark={isDark}
        onToggleDark={(v) => setIsDark(v)}
        T={T}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const c = StyleSheet.create({
  root: { flex:1 },
  scroll: { paddingHorizontal:20, paddingTop: Platform.OS === 'android' ? 52 : 60 },

  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 },
  totalLabel: { fontSize:11, letterSpacing:2, fontFamily:MONO, marginBottom:4 },
  totalAmount: { fontSize:46, fontWeight:'900', letterSpacing:-2 },
  subCount: { fontSize:12, fontFamily:MONO, marginTop:4 },
  infoBtn: {
    width:44, height:44, borderRadius:22, borderWidth:1,
    alignItems:'center', justifyContent:'center', marginTop:10,
  },
  infoBtnTxt: { fontSize:18, fontStyle:'italic', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  chartBox: { borderRadius:20, padding:16, marginBottom:28, borderWidth:1 },
  chartLabel: { fontSize:10, letterSpacing:2, fontFamily:MONO, marginBottom:14 },
  bar: { width:'68%', borderRadius:6 },
  barVal: { fontSize:9, fontWeight:'700', marginBottom:3, fontFamily:MONO },
  yLabel: { fontSize:8, fontFamily:MONO },
  xLabel: { flex:1, fontSize:9, textAlign:'center', marginTop:6, fontFamily:MONO },

  section: { marginBottom:24 },
  sectionTitle: { fontSize:20, fontWeight:'800', letterSpacing:-0.5 },
  badge: { paddingHorizontal:9, paddingVertical:3, borderRadius:10, borderWidth:1 },
  badgeTxt: { fontSize:12, fontWeight:'600', fontFamily:MONO },

  upCard: {
    borderRadius:18, padding:16, marginRight:12,
    width:118, alignItems:'center', borderWidth:1,
  },
  upIcon: { width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center', marginBottom:10 },
  upIconTxt: { fontWeight:'800', fontSize:18 },
  upName: { fontWeight:'700', fontSize:12, textAlign:'center', marginBottom:4 },
  upPrice: { fontWeight:'800', fontSize:15 },
  upDays: { fontSize:10, marginTop:3, fontFamily:MONO },

  card: {
    borderRadius:18, padding:16,
    flexDirection:'row', alignItems:'center',
    marginBottom:12,
  },
  cardIcon: { width:48, height:48, borderRadius:24, alignItems:'center', justifyContent:'center', borderWidth:1 },
  cardIconTxt: { fontWeight:'900', fontSize:20 },
  cardName: { fontWeight:'700', fontSize:16, marginBottom:2 },
  cardCycle: { fontSize:11, fontFamily:MONO },
  cardDays: { fontSize:11, marginTop:4 },
  cardPrice: { fontWeight:'900', fontSize:18 },
  cardDate: { fontSize:11, fontFamily:MONO },
  deleteTxt: { fontSize:15, fontWeight:'700' },

  empty: { alignItems:'center', paddingVertical:56, borderWidth:1, borderRadius:20, borderStyle:'dashed' },
  emptyIcon: { fontSize:48, marginBottom:12, color:'#ccc' },
  emptyTxt: { fontSize:16, fontWeight:'600', marginBottom:4 },
  emptySub: { fontSize:13 },

  fabWrap: { position:'absolute', bottom:0, left:0, right:0, alignItems:'center', paddingBottom:36 },
  fab: { paddingHorizontal:34, paddingVertical:17, borderRadius:50 },
  fabTxt: { fontSize:15, fontWeight:'800', letterSpacing:0.3 },

  overlay: { flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:24 },
  modal: { borderRadius:24, padding:28, width:'100%', maxWidth:360, borderWidth:1 },

  modalLogoWrap: { alignItems:'center', marginBottom:16 },
  modalLogo: { width:64, height:64, borderRadius:32, alignItems:'center', justifyContent:'center' },
  modalLogoTxt: { fontSize:28, fontWeight:'900' },

  modalTitle: { fontSize:20, fontWeight:'900', textAlign:'center', letterSpacing:-0.5 },
  modalSub: { fontSize:12, textAlign:'center', fontFamily:MONO, marginTop:4 },
  divider: { height:1, marginVertical:18 },

  modalRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  modalRowLabel: { fontSize:13, fontFamily:MONO },
  modalRowSub: { fontSize:11, fontFamily:MONO, marginTop:2 },
  modalRowValue: { fontSize:13, fontWeight:'700' },
  modalLink: { fontSize:13, fontWeight:'700', textDecorationLine:'underline' },

  closeBtn: { paddingVertical:14, borderRadius:14, alignItems:'center', marginTop:4 },
  closeTxt: { fontWeight:'800', fontSize:15 },
});
