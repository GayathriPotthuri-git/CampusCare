importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDjz-DY7yabl6UPRXA6e0QYLA7vmwUZ8fc",
  authDomain: "campuscare-55737.firebaseapp.com",
  projectId: "campuscare-55737",
  storageBucket: "campuscare-55737.firebasestorage.app",
  messagingSenderId: "537993539886",
  appId: "1:537993539886:web:6574b64c9de23c3faccabf"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icon.png',
    badge: '/icon.png'
  });
});
