// Firebase 서비스 워커 — 백그라운드 푸시 알림 처리
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyDSPs5e8WWkkpx9aMhf4efJwYw8Ij8-oG4',
  authDomain:        'team-workspace-a8352.firebaseapp.com',
  projectId:         'team-workspace-a8352',
  storageBucket:     'team-workspace-a8352.firebasestorage.app',
  messagingSenderId: '749095337641',
  appId:             '1:749095337641:web:70034bd6e3639cc968b3b8',
});

const messaging = firebase.messaging();

// 백그라운드(앱이 닫혀 있거나 포커스 없을 때) 메시지 수신
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || '팀 워크스페이스';
  const body  = payload.notification?.body  || '';

  self.registration.showNotification(title, {
    body,
    icon:  '/team-workspace/icons/icon-192.png',
    badge: '/team-workspace/icons/icon-72.png',
    data:  payload.data || {},
    vibrate: [200, 100, 200],
  });
});

// 알림 클릭 시 앱 포커스
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes('team-workspace') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/team-workspace/');
    })
  );
});
