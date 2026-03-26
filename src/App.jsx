import { useEffect, useState } from 'react';
import useAuthStore from './store/authStore';
import usePersonalStore from './store/personalStore';
import useTeamStore from './store/teamStore';
import Login from './components/auth/Login';
import PersonalTodo from './components/personal/PersonalTodo';
import KanbanBoard from './components/team/KanbanBoard';
import CalendarView from './components/CalendarView';
import SummaryView from './components/SummaryView';
import { subscribeActivity } from './firebase/activity';
import { useBreakpoint } from './hooks/useBreakpoint';
import { NotificationBell } from './components/NotificationSetup';

const TABS = [
  { key: 'todo',     label: '📋', labelFull: '투두리스트' },
  { key: 'kanban',   label: '🗂',  labelFull: '칸반보드' },
  { key: 'calendar', label: '📅', labelFull: '달력' },
  { key: 'summary',  label: '📊', labelFull: '리포트' },
];

function App() {
  const { user, loading, initAuth, logout } = useAuthStore();
  const { subscribe: subPersonal, unsubscribeAll: unsubPersonal, subscribeArchive, unsubscribeArchive } = usePersonalStore();
  const { subscribe: subTeam, unsubscribeAll: unsubTeam, loadMembers, cards } = useTeamStore();
  const { isMobile } = useBreakpoint();
  const [activeTab, setActiveTab] = useState('todo');
  const [overdueCards, setOverdueCards] = useState([]);
  const [showOverdueAlert, setShowOverdueAlert] = useState(false);
  const [activityFeed, setActivityFeed] = useState([]);

  useEffect(() => { initAuth(); }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    subPersonal(user.uid);
    subscribeArchive(user.uid);
    subTeam();
    loadMembers();
    const unsubActivity = subscribeActivity((feed) => { if (!cancelled) setActivityFeed(feed); });
    return () => {
      cancelled = true;
      unsubPersonal();
      unsubscribeArchive();
      unsubTeam();
      unsubActivity();
    };
  }, [user?.uid]);

  // 마감일 초과 카드 감지
  useEffect(() => {
    if (!cards.length || !user) return;
    const today = new Date().toISOString().split('T')[0];
    const overdue = cards.filter((c) => c.endDate && c.endDate < today && c.status !== 'done');
    setOverdueCards(overdue);
    if (overdue.length > 0) setShowOverdueAlert(true);
  }, [cards, user]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f11', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#7a7a8e', fontSize: 14, fontFamily: 'Space Mono, monospace' }}>loading...</div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f11',
      backgroundImage: `radial-gradient(ellipse at 20% 0%, rgba(124,106,247,.13) 0%, transparent 55%),
                        radial-gradient(ellipse at 80% 100%, rgba(52,211,153,.07) 0%, transparent 55%)`,
      padding: isMobile ? '16px 12px 80px' : '28px 20px 60px',
    }}>

      {/* 헤더 */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto 14px',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 8 : 14,
        animation: 'fadeDown .45s ease',
      }}>
        <div style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: isMobile ? 16 : 24,
          fontWeight: 700,
          color: '#a78bfa',
          letterSpacing: -1,
          flex: 1,
        }}>
          // workspace
        </div>
        {!isMobile && (
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#7a7a8e' }}>
            {dateStr}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
          {user.photoURL && (
            <img src={user.photoURL} alt={user.displayName}
              style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid #2e2e38' }} />
          )}
          {!isMobile && (
            <span style={{ fontSize: 13, color: '#7a7a8e' }}>{user.displayName}</span>
          )}
          <NotificationBell />
          <button
            onClick={logout}
            style={{
              background: 'transparent', border: '1.5px solid #2e2e38', borderRadius: 99,
              color: '#7a7a8e', cursor: 'pointer', fontSize: 11,
              padding: isMobile ? '3px 8px' : '3px 10px',
              fontFamily: 'Noto Sans KR, sans-serif', transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 마감일 초과 알림 배너 */}
      {showOverdueAlert && overdueCards.length > 0 && (
        <div style={{
          maxWidth: 1200, margin: '0 auto 12px',
          background: 'rgba(248,113,113,.12)', border: '1.5px solid rgba(248,113,113,.35)',
          borderRadius: 10, padding: isMobile ? '8px 12px' : '10px 16px',
          display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeDown .3s ease',
        }}>
          <span style={{ fontSize: 15 }}>⚠️</span>
          <span style={{ fontSize: isMobile ? 12 : 13, color: '#fca5a5', flex: 1 }}>
            마감 초과 카드 <strong style={{ color: '#f87171' }}>{overdueCards.length}개</strong>
            {!isMobile && overdueCards.length <= 3 && (
              <span style={{ opacity: .8 }}> ({overdueCards.map((c) => c.title).join(', ')})</span>
            )}
          </span>
          <button onClick={() => { setActiveTab('kanban'); setShowOverdueAlert(false); }}
            style={{ background: 'rgba(248,113,113,.2)', border: '1px solid rgba(248,113,113,.4)', borderRadius: 6, color: '#f87171', cursor: 'pointer', fontSize: 11, padding: '3px 8px', fontFamily: 'Noto Sans KR, sans-serif', whiteSpace: 'nowrap' }}>
            보기
          </button>
          <button onClick={() => setShowOverdueAlert(false)}
            style={{ background: 'transparent', border: 'none', color: '#7a7a8e', cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1 }}>
            ×
          </button>
        </div>
      )}

      {/* 뷰 탭 */}
      <div style={{
        maxWidth: 1200, margin: '0 auto 18px',
        animation: 'fadeDown .45s ease .05s both',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{
          display: 'inline-flex', gap: 4,
          background: '#1a1a1f', border: '1.5px solid #2e2e38',
          borderRadius: 10, padding: 4,
          width: isMobile ? '100%' : 'auto',
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key ? '#7c6af7' : 'transparent',
                border: 'none', borderRadius: 7,
                color: activeTab === tab.key ? '#fff' : '#7a7a8e',
                cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif',
                fontSize: isMobile ? 12 : 13,
                fontWeight: activeTab === tab.key ? 500 : 400,
                padding: isMobile ? '8px 0' : '7px 18px',
                transition: 'all .15s',
                flex: isMobile ? 1 : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: isMobile ? 0 : 4,
              }}
              onMouseEnter={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = '#e8e8f0'; }}
              onMouseLeave={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = '#7a7a8e'; }}
            >
              {isMobile ? (
                <span style={{ fontSize: 18 }}>{tab.label}</span>
              ) : (
                `${tab.label} ${tab.labelFull}`
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      {activeTab === 'todo'     && <PersonalTodo onSwitchToKanban={() => setActiveTab('kanban')} />}
      {activeTab === 'kanban'   && <KanbanBoard />}
      {activeTab === 'calendar' && <CalendarView />}
      {activeTab === 'summary'  && <SummaryView activityFeed={activityFeed} />}
    </div>
  );
}

export default App;
