import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@subscriptions';

export const getSubscriptions = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading subscriptions', e);
    return [];
  }
};

export const saveSubscription = async (subscription) => {
  try {
    const currentSubs = await getSubscriptions();
    // If updating existing (has ID), find and replace. Else add new.
    const existingIndex = currentSubs.findIndex(s => s.id === subscription.id);
    
    let newSubs;
    if (existingIndex >= 0) {
      newSubs = [...currentSubs];
      newSubs[existingIndex] = subscription;
    } else {
      newSubs = [...currentSubs, subscription];
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSubs));
    return newSubs;
  } catch (e) {
    console.error('Error saving subscription', e);
    throw e;
  }
};

export const deleteSubscription = async (id) => {
  try {
    const currentSubs = await getSubscriptions();
    const newSubs = currentSubs.filter(s => s.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSubs));
    return newSubs;
  } catch (e) {
    console.error('Error deleting subscription', e);
    throw e;
  }
};
