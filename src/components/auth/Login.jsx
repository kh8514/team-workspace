import { useState } from 'react';
import useAuthStore from '../../store/authStore';

function Login() {
  const { login, error } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setPopupBlocked(false);
    try {
      await login();
    } catch {
      // error is set in store
    } finally {
      setLoading(false);
    }
  };

  // 팝업 차단 여부 감지
  const isPopupBlocked = error?.includes('popup-blocked') || popupBlocked;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f11',
      backgroundImage: `radial-gradient(ellipse at 20% 0%, rgba(124,106,247,.13) 0%, transparent 55%),
                        radial-gradient(ellipse at 80% 100%, rgba(52,211,153,.07) 0%, transparent 55%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#1a1a1f',
        border: '1.5px solid #2e2e38',
        borderRadius: 20,
        padding: '40px 32px',
        width: '100%',
        maxWidth: 380,
        textAlign: 'center',
        animation: 'modalIn .3s ease',
      }}>
        {/* 로고 */}
        <div style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 28,
          fontWeight: 700,
          color: '#a78bfa',
          letterSpacing: -1,
          marginBottom: 8,
        }}>
          // workspace
        </div>
        <p style={{ color: '#7a7a8e', fontSize: 13, marginBottom: 32 }}>
          팀원과 함께 할 일을 관리하세요
        </p>

        {/* 팝업 차단 안내 */}
        {isPopupBlocked ? (
          <div style={{
            background: 'rgba(251,191,36,.08)',
            border: '1px solid rgba(251,191,36,.3)',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 16,
            textAlign: 'left',
          }}>
            <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              팝업이 차단되었습니다
            </div>
            <div style={{ color: '#a0a0b0', fontSize: 12, lineHeight: 1.7 }}>
              브라우저 주소창 오른쪽의 <b style={{ color: '#e8e8f0' }}>팝업 차단 아이콘</b>을 클릭하여<br />
              이 사이트의 팝업을 <b style={{ color: '#e8e8f0' }}>항상 허용</b>으로 설정한 뒤<br />
              아래 버튼을 다시 눌러주세요.
            </div>
          </div>
        ) : error ? (
          <div style={{
            background: 'rgba(248,113,113,.12)',
            border: '1px solid rgba(248,113,113,.3)',
            color: '#f87171',
            fontSize: 13,
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
          }}>
            {error}
          </div>
        ) : null}

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: loading ? '#1e1e26' : '#23232b',
            border: `1.5px solid ${isPopupBlocked ? 'rgba(251,191,36,.4)' : '#2e2e38'}`,
            borderRadius: 12,
            padding: '12px 16px',
            color: loading ? '#7a7a8e' : '#e8e8f0',
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Noto Sans KR, sans-serif',
            transition: 'all .15s',
          }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.borderColor = '#7c6af7'; e.currentTarget.style.background = '#28283a'; } }}
          onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.borderColor = isPopupBlocked ? 'rgba(251,191,36,.4)' : '#2e2e38'; e.currentTarget.style.background = '#23232b'; } }}
        >
          {loading ? (
            <span style={{ fontSize: 13 }}>로그인 중...</span>
          ) : (
            <>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                style={{ width: 20, height: 20 }}
              />
              {isPopupBlocked ? '다시 시도' : 'Google 계정으로 로그인'}
            </>
          )}
        </button>

        <p style={{ color: '#3e3e50', fontSize: 11, marginTop: 20 }}>
          팀원 계정만 접근 가능합니다
        </p>
      </div>
    </div>
  );
}

export default Login;
