import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestPermissions = async () => {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sub-reminders', {
      name: 'Subscription Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return true;
};

export const cancelNotification = async (subId) => {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) {
    if (n.content.data?.subId === subId) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
};

export const scheduleRenewalNotification = async (sub) => {
  await cancelNotification(sub.id);
  const renewDate = new Date(sub.renewalDate);
  const notifyDate = new Date(renewDate);
  notifyDate.setDate(notifyDate.getDate() - 2);
  notifyDate.setHours(9, 0, 0, 0);
  if (notifyDate <= new Date()) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Renewal Reminder',
      body: `${sub.name} renews in 2 days — ₹${sub.price}`,
      data: { subId: sub.id },
      channelId: 'sub-reminders',
    },
    trigger: { date: notifyDate },
  });
};

export const scheduleAllNotifications = async (list) => {
  for (const sub of list) {
    await scheduleRenewalNotification(sub);
  }
};
