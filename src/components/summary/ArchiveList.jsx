import { PRIORITY_LABEL, PRIORITY_STYLE } from '../../constants/priority';
import { fmtTimestamp } from '../../utils/date';

function ArchiveList({ items, onRestore }) {
  if (items.length === 0) {
    return <div style={{ textAlign: 'center', padding: '32px 0', color: '#7a7a8e', fontSize: 13 }}>아카이브가 비어있어요</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto', paddingRight: 4, scrollbarWidth: 'none' }}>
      {items.map((item) => {
        const ps = PRIORITY_STYLE[item.priority || 'medium'];
        return (
          <div key={item.id} style={{
            background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 10, padding: '11px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1, fontSize: 13, color: '#55556a', textDecoration: 'line-through', textDecorationColor: '#55556a', wordBreak: 'break-all' }}>
              {item.text}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#7a7a8e' }}>{fmtTimestamp(item.archivedAt)}</div>
              <span style={{ fontSize: 10, borderRadius: 4, padding: '1px 6px', fontWeight: 700, background: ps.bg, color: ps.color }}>
                {PRIORITY_LABEL[item.priority || 'medium']}
              </span>
            </div>
            <button
              onClick={() => onRestore(item.id)}
              style={{
                background: 'transparent', border: '1.5px solid #2e2e38', borderRadius: 6, color: '#7a7a8e',
                cursor: 'pointer', fontSize: 11, padding: '3px 8px', transition: 'all .15s', whiteSpace: 'nowrap',
                fontFamily: 'Noto Sans KR, sans-serif',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c6af7'; e.currentTarget.style.color = '#a78bfa'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; }}
            >
              복원
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ArchiveList;
