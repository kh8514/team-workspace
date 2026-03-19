import { useState, useRef } from 'react';
import useTeamStore from '../../store/teamStore';
import useAuthStore from '../../store/authStore';
import CardDetail from './CardDetail';

const COLUMNS = [
  { status: 'todo',       title: 'To Do',      icon: '📦', colKey: 'todo',   color: '#7c6af7' },
  { status: 'inProgress', title: 'In Progress', icon: '🔧', colKey: 'doing',  color: '#fbbf24' },
  { status: 'review',     title: 'Review',      icon: '👁',  colKey: 'review', color: '#60a5fa' },
  { status: 'done',       title: 'Done',        icon: '✅', colKey: 'done',   color: '#34d399' },
];

const PRIORITY_FLAG = {
  high:   { color: '#f87171', label: '높음' },
  medium: { color: '#fbbf24', label: '보통' },
  low:    { color: '#34d399', label: '낮음' },
};

const fmtDate = (s) => {
  if (!s) return '';
  const [, m, d] = s.split('-');
  return `${parseInt(m)} Aug`.replace('Aug', ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1]);
};

const fmtDateKo = (s) => {
  if (!s) return '';
  const [, m, d] = s.split('-');
  return `${parseInt(m)}월 ${parseInt(d)}일`;
};

