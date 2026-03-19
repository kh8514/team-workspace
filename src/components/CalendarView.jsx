import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import usePersonalStore from '../store/personalStore';
import useAuthStore from '../store/authStore';
import { useBreakpoint } from '../hooks/useBreakpoint';

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

const PRIORITY_EVENT_STYLE = {
  high:   { bg: 'rgba(248,113,113,.25)', color: '#f87171' },
  medium: { bg: 'rgba(124,106,247,.25)', color: '#a78bfa' },
  low:    { bg: 'rgba(52,211,153,.2)',   color: '#34d399' },
};

const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const ymd = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// Get todos that appear on a given date (by startDate/endDate range, or just startDate)
const getTodosForDate = (todos, dateStr) => {
  return todos.filter((t) => {
    const s = t.startDate;
    const e = t.endDate;
    if (s && e) return dateStr >= s && dateStr <= e;
    if (s && !e) return dateStr === s;
    if (!s && e) return dateStr === e;
    return false;
  });
};

function CalendarView() {
  const { todos, addTodo, shareTodoToKanban, updateTodo, updateTodoDates, deleteTodo } = usePersonalStore();
  const { user } = useAuthStore();
  const { isMobile } = useBreakpoint();
  const today = todayYMD();
  const todayDate = new Date();

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth()); // 0-based

  const [popup, setPopup] = useState(null); // { dateStr }
  const [showAddForm, setShowAddForm] = useState(false);
  const [addText, setAddText] = useState('');
  const [addStart, setAddStart] = useState('');
  const [addEnd, setAddEnd] = useState('');
  const [addPriority, setAddPriority] = useState('medium');
  const [addToKanban, setAddToKanban] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null); // { id, text, startDate, endDate }
  const [hoveredTodoId, setHoveredTodoId] = useState(null);
  const [dateEditModal, setDateEditModal] = useState(null); // { id, text, startDate, endDate }
  const popupRef = useRef(null);

  // Close popup on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopup(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(todayDate.getFullYear()); setMonth(todayDate.getMonth()); };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  // Prev month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, month: month - 1, year: month === 0 ? year - 1 : year, otherMonth: true });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, year, otherMonth: false });
  }
  // Next month padding
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, month: month + 1, year: month === 11 ? year + 1 : year, otherMonth: true });
  }

  const handleCellClick = (e, cell) => {
    const dateStr = ymd(cell.year, cell.month, cell.day);
    const rect = e.currentTarget.getBoundingClientRect();
    // Position popup
    let px = rect.left;
    let py = rect.bottom + 6;
    // Clamp to viewport
    const pw = 320;
    const ph = 380;
    if (px + pw > window.innerWidth - 8) px = window.innerWidth - pw - 8;
    if (py + ph > window.innerHeight - 8) py = rect.top - ph - 6;
    if (px < 8) px = 8;
    if (py < 8) py = 8;

    setPopup({ dateStr });
    setAddStart(dateStr);
    setAddEnd(dateStr);
    setAddText('');
    setAddPriority('medium');
    setAddToKanban(false);
    setShowAddForm(false);
    setEditingTodo(null);
  };

  const handleAddSubmit = async () => {
    if (!addText.trim()) return;
    const newTodo = await addTodo(user.uid, addText.trim(), user, addStart || null, addEnd || null, addPriority);
    if (addToKanban && newTodo) {
      await shareTodoToKanban(user.uid, newTodo.id, newTodo, user);
    }
    setPopup(null);
    setAddText('');
  };

  const monthLabel = `${year}년 ${month + 1}월`;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', animation: 'fadeUp .4s ease' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={prevMonth}
          style={{ background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 8, color: '#7a7a8e', cursor: 'pointer', fontSize: 16, padding: '6px 14px', transition: 'all .15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c6af7'; e.currentTarget.style.color = '#a78bfa'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; }}
        >
          ‹
        </button>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 18, fontWeight: 700, color: '#a78bfa', flex: 1, textAlign: 'center' }}>
          {monthLabel}
        </div>
        <button
          onClick={nextMonth}
          style={{ background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 8, color: '#7a7a8e', cursor: 'pointer', fontSize: 16, padding: '6px 14px', transition: 'all .15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c6af7'; e.currentTarget.style.color = '#a78bfa'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; }}
        >
          ›
        </button>
        <button
          onClick={goToday}
          style={{ background: 'transparent', border: '1.5px solid #2e2e38', borderRadius: 8, color: '#7a7a8e', cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 12, padding: '6px 14px', transition: 'all .15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c6af7'; e.currentTarget.style.color = '#a78bfa'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; }}
        >
          오늘
        </button>
      </div>

      {/* 캘린더 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: '#2e2e38', borderRadius: 12, overflow: 'hidden' }}>
        {/* 요일 헤더 */}
        {DAYS_OF_WEEK.map((dow, i) => (
          <div key={dow} style={{
            background: '#23232b',
            padding: '10px 0',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: i === 0 ? '#f87171' : i === 6 ? '#60a5fa' : '#7a7a8e',
          }}>
            {dow}
          </div>
        ))}

        {/* 날짜 셀 */}
        {cells.map((cell, idx) => {
          const dateStr = ymd(cell.year, cell.month, cell.day);
          const cellTodos = getTodosForDate(todos, dateStr);
          const isToday = dateStr === today;
          const dow = idx % 7;

          return (
            <div
              key={idx}
              onClick={(e) => handleCellClick(e, cell)}
              style={{
                background: isToday ? '#1d1b2e' : cell.otherMonth ? '#181820' : '#1a1a1f',
                minHeight: isMobile ? 60 : 110,
                padding: isMobile ? '5px 4px 4px' : '8px 7px 6px',
                cursor: 'pointer',
                transition: 'background .15s',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
              onMouseEnter={(e) => { if (!isToday) e.currentTarget.style.background = '#1e1e25'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isToday ? '#1d1b2e' : cell.otherMonth ? '#181820' : '#1a1a1f'; }}
            >
              {/* 날짜 숫자 + 총 개수 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <div style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: isMobile ? 10 : 12,
                  color: isToday ? '#fff' : cell.otherMonth ? 'rgba(122,122,142,.3)' : dow === 0 ? '#f87171' : dow === 6 ? '#60a5fa' : '#7a7a8e',
                  width: isMobile ? 18 : 24,
                  height: isMobile ? 18 : 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  ...(isToday ? { background: '#7c6af7', borderRadius: '50%' } : {}),
                }}>
                  {cell.day}
                </div>
                {cellTodos.length >= 5 && (
                  <div style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#a78bfa',
                    background: 'rgba(124,106,247,.18)',
                    border: '1px solid rgba(124,106,247,.35)',
                    borderRadius: 99,
                    padding: '1px 5px',
                    flexShrink: 0,
                  }}>
                    {cellTodos.length}
                  </div>
                )}
              </div>

              {/* 이벤트 — 스크롤 가능 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: 72, flex: 1 }}>
                {cellTodos.map((todo) => {
                  const ps = PRIORITY_EVENT_STYLE[todo.priority] || PRIORITY_EVENT_STYLE.medium;
                  return (
                    <div
                      key={todo.id}
                      onClick={(e) => { e.stopPropagation(); setDateEditModal({ id: todo.id, text: todo.text, startDate: todo.startDate || '', endDate: todo.endDate || '' }); }}
                      style={{
                        borderRadius: 3,
                        fontSize: isMobile ? 8 : 10,
                        padding: isMobile ? '1px 3px' : '2px 5px',
                        lineHeight: 1.3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        background: ps.bg,
                        color: ps.color,
                        flexShrink: 0,
                        opacity: todo.done ? 0.45 : 1,
                        textDecoration: todo.done ? 'line-through' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {todo.text}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      {!isMobile && <div style={{
        display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 16,
        padding: '12px 16px', background: '#1a1a1f', border: '1.5px solid #2e2e38',
        borderRadius: 10, fontSize: 12, color: '#7a7a8e',
      }}>
        {[
          { bg: 'rgba(248,113,113,.5)', label: '높음 우선순위' },
          { bg: 'rgba(124,106,247,.5)', label: '보통 우선순위' },
          { bg: 'rgba(52,211,153,.4)',  label: '낮음 우선순위' },
          { bg: '#23232b', label: '완료됨', border: '1px solid #2e2e38' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.bg, border: item.border }} />
            {item.label}
          </div>
        ))}
      </div>}

      {/* 날짜 클릭 팝업 — CardDetail 스타일 */}
      {/* 날짜 변경 모달 */}
      {dateEditModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setDateEditModal(null)}
        >
          <div style={{ background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 16, padding: 24, width: 340, maxWidth: '90vw', animation: 'modalIn .2s ease' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e8f0', marginBottom: 4 }}>기간 변경</div>
            <div style={{ fontSize: 12, color: '#7a7a8e', marginBottom: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dateEditModal.text}</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#7a7a8e', fontWeight: 600, marginBottom: 6, letterSpacing: '.3px' }}>시작일</label>
              <input
                type="date"
                value={dateEditModal.startDate}
                onChange={(e) => setDateEditModal((p) => ({ ...p, startDate: e.target.value }))}
                style={{ width: '100%', background: '#23232b', border: '1.5px solid #2e2e38', borderRadius: 8, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, padding: '9px 12px', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#7a7a8e', fontWeight: 600, marginBottom: 6, letterSpacing: '.3px' }}>종료일</label>
              <input
                type="date"
                value={dateEditModal.endDate}
                onChange={(e) => setDateEditModal((p) => ({ ...p, endDate: e.target.value }))}
                style={{ width: '100%', background: '#23232b', border: '1.5px solid #2e2e38', borderRadius: 8, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, padding: '9px 12px', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateTodoDates(user.uid, dateEditModal.id, null, null); setDateEditModal(null); }}
                style={{ flex: 1, background: 'rgba(248,113,113,.15)', border: 'none', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, fontWeight: 500, padding: 10 }}
              >
                기간 삭제
              </button>
              <button
                onClick={() => setDateEditModal(null)}
                style={{ flex: 1, background: '#23232b', border: 'none', borderRadius: 8, color: '#7a7a8e', cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, fontWeight: 500, padding: 10 }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#e8e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#7a7a8e'}
              >
                취소
              </button>
              <button
                onClick={() => { updateTodoDates(user.uid, dateEditModal.id, dateEditModal.startDate || null, dateEditModal.endDate || null); setDateEditModal(null); }}
                style={{ flex: 1, background: '#7c6af7', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, fontWeight: 500, padding: 10 }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#a78bfa'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#7c6af7'}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {popup && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setPopup(null); setShowAddForm(false); } }}
        >
          <div
            ref={popupRef}
            style={{
              background: '#1a1a1f',
              border: '1.5px solid #2e2e38',
              borderRadius: 16,
              width: '100%',
              maxWidth: 480,
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'modalIn .2s ease',
            }}
          >
            {/* 헤더 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1.5px solid #2e2e38',
            }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>
                {popup.dateStr}
              </span>
              <button
                onClick={() => { setPopup(null); setShowAddForm(false); }}
                style={{ background: 'none', border: 'none', color: '#7a7a8e', cursor: 'pointer', padding: 4, borderRadius: 6, fontSize: 18, lineHeight: 1, transition: 'color .15s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#e8e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#7a7a8e'}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {/* 해당 날짜 투두 목록 */}
              {(() => {
                const dayTodos = getTodosForDate(todos, popup.dateStr);
                return dayTodos.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#3e3e50', textAlign: 'center', padding: '12px 0 16px' }}>
                    이 날의 할 일이 없어요
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16, maxHeight: 210, overflowY: 'auto', paddingRight: 2 }}>
                    {dayTodos.map((todo) => {
                      const ps = PRIORITY_EVENT_STYLE[todo.priority] || PRIORITY_EVENT_STYLE.medium;
                      const isEditing = editingTodo?.id === todo.id;
                      return (
                        <div key={todo.id} style={{ background: '#23232b', borderRadius: 8, overflow: 'hidden' }}>
                          {isEditing ? (
                            /* 인라인 수정 폼 */
                            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <input
                                type="text"
                                value={editingTodo.text}
                                onChange={(e) => setEditingTodo((p) => ({ ...p, text: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateTodo(user.uid, todo.id, editingTodo.text);
                                    updateTodoDates(user.uid, todo.id, editingTodo.startDate || null, editingTodo.endDate || null);
                                    setEditingTodo(null);
                                  }
                                  if (e.key === 'Escape') setEditingTodo(null);
                                }}
                                autoFocus
                                style={{ width: '100%', background: '#1a1a1f', border: '1.5px solid #7c6af7', borderRadius: 6, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 13, padding: '6px 10px', outline: 'none' }}
                              />
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                <input
                                  type="date"
                                  value={editingTodo.startDate}
                                  onChange={(e) => setEditingTodo((p) => ({ ...p, startDate: e.target.value }))}
                                  style={{ background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 6, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 11, padding: '5px 8px', outline: 'none' }}
                                  onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                                  onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
                                />
                                <input
                                  type="date"
                                  value={editingTodo.endDate}
                                  onChange={(e) => setEditingTodo((p) => ({ ...p, endDate: e.target.value }))}
                                  style={{ background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 6, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 11, padding: '5px 8px', outline: 'none' }}
                                  onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                                  onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    updateTodo(user.uid, todo.id, editingTodo.text);
                                    updateTodoDates(user.uid, todo.id, editingTodo.startDate || null, editingTodo.endDate || null);
                                    setEditingTodo(null);
                                  }}
                                  style={{ background: '#7c6af7', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12, padding: '5px 12px', fontFamily: 'Noto Sans KR, sans-serif' }}
                                >
                                  저장
                                </button>
                                <button
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => setEditingTodo(null)}
                                  style={{ background: '#2e2e38', border: 'none', borderRadius: 6, color: '#7a7a8e', cursor: 'pointer', fontSize: 12, padding: '5px 12px', fontFamily: 'Noto Sans KR, sans-serif' }}
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* 일반 표시 */
                            <div
                              onMouseEnter={() => setHoveredTodoId(todo.id)}
                              onMouseLeave={() => setHoveredTodoId(null)}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, opacity: todo.done ? 0.5 : 1 }}
                            >
                              <div style={{ width: 8, height: 8, borderRadius: 2, background: ps.color, opacity: 0.8, flexShrink: 0 }} />
                              <span style={{ flex: 1, color: todo.done ? '#7a7a8e' : '#e8e8f0', textDecoration: todo.done ? 'line-through' : 'none', wordBreak: 'break-all' }}>
                                {todo.text}
                              </span>
                              <div style={{ display: 'flex', gap: 2, opacity: hoveredTodoId === todo.id ? 1 : 0, transition: 'opacity .15s' }}>
                                <button
                                  onClick={() => setEditingTodo({ id: todo.id, text: todo.text, startDate: todo.startDate || '', endDate: todo.endDate || '' })}
                                  style={{ background: 'none', border: 'none', color: '#7a7a8e', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color .15s' }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#a78bfa'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = '#7a7a8e'}
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => deleteTodo(user.uid, todo.id, todo.syncId)}
                                  style={{ background: 'none', border: 'none', color: '#7a7a8e', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color .15s' }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = '#7a7a8e'}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* 추가 폼 — 수정 중일 때 숨김 */}
              {!editingTodo && <div style={{ borderTop: '1.5px solid #2e2e38', paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm((v) => !v)}
                  style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: '#a78bfa', cursor: 'pointer', padding: 0, marginBottom: showAddForm ? 14 : 0, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Noto Sans KR, sans-serif' }}
                >
                  <span style={{ fontSize: 14 }}>{showAddForm ? '▲' : '▼'}</span>
                  이 날에 추가하기
                </button>
                {showAddForm && <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14, animation: 'fadeUp .18s ease' }}>
                  {/* 제목 */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#7a7a8e', fontWeight: 600, marginBottom: 6, letterSpacing: '.3px' }}>제목</label>
                    <input
                      type="text"
                      value={addText}
                      onChange={(e) => setAddText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubmit()}
                      placeholder="할 일 입력..."
                      autoFocus
                      style={{
                        width: '100%', background: '#23232b', border: '1.5px solid #2e2e38',
                        borderRadius: 8, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif',
                        fontSize: 13, padding: '9px 12px', outline: 'none', transition: 'border-color .2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                      onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
                    />
                  </div>

                  {/* 날짜 + 우선순위 그리드 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#7a7a8e', fontWeight: 600, marginBottom: 6, letterSpacing: '.3px' }}>시작일</label>
                      <input
                        type="date"
                        value={addStart}
                        onChange={(e) => setAddStart(e.target.value)}
                        style={{
                          width: '100%', background: '#23232b', border: '1.5px solid #2e2e38',
                          borderRadius: 8, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif',
                          fontSize: 13, padding: '9px 12px', outline: 'none', transition: 'border-color .2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                        onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#7a7a8e', fontWeight: 600, marginBottom: 6, letterSpacing: '.3px' }}>종료일</label>
                      <input
                        type="date"
                        value={addEnd}
                        onChange={(e) => setAddEnd(e.target.value)}
                        style={{
                          width: '100%', background: '#23232b', border: '1.5px solid #2e2e38',
                          borderRadius: 8, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif',
                          fontSize: 13, padding: '9px 12px', outline: 'none', transition: 'border-color .2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                        onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 11, color: '#7a7a8e', fontWeight: 600, marginBottom: 6, letterSpacing: '.3px' }}>우선순위</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[
                          { key: 'high',   label: '🔴 높음', bg: 'rgba(248,113,113,.18)', color: '#f87171', border: 'rgba(248,113,113,.4)' },
                          { key: 'medium', label: '🟡 보통', bg: 'rgba(124,106,247,.18)', color: '#a78bfa', border: 'rgba(124,106,247,.4)' },
                          { key: 'low',    label: '🟢 낮음', bg: 'rgba(52,211,153,.15)',  color: '#34d399', border: 'rgba(52,211,153,.4)'  },
                        ].map((p) => {
                          const active = addPriority === p.key;
                          return (
                            <button
                              key={p.key}
                              type="button"
                              onClick={() => setAddPriority(p.key)}
                              style={{
                                flex: 1,
                                background: active ? p.bg : '#23232b',
                                border: `1.5px solid ${active ? p.border : '#2e2e38'}`,
                                borderRadius: 8, color: active ? p.color : '#7a7a8e',
                                cursor: 'pointer', fontSize: 12, padding: '8px 0',
                                fontFamily: 'Noto Sans KR, sans-serif', transition: 'all .13s',
                              }}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 칸반 공유 옵션 */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={addToKanban}
                      onChange={(e) => setAddToKanban(e.target.checked)}
                      style={{ width: 14, height: 14, accentColor: '#7c6af7', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 12, color: addToKanban ? '#a78bfa' : '#7a7a8e', transition: 'color .15s' }}>
                      칸반에도 추가
                    </span>
                  </label>

                  {/* 추가 버튼 */}
                  <button
                    type="button"
                    onClick={handleAddSubmit}
                    onMouseDown={(e) => e.preventDefault()}
                    style={{
                      width: '100%', background: '#7c6af7', border: 'none', borderRadius: 8,
                      color: '#fff', cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif',
                      fontSize: 14, fontWeight: 500, padding: '10px', transition: 'background .15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#a78bfa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#7c6af7'}
                  >
                    추가
                  </button>
                </div>}
              </div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;
