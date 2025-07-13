// Firebase messaging service worker
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

// Firebase configuration - This will be updated dynamically
// For now, using placeholder values that need to be replaced with your actual Firebase config
const firebaseConfig = {
   apiKey: "AIzaSyBctypVYrvSZl7gXeDutTuEbNYfgyE7Uuo",
   authDomain: "restrain-yourself.firebaseapp.com",
   projectId: "restrain-yourself",
   storageBucket: "restrain-yourself.firebasestorage.app",
   messagingSenderId: "442834474290",
   appId: "1:442834474290:web:1ab7118cfb1a7e76f4732b",
};

// Initialize Firebase
try {
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
         icon: "/icon-192x192.svg",
         badge: "/badge-72x72.svg",
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
} catch (error) {
   console.error("Failed to initialize Firebase in service worker:", error);
}

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
