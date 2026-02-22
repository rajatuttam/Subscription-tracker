import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@subtracker_subscriptions';

export const saveSubscriptions = async (subscriptions) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  } catch (e) {
    console.error('Error saving subscriptions:', e);
  }
};

export const loadSubscriptions = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading subscriptions:', e);
    return [];
  }
};

export const deleteSubscription = async (id) => {
  const subs = await loadSubscriptions();
  const updated = subs.filter((s) => s.id !== id);
  await saveSubscriptions(updated);
  return updated;
};
