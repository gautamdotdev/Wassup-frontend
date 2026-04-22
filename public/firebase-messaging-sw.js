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
    icon: payload.notification.image || payload.notification.imageUrl || '/icon-192.png',
    data: {
      ...payload.data,
      senderId: payload.data?.senderId
    },
    actions: [
      { action: "reply", title: "Reply" },
      { action: "open", title: "Open Chat" }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const senderId = event.notification.data?.senderId;
  if (!senderId) return;

  let url = `/chat/${senderId}`;
  if (event.action === "reply") {
    url += "?reply=true";
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
