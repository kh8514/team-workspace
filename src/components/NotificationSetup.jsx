import { useState, useEffect, useCallback } from 'react';
import { requestPermissionAndSaveToken, removeToken, onForegroundMessage, isMessagingSupported } from '../firebase/messaging';
import useAuthStore from '../store/authStore';
import { COLORS } from '../constants/theme';

// 포그라운드 토스트 알림
function NotificationToast({ msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', top: 72, right: 16, zIndex: 9999,
      background: COLORS.bgInput, border: `1.5px solid ${COLORS.accent}`,
      borderRadius: 14, padding: '14px 18px',
      maxWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,.5)',
      animation: 'fadeUp .25s ease',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>🔔</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
          {msg.title}
        </div>
        <div style={{ fontSize: 12, color: '#a0a0b8', lineHeight: 1.5 }}>
          {msg.body}
        </div>
      </div>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', color: COLORS.textMuted,
        cursor: 'pointer', fontSize: 16, padding: 0, flexShrink: 0,
      }}>✕</button>
    </div>
  );
}

// 벨 아이콘 버튼 (헤더에 삽입)
export function NotificationBell() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState('checking'); // checking | idle | loading | granted | denied | unsupported
  const [token, setToken] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  // 지원 여부 + 초기 권한 상태 확인
  useEffect(() => {
    const init = async () => {
      // 브라우저 기본 지원 확인
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setStatus('unsupported');
        return;
      }

      // Firebase Messaging 지원 확인
      const supported = await isMessagingSupported();
      if (!supported) {
        setStatus('unsupported');
        return;
      }

      if (Notification.permission === 'granted') setStatus('granted');
      else if (Notification.permission === 'denied') setStatus('denied');
      else setStatus('idle');
    };
    init();
  }, []);

  // 포그라운드 메시지 수신 (지원되는 경우에만)
  useEffect(() => {
    if (status === 'unsupported' || status === 'checking') return;

    let unsub = () => {};
    try {
      unsub = onForegroundMessage((payload) => {
        setToast({
          title: payload.notification?.title || '알림',
          body: payload.notification?.body || '',
        });
      });
    } catch (e) {
      console.warn('포그라운드 메시지 등록 실패:', e);
    }
    return unsub;
  }, [status]);

  const handleEnable = useCallback(async () => {
    if (!user) return;
    setStatus('loading');
    setError(null);
    try {
      const t = await requestPermissionAndSaveToken(user.uid);
      setToken(t);
      setStatus('granted');
    } catch (err) {
      console.error('FCM 오류:', err);
      const msg = err.message || '알림 설정 실패';
      setError(msg);
      if (Notification.permission === 'denied') {
        setStatus('denied');
      } else {
        setStatus('idle');
      }
      // 에러 토스트 표시 후 3초 뒤 제거
      setTimeout(() => setError(null), 4000);
    }
  }, [user]);

  const handleDisable = useCallback(async () => {
    if (!user || !token) return;
    try {
      await removeToken(user.uid, token);
    } catch (e) {
      console.warn('토큰 삭제 실패:', e);
    }
    setToken(null);
    setStatus('idle');
  }, [user, token]);

  const handleClick = () => {
    if (status === 'checking') return;
    if (status === 'unsupported') {
      setError('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (status === 'denied') {
      setError('브라우저 설정에서 알림을 허용해주세요.');
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (status === 'granted') {
      handleDisable();
    } else {
      handleEnable();
    }
  };

  const title =
    status === 'granted' ? '알림 켜짐 — 클릭하면 해제' :
    status === 'denied' ? '브라우저 설정에서 알림을 허용해주세요' :
    status === 'unsupported' ? '이 브라우저는 알림 미지원' :
    status === 'loading' ? '권한 요청 중...' :
    '알림 받기';

  const icon =
    status === 'granted' ? '🔔' :
    status === 'denied' ? '🚫' :
    status === 'unsupported' ? '🔕' :
    status === 'loading' ? '⏳' : '🔕';

  return (
    <>
      <button
        onClick={handleClick}
        disabled={status === 'loading' || status === 'checking'}
        title={title}
        style={{
          background: status === 'granted' ? 'rgba(124,106,247,.18)' : COLORS.bgCard,
          border: `1.5px solid ${status === 'granted' ? COLORS.accent : COLORS.border}`,
          borderRadius: 10, cursor: status === 'loading' || status === 'checking' ? 'not-allowed' : 'pointer',
          fontSize: 16, padding: '6px 10px', color: COLORS.textPrimary,
          transition: 'all .15s', lineHeight: 1,
          opacity: status === 'loading' ? 0.6 : 1,
        }}
        onMouseEnter={(e) => { if (status !== 'denied') e.currentTarget.style.borderColor = COLORS.accent; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = status === 'granted' ? COLORS.accent : COLORS.border; }}
      >
        {icon}
      </button>

      {/* 에러 토스트 */}
      {error && (
        <NotificationToast
          msg={{ title: '알림 설정 실패', body: error }}
          onClose={() => setError(null)}
        />
      )}

      {/* 포그라운드 알림 토스트 */}
      {toast && (
        <NotificationToast msg={toast} onClose={() => setToast(null)} />
      )}
    </>
  );
}

export default NotificationBell;
