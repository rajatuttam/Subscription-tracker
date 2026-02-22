import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { loadSubscriptions, saveSubscriptions } from '../utils/storage';
import { scheduleRenewalNotification } from '../utils/notifications';

const CYCLES = ['Monthly', 'Yearly', 'Weekly'];

const PRESETS = [
  { name: 'Netflix', price: '15.49' },
  { name: 'Spotify', price: '9.99' },
  { name: 'YouTube Premium', price: '13.99' },
  { name: 'Claude', price: '20.00' },
  { name: 'Apple Music', price: '10.99' },
  { name: 'Disney+', price: '13.99' },
  { name: 'Hulu', price: '7.99' },
  { name: 'Adobe CC', price: '54.99' },
];

function DatePicker({ value, onChange }) {
  // Simple manual date input for Termux/Android compatibility
  const [day, setDay] = useState(value ? String(new Date(value).getDate()) : '');
  const [month, setMonth] = useState(value ? String(new Date(value).getMonth() + 1) : '');
  const [year, setYear] = useState(value ? String(new Date(value).getFullYear()) : String(new Date().getFullYear()));

  const update = (d, m, y) => {
    if (d && m && y && y.length === 4) {
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      if (!isNaN(date.getTime())) onChange(date.toISOString());
    }
  };

  return (
    <View style={dpStyles.row}>
      <TextInput
        style={dpStyles.input}
        placeholder="DD"
        placeholderTextColor="#333"
        keyboardType="numeric"
        maxLength={2}
        value={day}
        onChangeText={(v) => { setDay(v); update(v, month, year); }}
      />
      <Text style={dpStyles.sep}>/</Text>
      <TextInput
        style={dpStyles.input}
        placeholder="MM"
        placeholderTextColor="#333"
        keyboardType="numeric"
        maxLength={2}
        value={month}
        onChangeText={(v) => { setMonth(v); update(day, v, year); }}
      />
      <Text style={dpStyles.sep}>/</Text>
      <TextInput
        style={[dpStyles.input, { width: 70 }]}
        placeholder="YYYY"
        placeholderTextColor="#333"
        keyboardType="numeric"
        maxLength={4}
        value={year}
        onChangeText={(v) => { setYear(v); update(day, month, v); }}
      />
    </View>
  );
}

const dpStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    backgroundColor: '#0d0d0d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    color: '#fff',
    padding: 12,
    width: 52,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sep: {
    color: '#333',
    marginHorizontal: 8,
    fontSize: 20,
    fontWeight: '300',
  },
});

export default function AddSubscriptionScreen({ navigation }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cycle, setCycle] = useState('Monthly');
  const [renewalDate, setRenewalDate] = useState('');
  const [notes, setNotes] = useState('');

  const applyPreset = (preset) => {
    setName(preset.name);
    setPrice(preset.price);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Required', 'Please enter a subscription name.');
    if (!price || isNaN(parseFloat(price))) return Alert.alert('Required', 'Please enter a valid price.');
    if (!renewalDate) return Alert.alert('Required', 'Please enter a renewal date.');

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
    const updated = [...existing, newSub];
    await saveSubscriptions(updated);
    await scheduleRenewalNotification(newSub);

    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Back + Title */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.screenTitle}>New Subscription</Text>

        {/* Presets */}
        <Text style={styles.label}>Quick Add</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
          {PRESETS.map((p) => (
            <TouchableOpacity key={p.name} style={styles.presetChip} onPress={() => applyPreset(p)}>
              <Text style={styles.presetText}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Name */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Netflix"
          placeholderTextColor="#333"
          value={name}
          onChangeText={setName}
        />

        {/* Price */}
        <Text style={styles.label}>Price ($)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#333"
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
        />

        {/* Cycle */}
        <Text style={styles.label}>Billing Cycle</Text>
        <View style={styles.cycleRow}>
          {CYCLES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.cycleBtn, cycle === c && styles.cycleBtnActive]}
              onPress={() => setCycle(c)}
            >
              <Text style={[styles.cycleTxt, cycle === c && styles.cycleTxtActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Renewal Date */}
        <Text style={styles.label}>Next Renewal Date</Text>
        <DatePicker value={renewalDate} onChange={setRenewalDate} />
        <Text style={styles.hint}>You'll be reminded 2 days before.</Text>

        {/* Notes */}
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Any notes..."
          placeholderTextColor="#333"
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Subscription</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
  },
  topRow: {
    marginBottom: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: '#555',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  screenTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 28,
  },
  label: {
    color: '#555',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#0d0d0d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    color: '#fff',
    padding: 14,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  presetRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  presetChip: {
    backgroundColor: '#111',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  presetText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  cycleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cycleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  cycleBtnActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  cycleTxt: {
    color: '#444',
    fontSize: 13,
    fontWeight: '600',
  },
  cycleTxtActive: {
    color: '#000',
  },
  hint: {
    color: '#333',
    fontSize: 11,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  saveBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 32,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
