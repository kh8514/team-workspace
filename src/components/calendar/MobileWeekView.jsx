import { useState, useRef } from 'react';
import { PRIORITY_STYLE } from '../../constants/priority';
import { todayYMD } from '../../utils/date';

const DOW_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// useMemo polyfill (inline useMemo with deps)
function useMemo_(fn, deps) {
  const ref = useRef({ deps: null, value: null });
  const depsChanged = !ref.current.deps || deps.some((d, i) => d !== ref.current.deps[i]);
  if (depsChanged) {
    ref.current.deps = deps;
    ref.current.value = fn();
  }
  return ref.current.value;
}

function MobileWeekView({ todos, user, addTodo, shareTodoToKanban }) {
  const todayStr = todayYMD();
  const [weekOffset, setWeekOffset]       = useState(0);   // 0 = 이번 주
  const [selectedDay, setSelectedDay]     = useState(todayStr);
  const [showAdd, setShowAdd]             = useState(false);
  const [addText, setAddText]             = useState('');
  const [addPriority, setAddPriority]     = useState('medium');
  const [addToKanban, setAddToKanban]     = useState(false);
  const touchStartX = useRef(null);

  // 현재 주 시작(일요일) 계산
  const weekDays = useMemo_(() => {
    const base = new Date();
    const dow = base.getDay();
    base.setDate(base.getDate() - dow + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return {
        str: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        day: d.getDate(),
        dow: i,
        month: d.getMonth(),
        year: d.getFullYear(),
      };
    });
  }, [weekOffset]);

  // 선택된 날 투두
  const dayTodos = todos.filter((t) => {
    const s = t.startDate;
    const e = t.endDate;
    if (s && e) return selectedDay >= s && selectedDay <= e;
    if (s)      return selectedDay === s;
    if (e)      return selectedDay === e;
    return false;
  });

  const weekLabel = weekOffset === 0
    ? '이번 주'
    : weekOffset === -1 ? '지난 주'
    : weekOffset === 1  ? '다음 주'
    : (() => {
        const d = weekDays[0];
        return `${d.year}.${String(d.month + 1).padStart(2,'0')}.${String(d.day).padStart(2,'0')} ~`;
      })();

  const handleAdd = async () => {
    if (!addText.trim()) return;
    const newTodo = await addTodo(user.uid, addText.trim(), user, selectedDay, selectedDay, addPriority);
    if (addToKanban && newTodo) await shareTodoToKanban(user.uid, newTodo.id, newTodo, user);
    setAddText('');
    setAddPriority('medium');
    setAddToKanban(false);
    setShowAdd(false);
  };

  // 스와이프
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) setWeekOffset((o) => o + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  return (
    <div style={{ animation: 'fadeUp .35s ease' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* 주 헤더 */}
      <div style={{
        background: '#1a1a1f', border: '1.5px solid #2e2e38',
        borderRadius: 16, padding: '16px 16px 14px', marginBottom: 14,
      }}>
        {/* 네비게이션 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => setWeekOffset((o) => o - 1)}
            style={{ background: 'transparent', border: 'none', color: '#7a7a8e', cursor: 'pointer', fontSize: 20, padding: '0 8px' }}>
            ‹
          </button>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 15, fontWeight: 700, color: '#a78bfa' }}>
            {weekLabel}
          </div>
          <button onClick={() => setWeekOffset((o) => o + 1)}
            style={{ background: 'transparent', border: 'none', color: '#7a7a8e', cursor: 'pointer', fontSize: 20, padding: '0 8px' }}>
            ›
          </button>
        </div>

        {/* 요일 + 날짜 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {weekDays.map((d) => {
            const isToday    = d.str === todayStr;
            const isSelected = d.str === selectedDay;
            const isSun = d.dow === 0;
            const isSat = d.dow === 6;
            return (
              <button
                key={d.str}
                onClick={() => setSelectedDay(d.str)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0',
                }}
              >
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '.5px',
                  color: isSun ? '#f87171' : isSat ? '#60a5fa' : '#55556a',
                }}>
                  {DOW_LABELS[d.dow]}
                </span>
                <span style={{
                  fontFamily: 'Space Mono, monospace', fontSize: 15, fontWeight: 700,
                  width: 34, height: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSelected
                    ? (isToday ? '#7c6af7' : '#2e2e38')
                    : 'transparent',
                  color: isSelected
                    ? '#fff'
                    : isToday ? '#a78bfa'
                    : isSun ? '#f87171' : isSat ? '#60a5fa' : '#e8e8f0',
                  outline: isToday && !isSelected ? '2px solid rgba(124,106,247,.4)' : 'none',
                  outlineOffset: 1,
                  transition: 'all .15s',
                }}>
                  {String(d.day).padStart(2, '0')}
                </span>
                {/* 투두 있으면 점 표시 */}
                {(() => {
                  const cnt = todos.filter((t) => {
                    const s = t.startDate; const e = t.endDate;
                    if (s && e) return d.str >= s && d.str <= e;
                    if (s) return d.str === s;
                    if (e) return d.str === e;
                    return false;
                  }).length;
                  return cnt > 0 ? (
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#a78bfa' : '#55556a' }} />
                  ) : <span style={{ width: 4, height: 4 }} />;
                })()}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 날 투두 리스트 */}
      <div>
        {/* 날짜 + 추가 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
          <div style={{ fontSize: 13, color: '#7a7a8e', fontFamily: 'Space Mono, monospace' }}>
            {selectedDay}
            <span style={{ marginLeft: 8, fontSize: 11, color: '#55556a' }}>
              {dayTodos.length > 0 ? `${dayTodos.length}개` : ''}
            </span>
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            style={{
              background: showAdd ? '#2e2e38' : 'rgba(124,106,247,.15)',
              border: '1.5px solid rgba(124,106,247,.3)',
              borderRadius: 8, color: '#a78bfa', cursor: 'pointer',
              fontSize: 12, padding: '5px 12px',
              fontFamily: 'Noto Sans KR, sans-serif',
            }}
          >
            {showAdd ? '✕ 닫기' : '+ 추가'}
          </button>
        </div>

        {/* 추가 폼 */}
        {showAdd && (
          <div style={{
            background: '#1a1a1f', border: '1.5px solid #2e2e38',
            borderRadius: 12, padding: '14px', marginBottom: 12,
            animation: 'fadeUp .15s ease',
          }}>
            <input
              autoFocus
              type="text"
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="할 일 입력..."
              style={{
                width: '100%', background: '#23232b', border: '1.5px solid #2e2e38',
                borderRadius: 8, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif',
                fontSize: 14, padding: '10px 12px', outline: 'none', marginBottom: 10,
              }}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={addPriority} onChange={(e) => setAddPriority(e.target.value)}
                style={{ flex: 1, background: '#23232b', border: '1.5px solid #2e2e38', borderRadius: 8, color: '#e8e8f0', fontSize: 12, padding: '8px 10px', outline: 'none' }}>
                <option value="medium">🟡 보통</option>
                <option value="high">🔴 높음</option>
                <option value="low">🟢 낮음</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#7a7a8e', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={addToKanban} onChange={(e) => setAddToKanban(e.target.checked)} style={{ accentColor: '#7c6af7' }} />
                칸반에도
              </label>
              <button
                onClick={handleAdd}
                onMouseDown={(e) => e.preventDefault()}
                style={{ background: '#7c6af7', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, padding: '8px 16px', fontFamily: 'Noto Sans KR, sans-serif', fontWeight: 600 }}>
                추가
              </button>
            </div>
          </div>
        )}

        {/* 투두 목록 */}
        {dayTodos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#55556a', fontSize: 13 }}>
            이 날의 할 일이 없어요
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dayTodos.map((todo) => {
              const pc = PRIORITY_STYLE[todo.priority || 'medium'];
              return (
                <div key={todo.id} style={{
                  background: pc.bg,
                  border: `1.5px solid ${pc.border}`,
                  borderRadius: 14, padding: '14px 16px',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  opacity: todo.done ? 0.5 : 1,
                  animation: 'itemIn .2s ease',
                }}>
                  {/* 우선순위 바 */}
                  <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 99, background: pc.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 600, color: todo.done ? '#55556a' : '#e8e8f0',
                      textDecoration: todo.done ? 'line-through' : 'none',
                      marginBottom: 4, wordBreak: 'break-word',
                    }}>
                      {todo.text}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {(todo.startDate || todo.endDate) && (
                        <span style={{ fontSize: 11, color: '#7a7a8e', fontFamily: 'Space Mono, monospace' }}>
                          {todo.startDate || ''}{todo.endDate && todo.endDate !== todo.startDate ? ` ~ ${todo.endDate}` : ''}
                        </span>
                      )}
                      <span style={{ fontSize: 10, background: 'rgba(255,255,255,.06)', borderRadius: 4, padding: '1px 6px', color: pc.color, fontWeight: 700 }}>
                        {pc.label}
                      </span>
                      {todo.done && (
                        <span style={{ fontSize: 10, color: '#34d399' }}>✓ 완료</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 오늘로 이동 FAB (이번 주가 아닐 때) */}
      {weekOffset !== 0 && (
        <button
          onClick={() => { setWeekOffset(0); setSelectedDay(todayStr); }}
          style={{
            position: 'fixed', bottom: 24, right: 20,
            background: '#7c6af7', border: 'none', borderRadius: 99,
            color: '#fff', cursor: 'pointer', fontSize: 12,
            padding: '10px 18px', fontFamily: 'Noto Sans KR, sans-serif', fontWeight: 600,
            boxShadow: '0 4px 20px rgba(124,106,247,.5)',
            zIndex: 100,
          }}
        >
          오늘로
        </button>
      )}
    </div>
  );
}

export default MobileWeekView;
