import { useState, useEffect } from 'react';
import useTeamStore from '../../store/teamStore';
import useAuthStore from '../../store/authStore';
import KanbanColumn from './KanbanColumn';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { COLORS, STYLE } from '../../constants/theme';
import { getTagColor } from '../../constants/tags';

const COLUMNS = [
  { status: 'todo',       title: '할 일',   colKey: 'todo' },
  { status: 'inProgress', title: '진행 중', colKey: 'doing' },
  { status: 'review',     title: '검토',    colKey: 'review' },
  { status: 'done',       title: '완료',    colKey: 'done' },
];

const VIEWS = [
  { key: 'my',   label: '내 할일' },
  { key: 'team', label: '팀 할일' },
];

function KanbanBoard() {
  const { user } = useAuthStore();
  const { isMobile, isTablet } = useBreakpoint();
  const {
    getFilteredCards, members,
    filterAssignee, filterPriority, filterTag,
    setFilterAssignee, setFilterPriority, setFilterTag,
    addCard,
  } = useTeamStore();

  const [view, setView] = useState('my');
  const [inputText, setInputText] = useState('');
  const [inputCol, setInputCol] = useState('todo');
  const [inputPrio, setInputPrio] = useState('medium');
  const [inputIsTeam, setInputIsTeam] = useState(false);
  const [inputAssigneeIds, setInputAssigneeIds] = useState([]);

  // 로그인 후 기본 담당자 = 본인
  useEffect(() => {
    if (user?.uid) setInputAssigneeIds([user.uid]);
  }, [user?.uid]);

  // 뷰 전환 시 담당자 필터 동기화 + 입력 isTeam 기본값 동기화
  useEffect(() => {
    if (view === 'my' && user?.uid) { setFilterAssignee(user.uid); setInputIsTeam(false); }
    else if (view === 'team') { setFilterAssignee('all'); setInputIsTeam(true); }
  }, [view, user?.uid]);

  const toggleInputAssignee = (uid) =>
    setInputAssigneeIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );

  const handleAdd = () => {
    if (!inputText.trim()) return;
    const assigneeIds = inputAssigneeIds.length ? inputAssigneeIds : [user.uid];
    addCard({
      title: inputText.trim(),
      status: inputCol,
      priority: inputPrio,
      authorId: user.uid,
      authorName: user.displayName,
      assigneeId: assigneeIds[0],
      assigneeIds,
      description: '',
      dueDate: '',
      isTeam: inputIsTeam,
    });
    setInputText('');
  };

  // 내 할일: isTeam 없는 카드 / 팀 할일: isTeam === true인 카드
  const filteredCards = getFilteredCards().filter(
    (c) => view === 'my' ? !c.isTeam : c.isTeam === true
  );
  const selectStyle = { ...STYLE.select, padding: isMobile ? '10px 8px' : '12px 10px', fontSize: isMobile ? 12 : 13 };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', animation: 'fadeUp .4s ease' }}>

      {/* 뷰 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: COLORS.bgCard, borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            style={{
              padding: '6px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'Noto Sans KR, sans-serif',
              transition: 'all .15s',
              background: view === v.key ? COLORS.accent : 'transparent',
              color: view === v.key ? '#fff' : COLORS.textSecondary,
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* 입력 영역 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          type="text" value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="새 카드 입력... (Enter)" maxLength={200}
          style={{
            ...STYLE.input, flex: 1, minWidth: isMobile ? '100%' : 180,
            fontSize: isMobile ? 14 : 15, padding: isMobile ? '10px 14px' : '12px 16px',
            borderRadius: 12, transition: 'border-color .2s, box-shadow .2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = COLORS.accent; e.target.style.boxShadow = '0 0 0 3px rgba(124,106,247,.15)'; }}
          onBlur={(e) => { e.target.style.borderColor = COLORS.border; e.target.style.boxShadow = 'none'; }}
        />
        <div style={{ display: 'flex', gap: 8, flex: isMobile ? 1 : 'none' }}>
          {/* 개인/팀 토글 */}
          <div style={{ display: 'flex', background: COLORS.bgCard, border: `1.5px solid ${COLORS.border}`, borderRadius: 8, padding: 2, flexShrink: 0 }}>
            {[{ v: false, label: '개인' }, { v: true, label: '팀' }].map(({ v, label }) => (
              <button key={label} onClick={() => setInputIsTeam(v)}
                style={{
                  padding: isMobile ? '6px 8px' : '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, fontFamily: 'Noto Sans KR, sans-serif', transition: 'all .15s',
                  background: inputIsTeam === v ? COLORS.accent : 'transparent',
                  color: inputIsTeam === v ? '#fff' : COLORS.textSecondary,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <select value={inputCol} onChange={(e) => setInputCol(e.target.value)}
            style={{ ...selectStyle, flex: isMobile ? 1 : 'none' }}
            onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
            onBlur={(e) => (e.target.style.borderColor = COLORS.border)}>
            <option value="todo">📌 할 일</option>
            <option value="inProgress">⚡ 진행 중</option>
            <option value="review">👀 검토</option>
            <option value="done">✅ 완료</option>
          </select>
          <select value={inputPrio} onChange={(e) => setInputPrio(e.target.value)}
            style={{ ...selectStyle, flex: isMobile ? 1 : 'none' }}
            onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
            onBlur={(e) => (e.target.style.borderColor = COLORS.border)}>
            <option value="medium">보통</option>
            <option value="high">🔴 높음</option>
            <option value="low">🟢 낮음</option>
          </select>
          <button onClick={handleAdd}
            style={{ ...STYLE.btnPrimary, fontSize: 20, padding: isMobile ? '0 14px' : '0 20px' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.accentLight)}
            onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.accent)}
            onMouseDown={(e) => { e.preventDefault(); e.currentTarget.style.transform = 'scale(.95)'; }}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}>
            +
          </button>
        </div>
      </div>

      {/* 담당자 선택 */}
      {members.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600, letterSpacing: '.3px' }}>담당자</span>
          {members.map((m) => {
            const selected = inputAssigneeIds.includes(m.uid);
            return (
              <button
                key={m.uid}
                onClick={() => toggleInputAssignee(m.uid)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 99, cursor: 'pointer',
                  fontSize: 12, fontFamily: 'Noto Sans KR, sans-serif',
                  border: `1.5px solid ${selected ? COLORS.accent : COLORS.border}`,
                  background: selected ? 'rgba(124,106,247,.15)' : COLORS.bgInput,
                  color: selected ? COLORS.accentLight : COLORS.textSecondary,
                  transition: 'all .15s',
                }}
              >
                {m.photoURL
                  ? <img src={m.photoURL} alt={m.name} style={{ width: 16, height: 16, borderRadius: '50%' }} />
                  : <div style={{ width: 16, height: 16, borderRadius: '50%', background: selected ? COLORS.accent : '#3e3e50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff' }}>{m.name?.[0]}</div>
                }
                {m.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 필터 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {/* 팀 전체 뷰에서만 담당자 필터 표시 */}
        {view === 'team' && (
          <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}
            style={{ ...STYLE.select, padding: '8px 10px', fontSize: 12, flex: isMobile ? 1 : 'none' }}>
            <option value="all">👤 전체 담당자</option>
            {members.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
          </select>
        )}
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          style={{ ...STYLE.select, padding: '8px 10px', fontSize: 12, flex: isMobile ? 1 : 'none' }}>
          <option value="all">🎯 전체 우선순위</option>
          <option value="high">🔴 높음</option>
          <option value="medium">🟡 중간</option>
          <option value="low">🟢 낮음</option>
        </select>

        {/* 활성 태그 필터 */}
        {filterTag && (() => {
          const tc = getTagColor(filterTag.color);
          return (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, padding: '5px 10px', borderRadius: 99,
              background: tc.bg, border: `1.5px solid ${tc.border}`, color: tc.color,
            }}>
              🏷 {filterTag.label}
              <button
                onClick={() => setFilterTag(null)}
                style={{ background: 'none', border: 'none', color: tc.color, cursor: 'pointer', padding: 0, fontSize: 15, lineHeight: 1, opacity: 0.8 }}
              >
                ×
              </button>
            </span>
          );
        })()}
      </div>

      {/* 칸반 컬럼 */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {COLUMNS.map((col) => (
            <KanbanColumn key={col.status} status={col.status} title={col.title} colKey={col.colKey}
              cards={filteredCards.filter((c) => c.status === col.status)} isMobile />
          ))}
        </div>
      ) : (
        <div style={{
          display: isTablet ? 'flex' : 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          overflowX: isTablet ? 'auto' : undefined,
          gap: 12, alignItems: 'start',
          paddingBottom: isTablet ? 8 : 0,
        }}>
          {COLUMNS.map((col) => (
            <div key={col.status} style={{ minWidth: isTablet ? '44vw' : undefined }}>
              <KanbanColumn status={col.status} title={col.title} colKey={col.colKey}
                cards={filteredCards.filter((c) => c.status === col.status)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KanbanBoard;
