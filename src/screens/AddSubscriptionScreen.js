import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { loadSubscriptions, saveSubscriptions } from '../utils/storage';
import { scheduleRenewalNotification } from '../utils/notifications';
import { DARK, LIGHT } from '../utils/theme';

const CYCLES = ['Monthly', 'Yearly', 'Weekly'];

const PRESETS = [
  { name:'Netflix',          price:'649' },
  { name:'Hotstar',          price:'299' },
  { name:'Amazon Prime',     price:'299' },
  { name:'Spotify',          price:'119' },
  { name:'YouTube Premium',  price:'189' },
  { name:'Claude',           price:'1700' },
  { name:'Apple Music',      price:'119' },
  { name:'Zee5',             price:'149' },
  { name:'SonyLiv',          price:'299' },
  { name:'JioCinema',        price:'29' },
  { name:'Adobe CC',         price:'4230' },
  { name:'LinkedIn Premium', price:'2600' },
];

// Simple DD / MM / YYYY date input — works perfectly in Termux
function DateInput({ value, onChange, T }) {
  const p     = value ? new Date(value) : null;
  const [d, setD] = useState(p ? String(p.getDate()).padStart(2,'0') : '');
  const [m, setM] = useState(p ? String(p.getMonth()+1).padStart(2,'0') : '');
  const [y, setY] = useState(p ? String(p.getFullYear()) : '');

  const tryUpdate = (dd, mm, yy) => {
    if (dd && mm && yy && yy.length === 4) {
      const date = new Date(parseInt(yy), parseInt(mm)-1, parseInt(dd));
      if (!isNaN(date.getTime())) onChange(date.toISOString());
    }
  };

  const inputStyle = [s.dateBox, { backgroundColor: T.inputBg, borderColor: T.border, color: T.text }];

  return (
    <View style={{ flexDirection:'row', alignItems:'center' }}>
      <TextInput style={inputStyle} placeholder="DD" placeholderTextColor={T.textDim}
        keyboardType="numeric" maxLength={2} value={d}
        onChangeText={v => { setD(v); tryUpdate(v, m, y); }} />
      <Text style={[s.dateSep, { color: T.textMuted }]}>/</Text>
      <TextInput style={inputStyle} placeholder="MM" placeholderTextColor={T.textDim}
        keyboardType="numeric" maxLength={2} value={m}
        onChangeText={v => { setM(v); tryUpdate(d, v, y); }} />
      <Text style={[s.dateSep, { color: T.textMuted }]}>/</Text>
      <TextInput style={[inputStyle, { width:78 }]} placeholder="YYYY" placeholderTextColor={T.textDim}
        keyboardType="numeric" maxLength={4} value={y}
        onChangeText={v => { setY(v); tryUpdate(d, m, v); }} />
    </View>
  );
}

