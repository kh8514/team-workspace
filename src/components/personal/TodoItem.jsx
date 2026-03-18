import { useState } from 'react';
import { Trash2, Pencil, Check, X, Calendar } from 'lucide-react';
import usePersonalStore from '../../store/personalStore';
import useAuthStore from '../../store/authStore';

// 날짜 유틸
const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fmtDate = (s) => {
  if (!s) return '';
  const [, m, d] = s.split('-');
  return `${m}.${d}`;
};
const dateStatus = (startDate, endDate) => {
  const today = todayYMD();
  const ref = endDate || startDate;
  if (!ref) return null;
  if (ref < today) return 'overdue';
  if (ref === today) return 'today';
  return 'upcoming';
};
const dateRangeLabel = (startDate, endDate) => {
  if (!startDate && !endDate) return null;
  if (startDate && endDate)
    return startDate === endDate ? fmtDate(startDate) : `${fmtDate(startDate)} ~ ${fmtDate(endDate)}`;
  if (startDate) return `${fmtDate(startDate)} ~`;
  return `~ ${fmtDate(endDate)}`;
};

const PRIORITY = {
  high:   { label: '높음', bg: 'rgba(248,113,113,.15)', color: '#f87171',  border: 'rgba(248,113,113,.3)' },
  medium: { label: '보통', bg: 'rgba(124,106,247,.15)', color: '#a78bfa',  border: 'rgba(124,106,247,.3)' },
  low:    { label: '낮음', bg: 'rgba(52,211,153,.12)',  color: '#34d399',  border: 'rgba(52,211,153,.3)'  },
};
const PRIORITY_CYCLE = ['high', 'medium', 'low'];

const DATE_STATUS_STYLE = {
  overdue:  { color: '#f87171', border: 'rgba(248,113,113,.3)', bg: 'rgba(248,113,113,.08)' },
  today:    { color: '#fbbf24', border: 'rgba(251,191,36,.3)',  bg: 'rgba(251,191,36,.08)'  },
  upcoming: { color: '#34d399', border: 'rgba(52,211,153,.3)',  bg: 'rgba(52,211,153,.08)'  },
};

