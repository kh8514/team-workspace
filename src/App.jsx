import { useEffect, useState } from 'react';
import useAuthStore from './store/authStore';
import usePersonalStore from './store/personalStore';
import useTeamStore from './store/teamStore';
import Login from './components/auth/Login';
import PersonalTodo from './components/personal/PersonalTodo';
import KanbanBoard from './components/team/KanbanBoard';
import CalendarView from './components/CalendarView';
import SummaryView from './components/SummaryView';

const TABS = [
  { key: 'todo',     label: '📋 투두리스트' },
  { key: 'kanban',   label: '🗂 칸반보드' },
  { key: 'calendar', label: '📅 달력' },
  { key: 'summary',  label: '📊 리포트' },
];

function App() {
  const { user, loading, initAuth, logout } = useAuthStore();
  const { subscribe: subPersonal, unsubscribeAll: unsubPersonal, subscribeArchive, unsubscribeArchive } = usePersonalStore();
  const { subscribe: subTeam, unsubscribeAll: unsubTeam, loadMembers } = useTeamStore();
  const [activeTab, setActiveTab] = useState('todo');

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    subPersonal(user.uid);
    subscribeArchive(user.uid);
    subTeam();
    loadMembers();
    return () => {
      unsubPersonal();
      unsubscribeArchive();
      unsubTeam();
    };
  }, [user?.uid]);

  // Date string
  const now = new Date();
  const dateStr = now.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f0f11',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ color: '#7a7a8e', fontSize: 14, fontFamily: 'Space Mono, monospace' }}>
          loading...
        </div>
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
      padding: '28px 20px 60px',
    }}>

      {/* 헤더 */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        animation: 'fadeDown .45s ease',
      }}>
        <div style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 24,
          fontWeight: 700,
          color: '#a78bfa',
          letterSpacing: -1,
          flex: 1,
        }}>
          // workspace
        </div>
        <div style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 12,
          color: '#7a7a8e',
        }}>
          {dateStr}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName}
              style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #2e2e38' }}
            />
          )}
          <span style={{ fontSize: 13, color: '#7a7a8e' }}>{user.displayName}</span>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1.5px solid #2e2e38',
              borderRadius: 99,
              color: '#7a7a8e',
              cursor: 'pointer',
              fontSize: 11,
              padding: '3px 10px',
              fontFamily: 'Noto Sans KR, sans-serif',
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 뷰 탭 */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto 22px',
        animation: 'fadeDown .45s ease .05s both',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          gap: 4,
          background: '#1a1a1f',
          border: '1.5px solid #2e2e38',
          borderRadius: 10,
          padding: 4,
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key ? '#7c6af7' : 'transparent',
                border: 'none',
                borderRadius: 7,
                color: activeTab === tab.key ? '#fff' : '#7a7a8e',
                cursor: 'pointer',
                fontFamily: 'Noto Sans KR, sans-serif',
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 500 : 400,
                padding: '7px 18px',
                transition: 'all .15s',
              }}
              onMouseEnter={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = '#e8e8f0'; }}
              onMouseLeave={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = '#7a7a8e'; }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      {activeTab === 'todo'     && <PersonalTodo onSwitchToKanban={() => setActiveTab('kanban')} />}
      {activeTab === 'kanban'   && <KanbanBoard />}
      {activeTab === 'calendar' && <CalendarView />}
      {activeTab === 'summary'  && <SummaryView />}
    </div>
  );
}

export default App;
