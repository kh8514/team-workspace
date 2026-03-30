import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { ref, set, remove } from 'firebase/database';
import { db } from './config';
import { getApp } from 'firebase/app';

let _messaging = null;

const getMsg = () => {
  if (!_messaging) _messaging = getMessaging(getApp());
  return _messaging;
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/** Firebase Messaging 지원 여부 확인 */
export const isMessagingSupported = async () => {
  try {
    return await isSupported();
  } catch {
    return false;
  }
};

/** FCM 토큰 요청 + DB 저장 */
export const requestPermissionAndSaveToken = async (uid) => {
  if (!('Notification' in window)) throw new Error('이 브라우저는 알림을 지원하지 않습니다.');
  if (!VAPID_KEY) throw new Error('VAPID 키가 설정되지 않았습니다. .env 파일을 확인하세요.');

  const supported = await isMessagingSupported();
  if (!supported) throw new Error('이 브라우저는 FCM을 지원하지 않습니다.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('알림 권한이 거부되었습니다.');

  let registration;
  try {
    registration = await navigator.serviceWorker.register('/team-workspace/firebase-messaging-sw.js');
    // 서비스 워커가 활성화될 때까지 대기
    await navigator.serviceWorker.ready;
  } catch (err) {
    throw new Error('서비스 워커 등록 실패: ' + err.message);
  }

  let token;
  try {
    token = await getToken(getMsg(), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
  } catch (err) {
    console.error('FCM getToken 상세 오류:', err);
    if (err.message?.includes('403') || err.code === 'messaging/token-subscribe-failed') {
      throw new Error(
        'FCM 권한 오류(403): Firebase Console → 프로젝트 설정 → Cloud Messaging에서 VAPID 키를 확인하거나, Google Cloud Console에서 Firebase Cloud Messaging API를 활성화해주세요.'
      );
    }
    throw new Error('토큰 발급 실패: ' + err.message);
  }

  if (!token) throw new Error('토큰 발급에 실패했습니다.');

  // DB에 토큰 저장: fcmTokens/{uid}/{tokenKey}
  try {
    const tokenKey = token.slice(-20);
    await set(ref(db, `fcmTokens/${uid}/${tokenKey}`), {
      token,
      createdAt: Date.now(),
      userAgent: navigator.userAgent.slice(0, 100),
    });
  } catch (err) {
    console.warn('토큰 DB 저장 실패 (Firebase 규칙 확인 필요):', err);
    // 토큰 저장 실패해도 로컬에서는 알림 수신 가능
  }

  return token;
};

/** 토큰 삭제 (알림 해제) */
export const removeToken = async (uid, token) => {
  if (!token) return;
  try {
    const tokenKey = token.slice(-20);
    await remove(ref(db, `fcmTokens/${uid}/${tokenKey}`));
  } catch (err) {
    console.warn('토큰 삭제 실패:', err);
  }
};

/** 포그라운드(앱 열려 있을 때) 메시지 수신 콜백 등록 */
export const onForegroundMessage = (callback) => {
  try {
    return onMessage(getMsg(), callback);
  } catch {
    return () => {};
  }
};
