importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging.js');

// TODO: Replace the config below with your Firebase project's config or use your build tooling to inject it.
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  messagingSenderId: 'SENDER_ID',
  appId: 'APP_ID'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Guardian Keychain Alert';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
