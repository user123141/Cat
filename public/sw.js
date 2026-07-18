self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

let retentionTimers = [];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_RETENTION') {
    // Clear previous timers to avoid duplicate spam
    retentionTimers.forEach(t => clearTimeout(t));
    retentionTimers = [];

    const delay = event.data.delay || 15000; // default 15s for demo/testing retention
    const title = event.data.title || "Ваш котик голоден! 🍽️";
    const body = event.data.body || "Котик скучает и ждет тебя! 😿";

    const timerId = setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: '/icon-192.png',
        tag: 'maccat_retention',
        requireInteraction: true
      });
    }, delay);

    retentionTimers.push(timerId);
  } else if (event.data && event.data.type === 'CLEAR_RETENTION') {
    retentionTimers.forEach(t => clearTimeout(t));
    retentionTimers = [];
  }
});
