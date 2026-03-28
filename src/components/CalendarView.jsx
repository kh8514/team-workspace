import { useState } from 'react';
import usePersonalStore from '../store/personalStore';
import useAuthStore from '../store/authStore';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { PRIORITY_EVENT_STYLE } from '../constants/priority';
import { todayYMD, ymd, getTodosForDate } from '../utils/date';
import MobileWeekView from './calendar/MobileWeekView';
import CalendarPopup from './calendar/CalendarPopup';

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

function CalendarView() {
  const { todos, addTodo, shareTodoToKanban, updateTodo, updateTodoDates, deleteTodo } = usePersonalStore();
  const { user } = useAuthStore();
  const { isMobile } = useBreakpoint();
  const today = todayYMD();
  const todayDate = new Date();

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth()); // 0-based

  const [popup, setPopup] = useState(null); // { dateStr }
  const [dateEditModal, setDateEditModal] = useState(null); // { id, text, startDate, endDate }

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
    setPopup({ dateStr });
  };

  const monthLabel = `${year}년 ${month + 1}월`;

  // 모바일은 주간 뷰
  if (isMobile) {
    return (
      <MobileWeekView
        todos={todos}
        user={user}
        addTodo={addTodo}
        shareTodoToKanban={shareTodoToKanban}
      />
    );
  }

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
      <div style={{ border: '1.5px solid #2e2e38', borderRadius: 12, overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', width: '100%' }}>
        {/* 요일 헤더 */}
        {DAYS_OF_WEEK.map((dow, i) => (
          <div key={dow} style={{
            background: '#23232b',
            padding: '10px 0',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: i === 0 ? '#f87171' : i === 6 ? '#60a5fa' : '#7a7a8e',
            borderRight: i < 6 ? '1px solid #2e2e38' : 'none',
            borderBottom: '1px solid #2e2e38',
            boxSizing: 'border-box',
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
          const isLastRow = idx >= cells.length - 7;

          return (
            <div
              key={idx}
              onClick={(e) => handleCellClick(e, cell)}
              style={{
                background: isToday ? '#1d1b2e' : cell.otherMonth ? '#181820' : '#1a1a1f',
                minHeight: 110,
                padding: '8px 7px 6px',
                cursor: 'pointer',
                transition: 'background .15s',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                borderRight: dow < 6 ? '1px solid #2e2e38' : 'none',
                borderBottom: isLastRow ? 'none' : '1px solid #2e2e38',
                boxSizing: 'border-box',
                minWidth: 0,
              }}
              onMouseEnter={(e) => { if (!isToday) e.currentTarget.style.background = '#1e1e25'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isToday ? '#1d1b2e' : cell.otherMonth ? '#181820' : '#1a1a1f'; }}
            >
              {/* 날짜 숫자 + 총 개수 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <div style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 12,
                  color: isToday ? '#fff' : cell.otherMonth ? 'rgba(122,122,142,.3)' : dow === 0 ? '#f87171' : dow === 6 ? '#60a5fa' : '#7a7a8e',
                  width: 24,
                  height: 24,
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
                        fontSize: 10,
                        padding: '2px 5px',
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
      </div>

      {/* 범례 */}
      <div style={{
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
      </div>

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
        <CalendarPopup
          popup={popup}
          todos={todos}
          user={user}
          addTodo={addTodo}
          shareTodoToKanban={shareTodoToKanban}
          updateTodo={updateTodo}
          updateTodoDates={updateTodoDates}
          deleteTodo={deleteTodo}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}

export default CalendarView;
