// Firebase Push Notifications — CampusCare
// Config is fetched from server (not hardcoded) for security

async function initFirebasePush() {
  try {
    // Fetch config from server
    const configRes = await fetch('http://localhost:3000/api/firebase-config');
    const config = await configRes.json();

    if (!config.apiKey) { console.log('Firebase config not available'); return; }

    // Load Firebase SDK
    await loadScript('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { console.log('Notifications blocked'); return; }

    const token = await messaging.getToken({ vapidKey: config.vapidKey });
    if (!token) { console.log('No FCM token'); return; }

    console.log('FCM Token obtained');

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

    messaging.onMessage((payload) => {
      const { title, body } = payload.notification;
      showInAppNotification(title, body);
    });

  } catch (err) {
    console.error('Firebase push error:', err.message);
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

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

window.addEventListener('DOMContentLoaded', initFirebasePush);
