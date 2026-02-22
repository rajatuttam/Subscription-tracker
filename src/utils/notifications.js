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
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sub-reminders', {
      name: 'Subscription Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFFFFF',
    });
  }
  return true;
};

export const scheduleRenewalNotification = async (subscription) => {
  // Cancel any existing notification for this sub
  await cancelNotification(subscription.id);

  const renewalDate = new Date(subscription.renewalDate);
  const notifyDate = new Date(renewalDate);
  notifyDate.setDate(notifyDate.getDate() - 2);
  notifyDate.setHours(9, 0, 0, 0); // 9 AM

  const now = new Date();
  if (notifyDate <= now) return null;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Subscription Renewing Soon',
      body: `${subscription.name} renews in 2 days — $${subscription.price}/mo`,
      data: { subscriptionId: subscription.id },
      channelId: 'sub-reminders',
    },
    trigger: {
      date: notifyDate,
    },
  });

  return identifier;
};

export const cancelNotification = async (subscriptionId) => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.subscriptionId === subscriptionId) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
};

export const scheduleAllNotifications = async (subscriptions) => {
  for (const sub of subscriptions) {
    await scheduleRenewalNotification(sub);
  }
};
