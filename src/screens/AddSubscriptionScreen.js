import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { loadSubscriptions, saveSubscriptions } from '../utils/storage';
import { scheduleRenewalNotification } from '../utils/notifications';

const CYCLES = ['Monthly', 'Yearly', 'Weekly'];

// Indian subscription prices in INR
const PRESETS = [
  { name: 'Netflix',          price: '649' },
  { name: 'Hotstar',          price: '299' },
  { name: 'Amazon Prime',     price: '299' },
  { name: 'Spotify',          price: '119' },
  { name: 'YouTube Premium',  price: '189' },
  { name: 'Claude',           price: '1700' },
  { name: 'Apple Music',      price: '119' },
  { name: 'Zee5',             price: '149' },
  { name: 'SonyLiv',          price: '299' },
  { name: 'JioCinema',        price: '29' },
  { name: 'Adobe CC',         price: '4230' },
  { name: 'LinkedIn Premium', price: '2600' },
];

function DateInput({ value, onChange }) {
  const parsed = value ? new Date(value) : null;
  const [day,   setDay]   = useState(parsed ? String(parsed.getDate()).padStart(2, '0') : '');
  const [month, setMonth] = useState(parsed ? String(parsed.getMonth() + 1).padStart(2, '0') : '');
  const [year,  setYear]  = useState(parsed ? String(parsed.getFullYear()) : '');

  const tryUpdate = (d, m, y) => {
    if (d && m && y && y.length === 4) {
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      if (!isNaN(date.getTime())) onChange(date.toISOString());
    }
  };

  return (
    <View style={di.row}>
      <TextInput style={di.box} placeholder="DD" placeholderTextColor="#999"
        keyboardType="numeric" maxLength={2} value={day}
        onChangeText={v => { setDay(v); tryUpdate(v, month, year); }} />
      <Text style={di.sep}>/</Text>
      <TextInput style={di.box} placeholder="MM" placeholderTextColor="#999"
        keyboardType="numeric" maxLength={2} value={month}
        onChangeText={v => { setMonth(v); tryUpdate(day, v, year); }} />
      <Text style={di.sep}>/</Text>
      <TextInput style={[di.box, { width: 76 }]} placeholder="YYYY" placeholderTextColor="#999"
        keyboardType="numeric" maxLength={4} value={year}
        onChangeText={v => { setYear(v); tryUpdate(day, month, v); }} />
    </View>
  );
}

const di = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  box: {
    backgroundColor: '#111', borderRadius: 10, borderWidth: 1,
    borderColor: '#222', color: '#fff', padding: 12,
    width: 54, textAlign: 'center', fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sep: { color: '#444', marginHorizontal: 8, fontSize: 22, fontWeight: '200' },
});

export default function AddSubscriptionScreen({ navigation }) {
  const [name,        setName]        = useState('');
  const [price,       setPrice]       = useState('');
  const [cycle,       setCycle]       = useState('Monthly');
  const [renewalDate, setRenewalDate] = useState('');
  const [notes,       setNotes]       = useState('');

  const applyPreset = p => { setName(p.name); setPrice(p.price); };

  const handleSave = async () => {
    if (!name.trim())                    return Alert.alert('Required', 'Enter a subscription name.');
    if (!price || isNaN(parseFloat(price))) return Alert.alert('Required', 'Enter a valid price.');
    if (!renewalDate)                    return Alert.alert('Required', 'Enter a renewal date.');

    const newSub = {
      id: Date.now().toString(),
      name: name.trim(),
      price: parseFloat(price).toFixed(2),
      cycle,
      renewalDate,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    const existing = await loadSubscriptions();
    await saveSubscriptions([...existing, newSub]);
    await scheduleRenewalNotification(newSub);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>New Subscription</Text>

        {/* Quick Presets */}
        <Text style={s.label}>Quick Add</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          {PRESETS.map(p => (
            <TouchableOpacity key={p.name} style={s.chip} onPress={() => applyPreset(p)}>
              <Text style={s.chipText}>{p.name}</Text>
              <Text style={s.chipPrice}>₹{p.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Name */}
        <Text style={s.label}>Subscription Name</Text>
        <TextInput style={s.input} placeholder="e.g. Netflix, Hotstar..."
          placeholderTextColor="#444" value={name} onChangeText={setName} />

        {/* Price */}
        <Text style={s.label}>Price (₹)</Text>
        <View style={s.priceRow}>
          <Text style={s.rupeeSymbol}>₹</Text>
          <TextInput
            style={[s.input, { flex: 1, marginBottom: 0 }]}
            placeholder="0"
            placeholderTextColor="#444"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />
        </View>

        {/* Cycle */}
        <Text style={s.label}>Billing Cycle</Text>
        <View style={s.cycleRow}>
          {CYCLES.map(c => (
            <TouchableOpacity key={c}
              style={[s.cycleBtn, cycle === c && s.cycleBtnActive]}
              onPress={() => setCycle(c)}>
              <Text style={[s.cycleTxt, cycle === c && s.cycleTxtActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date */}
        <Text style={s.label}>Next Renewal Date</Text>
        <DateInput value={renewalDate} onChange={setRenewalDate} />
        <Text style={s.hint}>🔔 You'll be reminded 2 days before renewal.</Text>

        {/* Notes */}
        <Text style={s.label}>Notes (optional)</Text>
        <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="e.g. Family plan, shared with friends..."
          placeholderTextColor="#444" multiline value={notes} onChangeText={setNotes} />

        {/* Save */}
        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveTxt}>Save Subscription</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { padding: 20, paddingTop: Platform.OS === 'android' ? 52 : 60 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backTxt: { color: '#666', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -1, marginBottom: 28 },

  label: {
    color: '#666', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 10, marginTop: 22,
  },
  input: {
    backgroundColor: '#0d0d0d', borderRadius: 12, borderWidth: 1,
    borderColor: '#1f1f1f', color: '#fff', padding: 14,
    fontSize: 16, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 4,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rupeeSymbol: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 4 },

  chip: {
    backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#222',
    alignItems: 'center',
  },
  chipText: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  chipPrice: { color: '#555', fontSize: 10, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },

  cycleRow: { flexDirection: 'row', gap: 10 },
  cycleBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#0d0d0d', borderWidth: 1, borderColor: '#1f1f1f',
  },
  cycleBtnActive: { backgroundColor: '#fff', borderColor: '#fff' },
  cycleTxt: { color: '#555', fontSize: 13, fontWeight: '600' },
  cycleTxtActive: { color: '#000' },

  hint: { color: '#444', fontSize: 11, marginTop: 8, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },

  saveBtn: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 32 },
  saveTxt: { color: '#000', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
});
