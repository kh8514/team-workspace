import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import usePersonalStore from '../../store/personalStore';
import TodoItem from './TodoItem';

function PersonalTodo({ onSwitchToKanban }) {
  const { user } = useAuthStore();
  const {
    todos,
    addTodo, deleteTodo, updateTodoDates, archiveDoneTodos, shareTodoToKanban, cancelTodoShare,
  } = usePersonalStore();

  const [inputText, setInputText] = useState('');
  const [dateModal, setDateModal] = useState(null); // { todoId, startDate, endDate }

  const handleAdd = () => {
    if (!inputText.trim()) return;
    addTodo(user.uid, inputText.trim(), user);
    setInputText('');
  };

  const doneCount = todos.filter((t) => t.done).length;
  const total = todos.length;
  const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const filteredTodos = todos;

  const handleArchiveDone = async () => {
    if (!doneCount) return;
    if (window.confirm(`완료된 항목 ${doneCount}개를 삭제할까요?`)) {
      await archiveDoneTodos(user.uid);
    }
  };

  const openDateModal = (todo) => {
    setDateModal({
      todoId: todo.id,
      startDate: todo.startDate || '',
      endDate: todo.endDate || '',
    });
  };

  const handleDateSave = () => {
    if (!dateModal) return;
    updateTodoDates(user.uid, dateModal.todoId, dateModal.startDate || null, dateModal.endDate || null);
    setDateModal(null);
  };


  return (
    <div style={{ maxWidth: 620, margin: '0 auto', animation: 'fadeUp .4s ease' }}>

      {/* 통계 행 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 13, color: '#7a7a8e' }}>
        <span>
          {total === 0
            ? '할 일이 없어요'
            : <span>전체 <b style={{ color: '#a78bfa', fontWeight: 600 }}>{total}</b>개 · 완료 <b style={{ color: '#a78bfa', fontWeight: 600 }}>{doneCount}</b>개 · <b style={{ color: '#a78bfa', fontWeight: 600 }}>{progress}%</b></span>
          }
        </span>
        <div style={{ flex: 1, background: '#23232b', borderRadius: 99, height: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #7c6af7, #34d399)',
            borderRadius: 99,
            transition: 'width .4s cubic-bezier(.4,0,.2,1)',
            width: `${progress}%`,
          }} />
        </div>
      </div>

      {/* 입력창 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="새 할 일 입력... (Enter)"
          maxLength={200}
          style={{
            flex: 1,
            background: '#1a1a1f',
            border: '1.5px solid #2e2e38',
            borderRadius: 12,
            color: '#e8e8f0',
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: 15,
            padding: '12px 16px',
            outline: 'none',
            transition: 'border-color .2s, box-shadow .2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#7c6af7'; e.target.style.boxShadow = '0 0 0 3px rgba(124,106,247,.15)'; }}
          onBlur={(e) => { e.target.style.borderColor = '#2e2e38'; e.target.style.boxShadow = 'none'; }}
        />
        <button
          onClick={handleAdd}
          style={{
            background: '#7c6af7',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 20,
            fontWeight: 700,
            padding: '0 20px',
            transition: 'background .15s, transform .1s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#a78bfa'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#7c6af7'}
          onMouseDown={(e) => { e.preventDefault(); e.currentTarget.style.transform = 'scale(.95)'; }}
          onMouseUp={(e) => e.currentTarget.style.transform = 'none'}
        >
          +
        </button>
      </div>

      {/* 투두 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredTodos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#7a7a8e' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
            <div style={{ fontSize: 14 }}>할 일을 추가해보세요</div>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onOpenDateModal={openDateModal}
              onSwitchToKanban={onSwitchToKanban}
              onShareToKanban={(t) => shareTodoToKanban(user.uid, t.id, t, user)}
              onCancelShare={(t) => cancelTodoShare(user.uid, t.id, t.syncId)}
            />
          ))
        )}
      </div>

      {/* 푸터 */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleArchiveDone}
          style={{
            background: 'transparent',
            border: '1.5px solid #2e2e38',
            borderRadius: 99,
            color: '#7a7a8e',
            cursor: 'pointer',
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: 12,
            padding: '5px 14px',
            transition: 'all .15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; }}
        >
          완료 항목 삭제
        </button>
      </div>

      {/* 날짜 범위 모달 */}
      {dateModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => e.target === e.currentTarget && setDateModal(null)}
        >
          <div style={{
            background: '#1a1a1f',
            border: '1.5px solid #2e2e38',
            borderRadius: 16,
            padding: 24,
            width: 340,
            maxWidth: '90vw',
            animation: 'modalIn .2s ease',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e8f0', marginBottom: 18 }}>기간 설정</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#7a7a8e', marginBottom: 6, fontWeight: 500 }}>시작일</label>
              <input
                type="date"
                value={dateModal.startDate}
                onChange={(e) => setDateModal((p) => ({ ...p, startDate: e.target.value }))}
                style={{
                  width: '100%', background: '#23232b', border: '1.5px solid #2e2e38',
                  borderRadius: 8, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif',
                  fontSize: 14, padding: '9px 12px', outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#7a7a8e', marginBottom: 6, fontWeight: 500 }}>마감일</label>
              <input
                type="date"
                value={dateModal.endDate}
                onChange={(e) => setDateModal((p) => ({ ...p, endDate: e.target.value }))}
                style={{
                  width: '100%', background: '#23232b', border: '1.5px solid #2e2e38',
                  borderRadius: 8, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif',
                  fontSize: 14, padding: '9px 12px', outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateTodoDates(user.uid, dateModal.todoId, null, null); setDateModal(null); }}
                style={{ flex: 1, background: 'rgba(248,113,113,.15)', border: 'none', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, fontWeight: 500, padding: 10 }}
              >
                기간 삭제
              </button>
              <button
                onClick={() => setDateModal(null)}
                style={{ flex: 1, background: '#23232b', border: 'none', borderRadius: 8, color: '#7a7a8e', cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, fontWeight: 500, padding: 10 }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#e8e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#7a7a8e'}
              >
                취소
              </button>
              <button
                onClick={handleDateSave}
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
    </div>
  );
}

export default PersonalTodo;
