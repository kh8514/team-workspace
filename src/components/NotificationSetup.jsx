import { useState, useEffect } from 'react';
import { requestPermissionAndSaveToken, removeToken, onForegroundMessage } from '../firebase/messaging';
import useAuthStore from '../store/authStore';

// 포그라운드 토스트 알림
function NotificationToast({ msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', top: 72, right: 16, zIndex: 9999,
      background: '#23232b', border: '1.5px solid #7c6af7',
      borderRadius: 14, padding: '14px 18px',
      maxWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,.5)',
      animation: 'fadeUp .25s ease',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>🔔</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8f0', marginBottom: 4 }}>
          {msg.title}
        </div>
        <div style={{ fontSize: 12, color: '#a0a0b8', lineHeight: 1.5 }}>
          {msg.body}
        </div>
      </div>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', color: '#55556a',
        cursor: 'pointer', fontSize: 16, padding: 0, flexShrink: 0,
      }}>✕</button>
    </div>
  );
}

// 벨 아이콘 버튼 (헤더에 삽입)
export function NotificationBell() {
  const { user } = useAuthStore();
  const [status, setStatus]   = useState('idle'); // idle | loading | granted | denied
  const [token,  setToken]    = useState(null);
  const [toast,  setToast]    = useState(null);

  // 초기 권한 상태 확인
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') setStatus('granted');
    if (Notification.permission === 'denied')  setStatus('denied');
  }, []);

  // 포그라운드 메시지 수신
  useEffect(() => {
    const unsub = onForegroundMessage((payload) => {
      setToast({
        title: payload.notification?.title || '알림',
        body:  payload.notification?.body  || '',
      });
    });
    return unsub;
  }, []);

  const handleEnable = async () => {
    if (!user) return;
    setStatus('loading');
    try {
      const t = await requestPermissionAndSaveToken(user.uid);
      setToken(t);
      setStatus('granted');
    } catch (err) {
      console.error('FCM 오류:', err);
      setStatus(Notification.permission === 'denied' ? 'denied' : 'idle');
    }
  };

  const handleDisable = async () => {
    if (!user || !token) return;
    await removeToken(user.uid, token);
    setToken(null);
    setStatus('idle');
  };

  const title =
    status === 'granted' ? '알림 켜짐 — 클릭하면 해제' :
    status === 'denied'  ? '브라우저 설정에서 알림을 허용해주세요' :
    status === 'loading' ? '권한 요청 중...' :
    '알림 받기';

  const icon =
    status === 'granted' ? '🔔' :
    status === 'denied'  ? '🚫' :
    status === 'loading' ? '⏳' : '🔕';

  return (
    <>
      <button
        onClick={status === 'granted' ? handleDisable : handleEnable}
        disabled={status === 'loading' || status === 'denied'}
        title={title}
        style={{
          background: status === 'granted' ? 'rgba(124,106,247,.18)' : '#1a1a1f',
          border: `1.5px solid ${status === 'granted' ? '#7c6af7' : '#2e2e38'}`,
          borderRadius: 10, cursor: status === 'denied' ? 'not-allowed' : 'pointer',
          fontSize: 16, padding: '6px 10px', color: '#e8e8f0',
          transition: 'all .15s', lineHeight: 1,
          opacity: status === 'loading' ? 0.6 : 1,
        }}
        onMouseEnter={(e) => { if (status !== 'denied') e.currentTarget.style.borderColor = '#7c6af7'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = status === 'granted' ? '#7c6af7' : '#2e2e38'; }}
      >
        {icon}
      </button>

      {toast && (
        <NotificationToast msg={toast} onClose={() => setToast(null)} />
      )}
    </>
  );
}

export default NotificationBell;
