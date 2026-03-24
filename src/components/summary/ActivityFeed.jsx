import { fmtRelativeTime } from '../../utils/date';

function ActivityFeed({ items }) {
  if (!items.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: '#7a7a8e', fontSize: 13 }}>
        아직 활동 기록이 없습니다
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 420, overflowY: 'auto', paddingRight: 2, scrollbarWidth: 'none' }}>
      {items.map((item) => (
        <div key={item.id} style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '10px 12px', borderRadius: 10,
          transition: 'background .15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1f'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
          {/* 아이콘 */}
          <div style={{ fontSize: 18, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>{item.icon}</div>

          {/* 내용 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              {item.actorPhoto ? (
                <img src={item.actorPhoto} alt={item.actorName}
                  style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #2e2e38' }} />
              ) : (
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#2e2e38',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#7a7a8e' }}>
                  {item.actorName?.[0] || '?'}
                </div>
              )}
              <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>{item.actorName}</span>
              <span style={{ fontSize: 11, color: '#7a7a8e' }}>{item.detail}</span>
            </div>
            <div style={{
              fontSize: 13, color: '#e8e8f0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {item.title}
            </div>
          </div>

          {/* 시간 */}
          <div style={{ fontSize: 10, color: '#55556a', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>
            {fmtRelativeTime(item.createdAt)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ActivityFeed;
