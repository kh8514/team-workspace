import { useState } from 'react';
import useTeamStore from '../../store/teamStore';
import useAuthStore from '../../store/authStore';
import CardDetail from './CardDetail';

const PRIORITY_CYCLE = ['high', 'medium', 'low'];

const PRIORITY_STYLE = {
  high:   { bg: 'rgba(248,113,113,.18)', color: '#f87171',  border: 'rgba(248,113,113,.3)', label: '높음' },
  medium: { bg: 'rgba(251,191,36,.15)',  color: '#fbbf24',  border: 'rgba(251,191,36,.3)',  label: '보통' },
  low:    { bg: 'rgba(52,211,153,.13)',  color: '#34d399',  border: 'rgba(52,211,153,.3)',  label: '낮음' },
};

const STATUS_ORDER = ['todo', 'inProgress', 'review', 'done'];
const STATUS_LABEL = { todo: '할 일', inProgress: '진행 중', review: '검토', done: '완료' };

const fmtDate = (s) => {
  if (!s) return '';
  const [, m, d] = s.split('-');
  return `${m}.${d}`;
};

const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const dateRangeLabel = (startDate, endDate) => {
  if (!startDate && !endDate) return null;
  if (startDate && endDate)
    return startDate === endDate ? fmtDate(startDate) : `${fmtDate(startDate)} ~ ${fmtDate(endDate)}`;
  if (startDate) return `${fmtDate(startDate)} ~`;
  return `~ ${fmtDate(endDate)}`;
};

const dateStatus = (startDate, endDate) => {
  const today = todayYMD();
  const ref = endDate || startDate;
  if (!ref) return null;
  if (ref < today) return 'overdue';
  if (ref === today) return 'today';
  return 'upcoming';
};

const DATE_STATUS_STYLE = {
  overdue:  { color: '#f87171', border: 'rgba(248,113,113,.3)', bg: 'rgba(248,113,113,.08)' },
  today:    { color: '#fbbf24', border: 'rgba(251,191,36,.3)',  bg: 'rgba(251,191,36,.08)'  },
  upcoming: { color: '#34d399', border: 'rgba(52,211,153,.3)',  bg: 'rgba(52,211,153,.08)'  },
};

