// Firebase Push Notifications — CampusCare

const VAPID_KEY = 'BLCxLCPOsssZhzS91ReprRNkYQO0Sp2lTFHtoCsgCgM9LBoryhzfckTq5XEnsL-T8g9S6L-bReVbFY8gyausbcY';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDjz-DY7yabl6UPRXA6e0QYLA7vmwUZ8fc",
  authDomain: "campuscare-55737.firebaseapp.com",
  projectId: "campuscare-55737",
  storageBucket: "campuscare-55737.firebasestorage.app",
  messagingSenderId: "537993539886",
  appId: "1:537993539886:web:6574b64c9de23c3faccabf"
};

function showInAppNotification(title, body) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position:fixed;top:80px;right:20px;z-index:9999;
    background:white;border-radius:14px;padding:16px 20px;
    box-shadow:0 8px 32px rgba(0,0,0,0.15);
    border-left:4px solid #0ea5e9;max-width:320px;
    font-family:Inter,sans-serif;
    animation:slideIn 0.3s ease;
  `;
  notif.innerHTML = `
    <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px;">🔔 ${title}</div>
    <div style="font-size:13px;color:#64748b;">${body}</div>
  `;
  if (!document.querySelector('#notif-style')) {
    const s = document.createElement('style');
    s.id = 'notif-style';
    s.textContent = '@keyframes slideIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(s);
  }
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 5000);
}

// Load Firebase SDK dynamically
const script1 = document.createElement('script');
script1.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js';
script1.onload = () => {
  const script2 = document.createElement('script');
  script2.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js';
  script2.onload = async () => {
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      const messaging = firebase.messaging();

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { console.log('Notifications blocked'); return; }

      const token = await messaging.getToken({ vapidKey: VAPID_KEY });
      if (!token) { console.log('No FCM token obtained'); return; }

      console.log('FCM Token:', token);

      // Register token with server
      const authToken = localStorage.getItem('cc_token');
      if (authToken) {
        const res = await fetch('http://localhost:3000/api/push/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ fcmToken: token })
        });
        const data = await res.json();
        console.log('Push registered:', data.message);
      }

      // Handle foreground messages
      messaging.onMessage((payload) => {
        const { title, body } = payload.notification;
        showInAppNotification(title, body);
      });

    } catch (err) {
      console.error('Firebase push error:', err.message);
    }
  };
  document.head.appendChild(script2);
};
document.head.appendChild(script1);
