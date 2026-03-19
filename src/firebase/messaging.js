import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { ref, set, remove } from 'firebase/database';
import { db } from './config';
import { getApp } from 'firebase/app';

let _messaging = null;

const getMsg = () => {
  if (!_messaging) _messaging = getMessaging(getApp());
  return _messaging;
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// FCM 토큰 요청 + DB 저장
export const requestPermissionAndSaveToken = async (uid) => {
  if (!('Notification' in window)) throw new Error('이 브라우저는 알림을 지원하지 않습니다.');
  if (!VAPID_KEY) throw new Error('VAPID 키가 설정되지 않았습니다.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('알림 권한이 거부되었습니다.');

  const registration = await navigator.serviceWorker.register('/team-workspace/firebase-messaging-sw.js');

  const token = await getToken(getMsg(), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) throw new Error('토큰 발급에 실패했습니다.');

  // DB에 토큰 저장: fcmTokens/{uid}/{tokenKey}
  const tokenKey = token.slice(-20);
  await set(ref(db, `fcmTokens/${uid}/${tokenKey}`), {
    token,
    createdAt: Date.now(),
    userAgent: navigator.userAgent.slice(0, 100),
  });

  return token;
};

// 토큰 삭제 (알림 해제)
export const removeToken = async (uid, token) => {
  if (!token) return;
  const tokenKey = token.slice(-20);
  await remove(ref(db, `fcmTokens/${uid}/${tokenKey}`));
};

// 포그라운드(앱 열려 있을 때) 메시지 수신 콜백 등록
export const onForegroundMessage = (callback) => {
  try {
    return onMessage(getMsg(), callback);
  } catch {
    return () => {};
  }
};
