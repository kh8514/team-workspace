import { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { PRIORITY_EVENT_STYLE } from '../../constants/priority';
import { getTodosForDate } from '../../utils/date';

function CalendarPopup({
  popup,
  todos,
  user,
  addTodo,
  shareTodoToKanban,
  updateTodo,
  updateTodoDates,
  deleteTodo,
  onClose,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addText, setAddText] = useState('');
  const [addStart, setAddStart] = useState(popup.dateStr);
  const [addEnd, setAddEnd] = useState(popup.dateStr);
  const [addPriority, setAddPriority] = useState('medium');
  const [addToKanban, setAddToKanban] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [hoveredTodoId, setHoveredTodoId] = useState(null);
  const popupRef = useRef(null);

  // Close popup on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleAddSubmit = async () => {
    if (!addText.trim()) return;
    const newTodo = await addTodo(user.uid, addText.trim(), user, addStart || null, addEnd || null, addPriority);
    if (addToKanban && newTodo) {
      await shareTodoToKanban(user.uid, newTodo.id, newTodo, user);
    }
    onClose();
    setAddText('');
  };

  const dayTodos = getTodosForDate(todos, popup.dateStr);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}
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
            onClick={() => { onClose(); }}
            style={{ background: 'none', border: 'none', color: '#7a7a8e', cursor: 'pointer', padding: 4, borderRadius: 6, fontSize: 18, lineHeight: 1, transition: 'color .15s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#e8e8f0'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#7a7a8e'}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* 해당 날짜 투두 목록 */}
          {dayTodos.length === 0 ? (
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
          )}

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
  );
}

export default CalendarPopup;
