import { useState } from 'react';
import { Trash2, Pencil, Check, X, Calendar } from 'lucide-react';
import usePersonalStore from '../../store/personalStore';
import useAuthStore from '../../store/authStore';
import { PRIORITY_STYLE, PRIORITY_CYCLE } from '../../constants/priority';
import { COLORS, DATE_STATUS_STYLE } from '../../constants/theme';
import { dateRangeLabel, dateStatus } from '../../utils/date';

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
  const pc = PRIORITY_STYLE[priority];
  const ds = drStatus ? DATE_STATUS_STYLE[drStatus] : null;

  return (
    <div
      className="group flex items-center gap-2.5 p-3 rounded-xl border transition-all"
      style={{
        background: todo.done ? '#1e1e24' : COLORS.bgCard,
        borderColor: COLORS.border,
        opacity: removing ? 0 : 1,
        transform: removing ? 'translateX(20px)' : 'none',
        transition: removing ? 'opacity .18s, transform .18s' : 'border-color .2s, opacity .2s',
      }}
      onMouseEnter={(e) => !todo.done && (e.currentTarget.style.borderColor = COLORS.borderHover)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = COLORS.border)}
    >
      {/* 체크박스 */}
      <button
        onClick={() => toggleTodo(user.uid, todo.id, todo.done, todo.syncId)}
        className="flex-shrink-0 flex items-center justify-center transition-all"
        style={{
          width: 22, height: 22, borderRadius: 6,
          border: todo.done ? 'none' : `2px solid ${COLORS.border}`,
          background: todo.done ? COLORS.success : 'transparent',
          color: todo.done ? COLORS.bgDeep : 'transparent',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => !todo.done && (e.currentTarget.style.borderColor = COLORS.accent)}
        onMouseLeave={(e) => !todo.done && (e.currentTarget.style.borderColor = COLORS.border)}
      >
        {todo.done && <Check size={12} />}
      </button>

      {/* 텍스트 or 수정 입력 */}
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text" value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') setIsEditing(false); }}
            className="flex-1 rounded-lg px-2 py-1 text-sm focus:outline-none"
            style={{ background: COLORS.bgInput, border: `1.5px solid rgba(124,106,247,.5)`, color: COLORS.textPrimary }}
            autoFocus
          />
          <button onClick={handleUpdate} style={{ color: COLORS.accent, cursor: 'pointer', background: 'none', border: 'none' }}>
            <Check size={15} />
          </button>
          <button onClick={() => setIsEditing(false)} style={{ color: COLORS.textSecondary, cursor: 'pointer', background: 'none', border: 'none' }}>
            <X size={15} />
          </button>
        </div>
      ) : (
        <span className="flex-1 text-sm leading-snug break-all"
          style={{
            color: todo.done ? COLORS.textMuted : COLORS.textPrimary,
            textDecoration: todo.done ? 'line-through' : 'none',
            textDecorationColor: COLORS.textMuted,
          }}
        >
          {todo.text}
        </span>
      )}

      {/* 날짜 배지 */}
      {!isEditing && (
        drLabel ? (
          <button onClick={() => onOpenDateModal(todo)}
            className="text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap flex-shrink-0 border transition"
            style={ds ? { color: ds.color, borderColor: ds.border, background: ds.bg } : { color: COLORS.textSecondary, borderColor: COLORS.border, background: COLORS.bgInput }}
          >
            📅 {drLabel}
          </button>
        ) : (
          <button onClick={() => onOpenDateModal(todo)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="기간 설정" style={{ color: COLORS.textSecondary, background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.accentLight)}
            onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textSecondary)}
          >
            <Calendar size={14} />
          </button>
        )
      )}

      {/* 우선순위 배지 */}
      {!isEditing && (
        <button onClick={handlePriorityCycle}
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
          <button onClick={() => onCancelShare(todo)}
            className="flex-shrink-0 text-[11px] whitespace-nowrap"
            style={{
              background: 'transparent', border: '1.5px solid rgba(248,113,113,.35)',
              borderRadius: 6, color: COLORS.danger, cursor: 'pointer', padding: '3px 7px', transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.danger; e.currentTarget.style.background = 'rgba(248,113,113,.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(248,113,113,.35)'; e.currentTarget.style.background = 'transparent'; }}
          >
            공유취소
          </button>
        ) : (
          <button onClick={() => onShareToKanban(todo)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-[11px] whitespace-nowrap"
            style={{
              background: 'transparent', border: `1.5px solid ${COLORS.border}`,
              borderRadius: 6, color: COLORS.textSecondary, cursor: 'pointer', padding: '3px 7px', transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.color = COLORS.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textSecondary; }}
          >
            팀으로 복사
          </button>
        )
      )}

      {/* 액션 버튼 */}
      {!isEditing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setIsEditing(true); setEditText(todo.text); }}
            className="rounded-md p-1 transition"
            style={{ color: COLORS.textSecondary, background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.accentLight; e.currentTarget.style.background = COLORS.bgInput; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.textSecondary; e.currentTarget.style.background = 'none'; }}
          >
            <Pencil size={13} />
          </button>
          <button onClick={handleDelete}
            className="rounded-md p-1 transition"
            style={{ color: COLORS.textSecondary, background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.danger; e.currentTarget.style.background = 'rgba(248,113,113,.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.textSecondary; e.currentTarget.style.background = 'none'; }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

export default TodoItem;
