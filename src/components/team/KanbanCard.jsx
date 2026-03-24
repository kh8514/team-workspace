import { useState } from 'react';
import useTeamStore from '../../store/teamStore';
import useAuthStore from '../../store/authStore';
import CardDetail from './CardDetail';
import DateModal from '../ui/DateModal';
import { PRIORITY_CYCLE, PRIORITY_STYLE } from '../../constants/priority';
import { STATUS_ORDER, STATUS_LABEL } from '../../constants/status';
import { COLORS, DATE_STATUS_STYLE } from '../../constants/theme';
import { fmtDate, todayYMD, dateRangeLabel, dateStatus } from '../../utils/date';

function KanbanCard({ card }) {
  const { members, moveCard, updateCard, completeCard } = useTeamStore();
  const { user } = useAuthStore();
  const [showDetail, setShowDetail] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dateModal, setDateModal] = useState(null);

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

  const handleDateDelete = () => {
    updateCard(card.id, { startDate: null, endDate: null, dueDate: null }, card);
    setDateModal(null);
  };

  const handlePriorityCycle = (e) => {
    e.stopPropagation();
    const current = card.priority || 'medium';
    const next = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(current) + 1) % PRIORITY_CYCLE.length];
    updateCard(card.id, { priority: next }, card);
  };

  const MoveBtn = ({ onClick, children }) => (
    <button
      onClick={onClick}
      style={{
        background: 'transparent', border: `1.5px solid ${COLORS.border}`,
        borderRadius: 5, color: COLORS.textSecondary, cursor: 'pointer',
        fontSize: 11, padding: '2px 9px', transition: 'all .13s',
        whiteSpace: 'nowrap', fontFamily: 'Noto Sans KR, sans-serif',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.accentLight; e.currentTarget.style.color = COLORS.accentLight; e.currentTarget.style.background = COLORS.bgCard; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textSecondary; e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );

  return (
    <>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('cardId', card.id);
          e.dataTransfer.setData('assigneeId', card.assigneeId || '');
          e.dataTransfer.effectAllowed = 'move';
          setTimeout(() => (e.target.style.opacity = '0.4'), 0);
        }}
        onDragEnd={(e) => (e.target.style.opacity = '1')}
        onClick={() => setShowDetail(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: COLORS.bgInput,
          border: `1.5px solid ${hovered ? COLORS.borderHover : COLORS.border}`,
          borderRadius: 10, padding: '11px 13px', cursor: 'grab',
          transition: 'border-color .15s, transform .15s, box-shadow .15s',
          transform: hovered ? 'translateY(-1px)' : 'none',
          boxShadow: hovered ? '0 4px 16px rgba(0,0,0,.3)' : 'none',
          animation: 'itemIn .22s ease',
        }}
      >
        {/* 날짜 배지 */}
        <div style={{ marginBottom: 7, minHeight: 18 }}>
          {drLabel ? (
            <button onClick={openDateModal}
              style={dsStyle
                ? { background: dsStyle.bg, border: `1px solid ${dsStyle.border}`, borderRadius: 4, padding: '1px 6px', color: dsStyle.color, fontSize: 10, cursor: 'pointer' }
                : { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '1px 6px', fontSize: 10, color: COLORS.textSecondary, cursor: 'pointer' }
              }
            >
              📅 {drLabel}
            </button>
          ) : (
            <button onClick={openDateModal}
              style={{ background: 'none', border: 'none', color: COLORS.textSecondary, cursor: 'pointer', fontSize: 11, padding: 0, opacity: hovered ? 1 : 0, transition: 'opacity .15s' }}
            >
              📅
            </button>
          )}
        </div>

        {/* 카드 텍스트 */}
        <div style={{ fontSize: 14, lineHeight: 1.45, wordBreak: 'break-all', marginBottom: 8, color: COLORS.textPrimary }}>
          {card.title}
        </div>

        {/* 카드 푸터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          {/* 이동 버튼 */}
          <div style={{ display: 'flex', gap: 4, flex: 1, opacity: hovered ? 1 : 0, transition: 'opacity .15s' }}>
            {prevStatus && <MoveBtn onClick={(e) => handleMove(e, prevStatus)}>← {STATUS_LABEL[prevStatus]}</MoveBtn>}
            {nextStatus && <MoveBtn onClick={(e) => handleMove(e, nextStatus)}>→ {STATUS_LABEL[nextStatus]}</MoveBtn>}
            {card.status === 'done' && (
              <button
                onClick={(e) => { e.stopPropagation(); completeCard(card.id, card); }}
                style={{
                  background: 'rgba(52,211,153,.12)', border: '1.5px solid rgba(52,211,153,.35)',
                  borderRadius: 5, color: COLORS.success, cursor: 'pointer', fontSize: 11,
                  padding: '2px 9px', transition: 'all .13s', whiteSpace: 'nowrap',
                  fontFamily: 'Noto Sans KR, sans-serif',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(52,211,153,.22)'; e.currentTarget.style.borderColor = COLORS.success; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(52,211,153,.12)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,.35)'; }}
              >
                ✓ 완료
              </button>
            )}
          </div>

          {/* 우선순위 배지 */}
          <button
            onClick={handlePriorityCycle}
            title="우선순위 변경 (클릭)"
            style={{
              fontSize: 11, borderRadius: 5, padding: '3px 7px', fontWeight: 700,
              letterSpacing: '.2px', flexShrink: 0,
              background: ps.bg, color: ps.color, border: `1.5px solid ${ps.border}`,
              cursor: 'pointer', transition: 'opacity .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {ps.label}
          </button>

          {/* 담당자 아바타 */}
          {assignee && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {assignee.photoURL ? (
                <img src={assignee.photoURL} alt={assignee.name}
                  style={{ width: 18, height: 18, borderRadius: '50%', border: `1px solid ${COLORS.border}` }} />
              ) : (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: COLORS.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff',
                }}>
                  {assignee.name?.[0]}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDetail && <CardDetail card={card} onClose={() => setShowDetail(false)} />}

      {dateModal && (
        <DateModal
          startDate={dateModal.startDate}
          endDate={dateModal.endDate}
          onChange={setDateModal}
          onSave={handleDateSave}
          onDelete={handleDateDelete}
          onClose={() => setDateModal(null)}
        />
      )}
    </>
  );
}

export default KanbanCard;
