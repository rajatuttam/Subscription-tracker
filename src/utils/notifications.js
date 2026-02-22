import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }
};

export const scheduleRenewalNotification = async (subscriptionName, renewalDate) => {
  // Parse date string (DD/MM/YYYY) or Date object
  // Assuming renewalDate is a Date object or ISO string. If it's DD/MM/YYYY, need to parse.
  
  const triggerDate = new Date(renewalDate);
  triggerDate.setHours(9, 0, 0, 0); // Set to 9 AM
  
  // Subtract 2 days
  triggerDate.setDate(triggerDate.getDate() - 2);

  if (triggerDate <= new Date()) {
    console.log('Notification date is in the past, skipping.');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Subscription Renewal Alert",
      body: `${subscriptionName} is renewing in 2 days!`,
      data: { data: 'goes here' },
    },
    trigger: triggerDate,
  });
};

export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