function KanbanCard({ card }) {
  const { members, moveCard, updateCard, completeCard } = useTeamStore();
  const { user } = useAuthStore();
  const [showDetail, setShowDetail] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dateModal, setDateModal] = useState(null); // { startDate, endDate }

  const assignee = members.find((m) => m.uid === card.assigneeId);
  const ps = PRIORITY_STYLE[card.priority] || PRIORITY_STYLE.medium;
  const startDate = card.startDate || '';
  const endDate = card.endDate || card.dueDate || '';
  const drLabel = dateRangeLabel(startDate, endDate);
  const ds = dateStatus(startDate, endDate);
  const dsStyle = ds ? DATE_STATUS_STYLE[ds] : null;

  const currentIdx = STATUS_ORDER.indexOf(card.status);
  const prevStatus = currentIdx > 0 ? STATUS_ORDER[currentIdx - 1] : null;
  const nextStatus = currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null;

  const handleMove = (e, status) => {
    e.stopPropagation();
    moveCard(card.id, status, card, card.assigneeId);
  };

  const openDateModal = (e) => {
    e.stopPropagation();
    setDateModal({ startDate: startDate || '', endDate: endDate || '' });
  };

  const handleDateSave = () => {
    updateCard(card.id, {
      startDate: dateModal.startDate || null,
      endDate: dateModal.endDate || null,
      dueDate: dateModal.endDate || null,
    }, card);
    setDateModal(null);
  };

  const handlePriorityCycle = (e) => {
    e.stopPropagation();
    const current = card.priority || 'medium';
    const next = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(current) + 1) % PRIORITY_CYCLE.length];
    updateCard(card.id, { priority: next }, card);
  };

  return (
    <>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('cardId', card.id);
          e.dataTransfer.setData('assigneeId', card.assigneeId || '');
          e.dataTransfer.effectAllowed = 'move';
          setTimeout(() => e.target.style.opacity = '0.4', 0);
        }}
        onDragEnd={(e) => { e.target.style.opacity = '1'; }}
        onClick={() => setShowDetail(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#23232b',
          border: `1.5px solid ${hovered ? '#3e3e50' : '#2e2e38'}`,
          borderRadius: 10,
          padding: '11px 13px',
          cursor: 'grab',
          transition: 'border-color .15s, transform .15s, box-shadow .15s',
          transform: hovered ? 'translateY(-1px)' : 'none',
          boxShadow: hovered ? '0 4px 16px rgba(0,0,0,.3)' : 'none',
          animation: 'itemIn .22s ease',
        }}
      >
        {/* 날짜 배지 */}
        <div style={{ marginBottom: 7, minHeight: 18 }}>
          {drLabel ? (
            <button
              onClick={openDateModal}
              style={dsStyle
                ? { background: dsStyle.bg, border: `1px solid ${dsStyle.border}`, borderRadius: 4, padding: '1px 6px', color: dsStyle.color, fontSize: 10, cursor: 'pointer' }
                : { background: '#1a1a1f', border: '1px solid #2e2e38', borderRadius: 4, padding: '1px 6px', fontSize: 10, color: '#7a7a8e', cursor: 'pointer' }
              }
            >
              📅 {drLabel}
            </button>
          ) : (
            <button
              onClick={openDateModal}
              style={{ background: 'none', border: 'none', color: '#7a7a8e', cursor: 'pointer', fontSize: 11, padding: 0, opacity: hovered ? 1 : 0, transition: 'opacity .15s' }}
            >
              📅
            </button>
          )}
        </div>

        {/* 카드 텍스트 */}
        <div style={{ fontSize: 14, lineHeight: 1.45, wordBreak: 'break-all', marginBottom: 8, color: '#e8e8f0' }}>
          {card.title}
        </div>

        {/* 카드 푸터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          {/* 이동 버튼 (앞뒤 각 1개) */}
          <div style={{ display: 'flex', gap: 4, flex: 1, opacity: hovered ? 1 : 0, transition: 'opacity .15s' }}>
            {prevStatus && (
              <button
                onClick={(e) => handleMove(e, prevStatus)}
                style={{ background: 'transparent', border: '1.5px solid #2e2e38', borderRadius: 5, color: '#7a7a8e', cursor: 'pointer', fontSize: 11, padding: '2px 9px', transition: 'all .13s', whiteSpace: 'nowrap', fontFamily: 'Noto Sans KR, sans-serif' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.background = '#1a1a1f'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; e.currentTarget.style.background = 'transparent'; }}
              >
                ← {STATUS_LABEL[prevStatus]}
              </button>
            )}
            {nextStatus && (
              <button
                onClick={(e) => handleMove(e, nextStatus)}
                style={{ background: 'transparent', border: '1.5px solid #2e2e38', borderRadius: 5, color: '#7a7a8e', cursor: 'pointer', fontSize: 11, padding: '2px 9px', transition: 'all .13s', whiteSpace: 'nowrap', fontFamily: 'Noto Sans KR, sans-serif' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.background = '#1a1a1f'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; e.currentTarget.style.background = 'transparent'; }}
              >
                → {STATUS_LABEL[nextStatus]}
              </button>
            )}
            {card.status === 'done' && (
              <button
                onClick={(e) => { e.stopPropagation(); completeCard(card.id, card); }}
                style={{ background: 'rgba(52,211,153,.12)', border: '1.5px solid rgba(52,211,153,.35)', borderRadius: 5, color: '#34d399', cursor: 'pointer', fontSize: 11, padding: '2px 9px', transition: 'all .13s', whiteSpace: 'nowrap', fontFamily: 'Noto Sans KR, sans-serif' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(52,211,153,.22)'; e.currentTarget.style.borderColor = '#34d399'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(52,211,153,.12)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,.35)'; }}
              >
                ✓ 완료
              </button>
            )}
          </div>

          {/* 우선순위 배지 (클릭으로 변경) */}
          <button
            onClick={handlePriorityCycle}
            title="우선순위 변경 (클릭)"
            style={{
              fontSize: 11, borderRadius: 5, padding: '3px 7px', fontWeight: 700, letterSpacing: '.2px', flexShrink: 0,
              background: ps.bg, color: ps.color, border: `1.5px solid ${ps.border}`,
              cursor: 'pointer', transition: 'opacity .15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {ps.label}
          </button>

          {/* 담당자 아바타 */}
          {assignee && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {assignee.photoURL ? (
                <img
                  src={assignee.photoURL}
                  alt={assignee.name}
                  style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid #2e2e38' }}
                />
              ) : (
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#7c6af7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff' }}>
                  {assignee.name?.[0]}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDetail && (
        <CardDetail card={card} onClose={() => setShowDetail(false)} />
      )}

      {dateModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setDateModal(null)}
        >
          <div style={{ background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 16, padding: 24, width: 340, maxWidth: '90vw', animation: 'modalIn .2s ease' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e8f0', marginBottom: 18 }}>기간 설정</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#7a7a8e', fontWeight: 600, marginBottom: 6, letterSpacing: '.3px' }}>시작일</label>
              <input
                type="date"
                value={dateModal.startDate}
                onChange={(e) => setDateModal((p) => ({ ...p, startDate: e.target.value }))}
                style={{ width: '100%', background: '#23232b', border: '1.5px solid #2e2e38', borderRadius: 8, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, padding: '9px 12px', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#7a7a8e', fontWeight: 600, marginBottom: 6, letterSpacing: '.3px' }}>종료일</label>
              <input
                type="date"
                value={dateModal.endDate}
                onChange={(e) => setDateModal((p) => ({ ...p, endDate: e.target.value }))}
                style={{ width: '100%', background: '#23232b', border: '1.5px solid #2e2e38', borderRadius: 8, color: '#e8e8f0', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, padding: '9px 12px', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateCard(card.id, { startDate: null, endDate: null, dueDate: null }); setDateModal(null); }}
                style={{ flex: 1, background: 'rgba(248,113,113,.15)', border: 'none', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, fontWeight: 500, padding: 10 }}
              >
                삭제
              </button>
              <button
                onClick={() => setDateModal(null)}
                style={{ flex: 1, background: '#23232b', border: 'none', borderRadius: 8, color: '#7a7a8e', cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, fontWeight: 500, padding: 10 }}
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
    </>
  );
}

export default KanbanCard;