export default function AddSubscriptionScreen({ navigation, route }) {
  // Receive isDark from HomeScreen so colors stay in sync
  const isDark = route?.params?.isDark ?? true;
  const T = isDark ? DARK : LIGHT;

  const [name,   setName]   = useState('');
  const [price,  setPrice]  = useState('');
  const [cycle,  setCycle]  = useState('Monthly');
  const [date,   setDate]   = useState('');
  const [notes,  setNotes]  = useState('');

  const applyPreset = (p) => { setName(p.name); setPrice(p.price); };

  const handleSave = async () => {
    if (!name.trim())                      return Alert.alert('Required', 'Enter subscription name.');
    if (!price || isNaN(parseFloat(price))) return Alert.alert('Required', 'Enter a valid price.');
    if (!date)                             return Alert.alert('Required', 'Enter renewal date.');

    const sub = {
      id: Date.now().toString(),
      name: name.trim(),
      price: parseFloat(price).toFixed(2),
      cycle,
      renewalDate: date,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };
    const existing = await loadSubscriptions();
    await saveSubscriptions([...existing, sub]);
    await scheduleRenewalNotification(sub);
    navigation.goBack();
  };

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>

      {/* ── Fixed Back Button ── */}
      <View style={[s.topBar, {
        backgroundColor: T.bg,
        borderBottomColor: T.border,
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <View style={[s.backCircle, { backgroundColor: T.surface, borderColor: T.border }]}>
            <Text style={[s.backArrow, { color: T.text }]}>‹</Text>
          </View>
          <Text style={[s.backTxt, { color: T.textMuted }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[s.screenTitle, { color: T.text }]}>New Subscription</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* ── Scrollable Form ── */}
      <KeyboardAvoidingView
        style={{ flex:1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Quick Add Presets */}
          <Text style={[s.label, { color: T.textMuted }]}>QUICK ADD</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:4 }}>
            {PRESETS.map(p => (
              <TouchableOpacity key={p.name}
                style={[s.chip, { backgroundColor: T.chipBg, borderColor: T.chipBorder }]}
                onPress={() => applyPreset(p)}>
                <Text style={[s.chipName, { color: T.chipText }]}>{p.name}</Text>
                <Text style={[s.chipPrice, { color: T.textDim }]}>₹{p.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Name */}
          <Text style={[s.label, { color: T.textMuted }]}>NAME</Text>
          <TextInput
            style={[s.input, { backgroundColor: T.inputBg, borderColor: T.border, color: T.text }]}
            placeholder="e.g. Netflix, Hotstar..." placeholderTextColor={T.textDim}
            value={name} onChangeText={setName}
          />

          {/* Price */}
          <Text style={[s.label, { color: T.textMuted }]}>PRICE (₹)</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
            <Text style={[s.rupee, { color: T.text }]}>₹</Text>
            <TextInput
              style={[s.input, { flex:1, backgroundColor: T.inputBg, borderColor: T.border, color: T.text }]}
              placeholder="0" placeholderTextColor={T.textDim}
              keyboardType="decimal-pad" value={price} onChangeText={setPrice}
            />
          </View>

          {/* Billing Cycle */}
          <Text style={[s.label, { color: T.textMuted }]}>BILLING CYCLE</Text>
          <View style={{ flexDirection:'row', gap:10 }}>
            {CYCLES.map(cy => (
              <TouchableOpacity key={cy}
                style={[s.cycleBtn, {
                  backgroundColor: cycle === cy ? T.accent : T.inputBg,
                  borderColor: cycle === cy ? T.accent : T.border,
                }]}
                onPress={() => setCycle(cy)}>
                <Text style={[s.cycleTxt, { color: cycle === cy ? T.accentText : T.textMuted }]}>
                  {cy}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Renewal Date */}
          <Text style={[s.label, { color: T.textMuted }]}>NEXT RENEWAL DATE</Text>
          <DateInput value={date} onChange={setDate} T={T} />
          <Text style={[s.hint, { color: T.textDim }]}>🔔 Reminder 2 days before renewal</Text>

          {/* Notes */}
          <Text style={[s.label, { color: T.textMuted }]}>NOTES (OPTIONAL)</Text>
          <TextInput
            style={[s.input, s.notesInput, { backgroundColor: T.inputBg, borderColor: T.border, color: T.text }]}
            placeholder="e.g. Family plan, shared account..." placeholderTextColor={T.textDim}
            multiline value={notes} onChangeText={setNotes}
          />

          {/* Save Button */}
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: T.accent,
              shadowColor: T.fabShadow, shadowOffset:{width:0,height:6},
              shadowOpacity:0.2, shadowRadius:14, elevation:8,
            }]}
            onPress={handleSave}
          >
            <Text style={[s.saveTxt, { color: T.accentText }]}>Save Subscription</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const s = StyleSheet.create({
  root: { flex:1 },

  // Fixed top bar
  topBar: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingHorizontal:16,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom:14,
    borderBottomWidth:1,
  },
  backBtn: { flexDirection:'row', alignItems:'center', gap:8, width:80 },
  backCircle: {
    width:34, height:34, borderRadius:17,
    borderWidth:1, alignItems:'center', justifyContent:'center',
  },
  backArrow: { fontSize:24, fontWeight:'300', lineHeight:28 },
  backTxt: { fontSize:14, fontFamily:MONO },
  screenTitle: { fontSize:17, fontWeight:'800', letterSpacing:-0.3, textAlign:'center' },

  form: { paddingHorizontal:20, paddingTop:20 },

  label: {
    fontSize:11, letterSpacing:1.8, fontFamily:MONO,
    marginBottom:10, marginTop:22,
  },
  input: {
    borderRadius:14, borderWidth:1, padding:15,
    fontSize:16, fontFamily:MONO,
  },
  rupee: { fontSize:28, fontWeight:'700' },
  notesInput: { height:88, textAlignVertical:'top' },
  hint: { fontSize:11, fontFamily:MONO, marginTop:8 },

  chip: {
    borderRadius:20, paddingHorizontal:14, paddingVertical:9,
    marginRight:8, borderWidth:1, alignItems:'center',
  },
  chipName: { fontSize:12, fontWeight:'600' },
  chipPrice: { fontSize:10, marginTop:2, fontFamily:MONO },

  dateBox: {
    borderRadius:12, borderWidth:1, padding:13,
    width:56, textAlign:'center', fontSize:16, fontFamily:MONO,
  },
  dateSep: { fontSize:22, fontWeight:'200', marginHorizontal:8 },

  cycleBtn: {
    flex:1, paddingVertical:13, borderRadius:12,
    alignItems:'center', borderWidth:1,
  },
  cycleTxt: { fontSize:13, fontWeight:'700' },

  saveBtn: {
    borderRadius:16, paddingVertical:18,
    alignItems:'center', marginTop:32,
  },
  saveTxt: { fontWeight:'900', fontSize:16, letterSpacing:0.3 },
});
