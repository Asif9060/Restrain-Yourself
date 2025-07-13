// Firebase messaging service worker
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

// Firebase configuration - replace with your actual values
const firebaseConfig = {
   apiKey: "your-api-key",
   authDomain: "your-auth-domain",
   projectId: "your-project-id",
   storageBucket: "your-storage-bucket",
   messagingSenderId: "your-sender-id",
   appId: "your-app-id",
};

// Initialize Firebase
if (!firebase.apps.length) {
   firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
   console.log("Received background message:", payload);

   const notificationTitle = payload.notification?.title || "Restrain Yourself";
   const notificationOptions = {
      body: payload.notification?.body || "You have a new notification",
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: payload.data?.type || "default",
      data: payload.data,
      requireInteraction: true,
      actions: [
         {
            action: "view",
            title: "View App",
         },
         {
            action: "dismiss",
            title: "Dismiss",
         },
      ],
   };

   return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
   console.log("Notification clicked:", event);

   event.notification.close();

   if (event.action === "dismiss") {
      return;
   }

   const urlToOpen = event.notification.data?.deep_link || "/";

   event.waitUntil(
      clients
         .matchAll({
            type: "window",
            includeUncontrolled: true,
         })
         .then((clientList) => {
            for (const client of clientList) {
               if (client.url.includes(self.location.origin) && "focus" in client) {
                  return client.focus();
               }
            }

            if (clients.openWindow) {
               return clients.openWindow(urlToOpen);
            }
         })
   );
});
