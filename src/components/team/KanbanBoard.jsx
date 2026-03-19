import { useState } from 'react';
import useTeamStore from '../../store/teamStore';
import useAuthStore from '../../store/authStore';
import KanbanColumn from './KanbanColumn';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const COLUMNS = [
  { status: 'todo',       title: '할 일',   colKey: 'todo' },
  { status: 'inProgress', title: '진행 중', colKey: 'doing' },
  { status: 'review',     title: '검토',    colKey: 'review' },
  { status: 'done',       title: '완료',    colKey: 'done' },
];

const SELECT_STYLE = {
  background: '#1a1a1f',
  border: '1.5px solid #2e2e38',
  borderRadius: 12,
  color: '#e8e8f0',
  fontFamily: 'Noto Sans KR, sans-serif',
  fontSize: 13,
  padding: '12px 10px',
  outline: 'none',
  cursor: 'pointer',
};

function KanbanBoard() {
  const { user } = useAuthStore();
  const { isMobile, isTablet } = useBreakpoint();
  const {
    getFilteredCards, members,
    filterAssignee, filterPriority,
    setFilterAssignee, setFilterPriority,
    addCard,
  } = useTeamStore();

  const [inputText, setInputText] = useState('');
  const [inputCol, setInputCol] = useState('todo');
  const [inputPrio, setInputPrio] = useState('medium');

  const handleAdd = () => {
    if (!inputText.trim()) return;
    addCard({
      title: inputText.trim(),
      status: inputCol,
      priority: inputPrio,
      authorId: user.uid,
      authorName: user.displayName,
      assigneeId: user.uid,
      description: '',
      dueDate: '',
    }, user);
    setInputText('');
  };

  const filteredCards = getFilteredCards();
  const selectStyle = { ...SELECT_STYLE, padding: isMobile ? '10px 8px' : '12px 10px', fontSize: isMobile ? 12 : 13 };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', animation: 'fadeUp .4s ease' }}>

      {/* 입력 영역 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="새 카드 입력... (Enter)"
          maxLength={200}
          style={{
            flex: 1, minWidth: isMobile ? '100%' : 180,
            background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 12,
            color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: isMobile ? 14 : 15, padding: isMobile ? '10px 14px' : '12px 16px',
            outline: 'none', transition: 'border-color .2s, box-shadow .2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#7c6af7'; e.target.style.boxShadow = '0 0 0 3px rgba(124,106,247,.15)'; }}
          onBlur={(e) => { e.target.style.borderColor = '#2e2e38'; e.target.style.boxShadow = 'none'; }}
        />
        <div style={{ display: 'flex', gap: 8, flex: isMobile ? 1 : 'none' }}>
          <select value={inputCol} onChange={(e) => setInputCol(e.target.value)} style={{ ...selectStyle, flex: isMobile ? 1 : 'none' }}
            onFocus={(e) => e.target.style.borderColor = '#7c6af7'} onBlur={(e) => e.target.style.borderColor = '#2e2e38'}>
            <option value="todo">📌 할 일</option>
            <option value="inProgress">⚡ 진행 중</option>
            <option value="review">👀 검토</option>
            <option value="done">✅ 완료</option>
          </select>
          <select value={inputPrio} onChange={(e) => setInputPrio(e.target.value)} style={{ ...selectStyle, flex: isMobile ? 1 : 'none' }}
            onFocus={(e) => e.target.style.borderColor = '#7c6af7'} onBlur={(e) => e.target.style.borderColor = '#2e2e38'}>
            <option value="medium">보통</option>
            <option value="high">🔴 높음</option>
            <option value="low">🟢 낮음</option>
          </select>
          <button onClick={handleAdd}
            style={{ background: '#7c6af7', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontSize: 20, padding: isMobile ? '0 14px' : '0 20px', transition: 'background .15s, transform .1s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#a78bfa'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#7c6af7'}
            onMouseDown={(e) => { e.preventDefault(); e.currentTarget.style.transform = 'scale(.95)'; }}
            onMouseUp={(e) => e.currentTarget.style.transform = 'none'}>
            +
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}
          style={{ ...SELECT_STYLE, padding: '8px 10px', fontSize: 12, flex: isMobile ? 1 : 'none' }}>
          <option value="all">👤 전체 담당자</option>
          {members.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          style={{ ...SELECT_STYLE, padding: '8px 10px', fontSize: 12, flex: isMobile ? 1 : 'none' }}>
          <option value="all">🎯 전체 우선순위</option>
          <option value="high">🔴 높음</option>
          <option value="medium">🟡 중간</option>
          <option value="low">🟢 낮음</option>
        </select>
      </div>

      {/* 칸반 컬럼 */}
      {isMobile ? (
        /* 모바일: 컬럼 세로 스택 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              title={col.title}
              colKey={col.colKey}
              cards={filteredCards.filter((c) => c.status === col.status)}
            />
          ))}
        </div>
      ) : (
        /* 태블릿/데스크탑: 그리드 or 가로 스크롤 */
        <div style={{
          display: isTablet ? 'flex' : 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          overflowX: isTablet ? 'auto' : undefined,
          gap: 12,
          alignItems: 'start',
          paddingBottom: isTablet ? 8 : 0,
        }}>
          {COLUMNS.map((col) => (
            <div key={col.status} style={{ minWidth: isTablet ? '44vw' : undefined }}>
              <KanbanColumn
                status={col.status}
                title={col.title}
                colKey={col.colKey}
                cards={filteredCards.filter((c) => c.status === col.status)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KanbanBoard;
