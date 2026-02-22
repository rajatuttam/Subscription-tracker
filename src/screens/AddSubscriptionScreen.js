import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { saveSubscription } from '../utils/storage';
import { scheduleRenewalNotification } from '../utils/notifications';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddSubscriptionScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cycle, setCycle] = useState('Monthly');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [notes, setNotes] = useState('');

  const cycles = ['Monthly', 'Yearly', 'Weekly'];
  const quickAdds = ['Netflix', 'Spotify', 'YouTube Premium', 'Claude', 'Apple One'];

  const handleSave = async () => {
    if (!name || !price || !day || !month || !year) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate date
    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);

    if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12) {
        Alert.alert('Error', 'Invalid date');
        return;
    }

    // Create date object (Month is 0-indexed in JS Date)
    const renewalDate = new Date(y, m - 1, d);
    
    // Check if valid date
    if (renewalDate.getMonth() !== m - 1) {
         Alert.alert('Error', 'Invalid date (e.g. Feb 30)');
         return;
    }

    const newSub = {
      id: Date.now().toString(),
      name,
      price: parseFloat(price).toFixed(2),
      cycle,
      renewalDate: renewalDate.toISOString(),
      notes,
      color: getRandomColor()
    };

    try {
      await saveSubscription(newSub);
      await scheduleRenewalNotification(name, renewalDate);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save subscription');
      console.error(error);
    }
  };

  const getRandomColor = () => {
      const colors = ['#E50914', '#1DB954', '#FF0000', '#D2691E', '#000000', '#0A84FF', '#FF9500'];
      return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleQuickAdd = (appName) => {
      setName(appName);
      // Pre-fill some defaults if known could go here
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {/* Fixed Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <Text style={[styles.backText, { color: colors.text }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New Subscription</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Quick Add */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>QUICK ADD</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAddScroll}>
            {quickAdds.map(app => (
                <TouchableOpacity 
                    key={app} 
                    style={[styles.chip, { backgroundColor: isDarkMode ? '#333' : '#eee' }]}
                    onPress={() => handleQuickAdd(app)}
                >
                    <Text style={{ color: colors.text }}>{app}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>

        {/* Name */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>NAME</Text>
        <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Netflix"
            placeholderTextColor={colors.textSecondary}
        />

        {/* Price */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>PRICE ($)</Text>
        <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor={colors.textSecondary}
        />

        {/* Billing Cycle */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>BILLING CYCLE</Text>
        <View style={styles.cycleContainer}>
            {cycles.map(c => (
                <TouchableOpacity 
                    key={c} 
                    style={[
                        styles.cycleButton, 
                        cycle === c ? { backgroundColor: '#fff' } : { backgroundColor: isDarkMode ? '#111' : '#ddd' },
                        cycle === c && !isDarkMode ? { backgroundColor: '#000' } : {} 
                    ]}
                    onPress={() => setCycle(c)}
                >
                    <Text style={{ 
                        color: cycle === c ? (isDarkMode ? '#000' : '#fff') : colors.textSecondary,
                        fontWeight: cycle === c ? 'bold' : 'normal'
                    }}>
                        {c}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* Renewal Date */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>NEXT RENEWAL DATE</Text>
        <View style={styles.dateRow}>
            <TextInput
                style={[styles.dateInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                value={day}
                onChangeText={setDay}
                placeholder="DD"
                keyboardType="numeric"
                maxLength={2}
                placeholderTextColor={colors.textSecondary}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 20 }}>/</Text>
            <TextInput
                style={[styles.dateInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                value={month}
                onChangeText={setMonth}
                placeholder="MM"
                keyboardType="numeric"
                maxLength={2}
                placeholderTextColor={colors.textSecondary}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 20 }}>/</Text>
            <TextInput
                style={[styles.dateInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, flex: 2 }]}
                value={year}
                onChangeText={setYear}
                placeholder="YYYY"
                keyboardType="numeric"
                maxLength={4}
                placeholderTextColor={colors.textSecondary}
            />
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
            You'll be reminded 2 days before.
        </Text>

        {/* Notes */}
        <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>NOTES (OPTIONAL)</Text>
        <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top', backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Add notes..."
            placeholderTextColor={colors.textSecondary}
        />

        <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: isDarkMode ? '#fff' : '#000' }]}
            onPress={handleSave}
        >
            <Text style={[styles.saveButtonText, { color: isDarkMode ? '#000' : '#fff' }]}>Save Subscription</Text>
        </TouchableOpacity>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 10,
    zIndex: 10,
    padding: 5, // enlarge touch area
  },
  backText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 12,
    marginTop: 20,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 1,
  },
  quickAddScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  cycleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cycleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    marginTop: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default AddSubscriptionScreen;
