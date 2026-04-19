// Firebase Messaging Service Worker — CampusCare

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Fetch config from server
async function initSW() {
  try {
    const res = await fetch('/api/firebase-config');
    const config = await res.json();
    firebase.initializeApp(config);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const { title, body } = payload.notification;
      self.registration.showNotification(title, { body, icon: '/icon.png' });
    });
  } catch (err) {
    console.error('SW Firebase init failed:', err);
  }
}

initSW();