const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// ── 개별 카드 ─────────────────────────────────────────────
function MobileCard({ card, members, onOpen }) {
  const pf   = PRIORITY_FLAG[card.priority || 'medium'];
  const today = todayYMD();
  const dateRef = card.endDate || card.startDate;
  const isOverdue = dateRef && dateRef < today && card.status !== 'done';
  const assignee = members.find((m) => m.uid === card.assigneeId);

  return (
    <div
      onClick={() => onOpen(card)}
      style={{
        background: '#212128',
        borderRadius: 16,
        padding: '18px 18px 14px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1.5px solid #2e2e38',
        minHeight: 130,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        userSelect: 'none',
      }}
    >
      {/* 접힌 모서리 */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 0, height: 0,
        borderStyle: 'solid',
        borderWidth: '0 28px 28px 0',
        borderColor: `transparent #2e2e38 transparent transparent`,
      }} />

      {/* 제목 + 우선순위 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingRight: 20 }}>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#e8e8f0', lineHeight: 1.4, wordBreak: 'break-word' }}>
          {card.title}
        </div>
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
          <path d="M1 1h12v10L7 14 1 11V1z" fill={pf.color} opacity=".9" />
          <line x1="7" y1="14" x2="7" y2="17" stroke={pf.color} strokeWidth="2" strokeLinecap="round" opacity=".6" />
        </svg>
      </div>

      {/* 날짜 */}
      {dateRef && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isOverdue ? '#f87171' : '#7a7a8e'} strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span style={{ fontSize: 12, color: isOverdue ? '#f87171' : '#7a7a8e', fontFamily: 'Space Mono, monospace' }}>
            {fmtDateKo(dateRef)}
          </span>
          {isOverdue && (
            <span style={{ fontSize: 10, color: '#f87171', background: 'rgba(248,113,113,.12)', borderRadius: 4, padding: '1px 5px' }}>
              기간초과
            </span>
          )}
        </div>
      )}

      {/* 하단: 담당자 + 상태 뱃지 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {assignee?.photoURL ? (
            <img src={assignee.photoURL} alt={assignee.name}
              style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #1a1a1f', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2e2e38', border: '2px solid #1a1a1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#7a7a8e' }}>
              {assignee?.name?.[0] || '?'}
            </div>
          )}
          {assignee && (
            <span style={{ marginLeft: 8, fontSize: 11, color: '#7a7a8e' }}>{assignee.name}</span>
          )}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px',
          background: `${pf.color}18`, color: pf.color,
        }}>
          {pf.label}
        </span>
      </div>
    </div>
  );
}

// ── 섹션 (컬럼 캐러셀) ───────────────────────────────────
function MobileSection({ col, cards, members, onOpen }) {
  const scrollRef  = useRef(null);
  const [active, setActive] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !el.clientWidth) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const scrollTo = (idx) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div style={{ marginBottom: 24 }}>
      {/* 섹션 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 2px', marginBottom: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: `${col.color}18`, border: `1.5px solid ${col.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>
          {col.icon}
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#e8e8f0', flex: 1 }}>
          {col.title}
        </span>
        <span style={{
          fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700,
          color: col.color, background: `${col.color}18`, borderRadius: 8,
          padding: '2px 10px',
        }}>
          {cards.length}
        </span>
      </div>

      {/* 카드 없을 때 */}
      {cards.length === 0 ? (
        <div style={{
          background: '#1a1a1f', border: '1.5px dashed #2e2e38',
          borderRadius: 16, padding: '28px 0',
          textAlign: 'center', color: '#55556a', fontSize: 13,
        }}>
          카드 없음
        </div>
      ) : (
        <>
          {/* 가로 스크롤 카드 */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              gap: 12,
              paddingBottom: 4,
            }}
          >
            {cards.map((card, i) => (
              <div
                key={card.id}
                style={{
                  minWidth: 'calc(100% - 24px)',
                  maxWidth: 'calc(100% - 24px)',
                  scrollSnapAlign: 'start',
                  flexShrink: 0,
                }}
              >
                <MobileCard card={card} members={members} onOpen={onOpen} />
              </div>
            ))}
          </div>

          {/* 페이지네이션 도트 */}
          {cards.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }}>
              {cards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  style={{
                    width: i === active ? 18 : 6,
                    height: 6,
                    borderRadius: 99,
                    background: i === active ? col.color : '#2e2e38',
                    border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'all .25s',
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── 메인 모바일 칸반 ─────────────────────────────────────
function MobileKanbanBoard() {
  const { user }  = useAuthStore();
  const {
    getFilteredCards, members, addCard,
    filterAssignee, filterPriority,
    setFilterAssignee, setFilterPriority,
  } = useTeamStore();

  const [selectedCard, setSelectedCard] = useState(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [inputText,    setInputText]    = useState('');
  const [inputCol,     setInputCol]     = useState('todo');
  const [inputPrio,    setInputPrio]    = useState('medium');

  const filteredCards = getFilteredCards();

  const handleAdd = () => {
    if (!inputText.trim()) return;
    addCard({ title: inputText.trim(), status: inputCol, priority: inputPrio, authorId: user.uid, authorName: user.displayName, assigneeId: user.uid, description: '', dueDate: '' }, user);
    setInputText('');
    setShowAdd(false);
  };

  const SELECT = {
    background: '#23232b', border: '1.5px solid #2e2e38', borderRadius: 10,
    color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 13,
    padding: '10px 12px', outline: 'none',
  };

  return (
    <div style={{ animation: 'fadeUp .35s ease' }}>

      {/* 상단: 필터 + 추가 버튼 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center' }}>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}
          style={{ ...SELECT, flex: 1, fontSize: 12 }}>
          <option value="all">👤 전체</option>
          {members.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          style={{ ...SELECT, flex: 1, fontSize: 12 }}>
          <option value="all">🎯 전체</option>
          <option value="high">🔴 높음</option>
          <option value="medium">🟡 중간</option>
          <option value="low">🟢 낮음</option>
        </select>
        <button
          onClick={() => setShowAdd((v) => !v)}
          style={{
            background: showAdd ? '#2e2e38' : '#7c6af7',
            border: 'none', borderRadius: 12,
            color: '#fff', cursor: 'pointer',
            fontSize: 22, width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background .15s',
          }}
        >
          {showAdd ? '✕' : '+'}
        </button>
      </div>

      {/* 카드 추가 폼 */}
      {showAdd && (
        <div style={{
          background: '#1a1a1f', border: '1.5px solid #2e2e38',
          borderRadius: 16, padding: 16, marginBottom: 18,
          animation: 'fadeUp .15s ease',
        }}>
          <input
            autoFocus
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="새 카드 제목 입력..."
            style={{
              width: '100%', background: '#23232b', border: '1.5px solid #2e2e38',
              borderRadius: 10, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: 14, padding: '11px 14px', outline: 'none', marginBottom: 10,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={inputCol} onChange={(e) => setInputCol(e.target.value)} style={{ ...SELECT, flex: 1, fontSize: 12 }}>
              <option value="todo">📌 할 일</option>
              <option value="inProgress">⚡ 진행 중</option>
              <option value="review">👀 검토</option>
              <option value="done">✅ 완료</option>
            </select>
            <select value={inputPrio} onChange={(e) => setInputPrio(e.target.value)} style={{ ...SELECT, flex: 1, fontSize: 12 }}>
              <option value="medium">🟡 보통</option>
              <option value="high">🔴 높음</option>
              <option value="low">🟢 낮음</option>
            </select>
            <button
              onClick={handleAdd}
              onMouseDown={(e) => e.preventDefault()}
              style={{ background: '#7c6af7', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 13, padding: '10px 16px', fontWeight: 700 }}>
              추가
            </button>
          </div>
        </div>
      )}

      {/* 컬럼 섹션 */}
      {COLUMNS.map((col) => (
        <MobileSection
          key={col.status}
          col={col}
          cards={filteredCards.filter((c) => c.status === col.status)}
          members={members}
          onOpen={setSelectedCard}
        />
      ))}

      {/* 카드 상세 모달 */}
      {selectedCard && (
        <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

export default MobileKanbanBoard;
