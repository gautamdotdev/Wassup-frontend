importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDOpG-jXFbesjeAs95kewrNdZPHTS9oyWc",
  authDomain: "wassup-chat-app-gautamdotdev.firebaseapp.com",
  projectId: "wassup-chat-app-gautamdotdev",
  messagingSenderId: "938631766062",
  appId: "1:938631766062:web:b0cecfb5be96c59c9cbfbf"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
