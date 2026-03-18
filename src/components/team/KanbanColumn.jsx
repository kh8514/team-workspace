import { useState } from 'react';
import useTeamStore from '../../store/teamStore';
import KanbanCard from './KanbanCard';

const COL_COLORS = {
  todo:   '#7c6af7',
  doing:  '#fbbf24',
  review: '#60a5fa',
  done:   '#34d399',
};

function KanbanColumn({ status, title, colKey, cards }) {
  const { moveCard, cards: allCards } = useTeamStore();
  const dotColor = COL_COLORS[colKey] || '#7c6af7';
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const cardId = e.dataTransfer.getData('cardId');
    const assigneeId = e.dataTransfer.getData('assigneeId');
    if (!cardId) return;
    const card = allCards.find((c) => c.id === cardId);
    if (!card || card.status === status) return;
    moveCard(cardId, status, card, assigneeId);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={() => setDragOver(true)}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
      onDrop={handleDrop}
      style={{
        background: dragOver ? '#1e1e2a' : '#1a1a1f',
        border: `1.5px solid ${dragOver ? dotColor : '#2e2e38'}`,
        borderRadius: 14,
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color .15s, background .15s',
        boxShadow: dragOver ? `0 0 0 2px ${dotColor}22` : 'none',
      }}
    >
      {/* 컬럼 헤더 */}
      <div style={{
        padding: '14px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '1.5px solid #2e2e38',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.3px', flex: 1, color: dotColor }}>
          {title}
        </div>
        <div style={{
          background: '#23232b',
          borderRadius: 99,
          fontFamily: 'Space Mono, monospace',
          fontSize: 11,
          color: '#7a7a8e',
          padding: '2px 8px',
        }}>
          {cards.length}
        </div>
      </div>

      {/* 카드 목록 */}
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 120 }}>
        {cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#7a7a8e', fontSize: 12 }}>
            비어있음
          </div>
        ) : (
          cards.map((card) => (
            <KanbanCard key={card.id} card={card} />
          ))
        )}
      </div>
    </div>
  );
}

export default KanbanColumn;
