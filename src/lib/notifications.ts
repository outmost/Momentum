export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  
  return await Notification.requestPermission();
}

export function scheduleNotification(title: string, body: string, time: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);
  
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const delay = scheduledTime.getTime() - now.getTime();
  
  setTimeout(() => {
    new Notification(title, { body, icon: '/icon-192.png' });
  }, delay);
}

export function showNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/icon-192.png' });
}
