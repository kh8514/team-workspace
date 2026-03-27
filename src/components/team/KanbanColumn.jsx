import { useState, useRef } from 'react';
import useTeamStore from '../../store/teamStore';
import useAuthStore from '../../store/authStore';
import KanbanCard from './KanbanCard';
import { COL_COLORS } from '../../constants/status';
import { COLORS } from '../../constants/theme';

function KanbanColumn({ status, title, colKey, cards, isMobile = false }) {
  const { moveCard, cards: allCards } = useTeamStore();
  const { user } = useAuthStore();
  const dotColor = COL_COLORS[colKey] || COL_COLORS.todo;
  const [dragOver, setDragOver] = useState(false);
  const scrollRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const cardId = e.dataTransfer.getData('cardId');
    if (!cardId) return;
    const card = allCards.find((c) => c.id === cardId);
    if (!card || card.status === status) return;
    if (card.authorId !== user?.uid) return;
    moveCard(cardId, status, card);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !el.clientWidth) return;
    setActiveIdx(Math.round(el.scrollLeft / el.clientWidth));
  };

  const scrollTo = (idx) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div
      onDragOver={!isMobile ? handleDragOver : undefined}
      onDragEnter={!isMobile ? () => setDragOver(true) : undefined}
      onDragLeave={!isMobile ? (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); } : undefined}
      onDrop={!isMobile ? handleDrop : undefined}
      style={{
        background: dragOver ? COLORS.bgHover : COLORS.bgCard,
        border: `1.5px solid ${dragOver ? dotColor : COLORS.border}`,
        borderRadius: 14, minHeight: isMobile ? 'auto' : 220,
        display: 'flex', flexDirection: 'column',
        transition: 'border-color .15s, background .15s',
        boxShadow: dragOver ? `0 0 0 2px ${dotColor}22` : 'none',
      }}
    >
      {/* 컬럼 헤더 */}
      <div style={{
        padding: '14px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: `1.5px solid ${COLORS.border}`,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.3px', flex: 1, color: dotColor }}>
          {title}
        </div>
        <div style={{
          background: COLORS.bgInput, borderRadius: 99,
          fontFamily: 'Space Mono, monospace', fontSize: 11,
          color: COLORS.textSecondary, padding: '2px 8px',
        }}>
          {cards.length}
        </div>
      </div>

      {/* 카드 목록 */}
      {cards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 0', color: COLORS.textSecondary, fontSize: 12 }}>
          비어있음
        </div>
      ) : isMobile ? (
        /* 모바일: 가로 슬라이드 */
        <div>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              paddingTop: 10,
              paddingBottom: 10,
              gap: 10,
            }}
          >
            {cards.map((card, i) => (
              <div
                key={card.id}
                style={{
                  minWidth: 'calc(100% - 36px)',
                  maxWidth: 'calc(100% - 36px)',
                  scrollSnapAlign: 'start',
                  flexShrink: 0,
                  paddingLeft: i === 0 ? 12 : 0,
                  paddingRight: i === cards.length - 1 ? 12 : 0,
                }}
              >
                <KanbanCard card={card} />
              </div>
            ))}
          </div>

          {/* 페이지네이션 도트 */}
          {cards.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingBottom: 12 }}>
              {cards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  style={{
                    width: i === activeIdx ? 18 : 6,
                    height: 6,
                    borderRadius: 99,
                    background: i === activeIdx ? dotColor : COLORS.border,
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all .25s',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 데스크탑: 세로 리스트 */
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 120 }}>
          {cards.map((card) => <KanbanCard key={card.id} card={card} />)}
        </div>
      )}
    </div>
  );
}

export default KanbanColumn;