function TodoItem({ todo, onOpenDateModal, onSwitchToKanban, onShareToKanban, onCancelShare }) {
  const { user } = useAuthStore();
  const { toggleTodo, deleteTodo, updateTodo, updateTodoPriority } = usePersonalStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [removing, setRemoving] = useState(false);

  const handleUpdate = () => {
    if (!editText.trim()) return;
    updateTodo(user.uid, todo.id, editText.trim());
    setIsEditing(false);
  };

  const handleDelete = () => {
    setRemoving(true);
    setTimeout(() => deleteTodo(user.uid, todo.id, todo.syncId), 180);
  };

  const handlePriorityCycle = () => {
    const current = todo.priority || 'medium';
    const next = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(current) + 1) % PRIORITY_CYCLE.length];
    updateTodoPriority(user.uid, todo.id, next);
  };

  const drLabel = dateRangeLabel(todo.startDate, todo.endDate);
  const drStatus = dateStatus(todo.startDate, todo.endDate);
  const priority = todo.priority || 'medium';
  const pc = PRIORITY[priority];
  const ds = drStatus ? DATE_STATUS_STYLE[drStatus] : null;

  return (
    <div
      className="group flex items-center gap-2.5 p-3 rounded-xl border transition-all"
      style={{
        background: todo.done ? '#1e1e24' : '#1a1a1f',
        borderColor: '#2e2e38',
        opacity: removing ? 0 : 1,
        transform: removing ? 'translateX(20px)' : 'none',
        transition: removing ? 'opacity .18s, transform .18s' : 'border-color .2s, opacity .2s',
      }}
      onMouseEnter={(e) => !todo.done && (e.currentTarget.style.borderColor = '#3e3e50')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2e2e38')}
    >
      {/* 체크박스 */}
      <button
        onClick={() => toggleTodo(user.uid, todo.id, todo.done, todo.syncId)}
        className="flex-shrink-0 flex items-center justify-center transition-all"
        style={{
          width: 22, height: 22,
          borderRadius: 6,
          border: todo.done ? 'none' : '2px solid #2e2e38',
          background: todo.done ? '#34d399' : 'transparent',
          color: todo.done ? '#0f0f11' : 'transparent',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => !todo.done && (e.currentTarget.style.borderColor = '#7c6af7')}
        onMouseLeave={(e) => !todo.done && (e.currentTarget.style.borderColor = '#2e2e38')}
      >
        {todo.done && <Check size={12} />}
      </button>

      {/* 텍스트 or 수정 입력 */}
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdate();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="flex-1 rounded-lg px-2 py-1 text-sm focus:outline-none"
            style={{
              background: '#23232b',
              border: '1.5px solid rgba(124,106,247,.5)',
              color: '#e8e8f0',
            }}
            autoFocus
          />
          <button onClick={handleUpdate} style={{ color: '#7c6af7', cursor: 'pointer', background: 'none', border: 'none' }}>
            <Check size={15} />
          </button>
          <button onClick={() => setIsEditing(false)} style={{ color: '#7a7a8e', cursor: 'pointer', background: 'none', border: 'none' }}>
            <X size={15} />
          </button>
        </div>
      ) : (
        <span
          className="flex-1 text-sm leading-snug break-all"
          style={{
            color: todo.done ? '#55556a' : '#e8e8f0',
            textDecoration: todo.done ? 'line-through' : 'none',
            textDecorationColor: '#55556a',
          }}
        >
          {todo.text}
        </span>
      )}

      {/* 날짜 배지 */}
      {!isEditing && (
        drLabel ? (
          <button
            onClick={() => onOpenDateModal(todo)}
            className="text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap flex-shrink-0 border transition"
            style={ds
              ? { color: ds.color, borderColor: ds.border, background: ds.bg }
              : { color: '#7a7a8e', borderColor: '#2e2e38', background: '#23232b' }
            }
          >
            📅 {drLabel}
          </button>
        ) : (
          <button
            onClick={() => onOpenDateModal(todo)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="기간 설정"
            style={{ color: '#7a7a8e', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#a78bfa')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#7a7a8e')}
          >
            <Calendar size={14} />
          </button>
        )
      )}

      {/* 우선순위 배지 */}
      {!isEditing && (
        <button
          onClick={handlePriorityCycle}
          className="text-[10px] font-bold rounded px-1.5 py-0.5 flex-shrink-0 border transition"
          style={{ background: pc.bg, color: pc.color, borderColor: pc.border, cursor: 'pointer' }}
          title="우선순위 변경 (클릭)"
        >
          {pc.label}
        </button>
      )}

      {/* 공유 / 공유취소 버튼 */}
      {!isEditing && (
        todo.syncId ? (
          <button
            onClick={() => onCancelShare(todo)}
            className="flex-shrink-0 text-[11px] whitespace-nowrap"
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(248,113,113,.35)',
              borderRadius: 6,
              color: '#f87171',
              cursor: 'pointer',
              padding: '3px 7px',
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(248,113,113,.35)'; e.currentTarget.style.background = 'transparent'; }}
          >
            공유취소
          </button>
        ) : (
          <button
            onClick={() => onShareToKanban(todo)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-[11px] whitespace-nowrap"
            style={{
              background: 'transparent',
              border: '1.5px solid #2e2e38',
              borderRadius: 6,
              color: '#7a7a8e',
              cursor: 'pointer',
              padding: '3px 7px',
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c6af7'; e.currentTarget.style.color = '#7c6af7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; }}
          >
            공유
          </button>
        )
      )}

      {/* 액션 버튼 (hover 시 표시) */}
      {!isEditing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setIsEditing(true); setEditText(todo.text); }}
            className="rounded-md p-1 transition"
            style={{ color: '#7a7a8e', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.background = '#23232b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#7a7a8e'; e.currentTarget.style.background = 'none'; }}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md p-1 transition"
            style={{ color: '#7a7a8e', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#7a7a8e'; e.currentTarget.style.background = 'none'; }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

export default TodoItem;
