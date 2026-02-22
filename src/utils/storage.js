import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@subs_data';

export const saveSubscriptions = async (list) => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Save error:', e);
  }
};

export const loadSubscriptions = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const deleteSubscription = async (id) => {
  const list = await loadSubscriptions();
  const updated = list.filter((s) => s.id !== id);
  await saveSubscriptions(updated);
  return updated;
};
