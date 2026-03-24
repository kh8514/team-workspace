import { STATUS_LABEL, STATUS_COLOR } from '../../constants/status';

const STATUS_ORDER = ['todo', 'inProgress', 'review', 'done'];

function MemberKanbanStatus({ cards, members }) {
  if (!members.length) {
    return <div style={{ textAlign: 'center', padding: '24px 0', color: '#7a7a8e', fontSize: 13 }}>멤버 정보 없음</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
      {members.map((member) => {
        const memberCards = cards.filter((c) => c.assigneeId === member.id);
        if (!memberCards.length) return null;
        const total = memberCards.length;
        const done  = memberCards.filter((c) => c.status === 'done').length;
        const rate  = total === 0 ? 0 : Math.round((done / total) * 100);

        return (
          <div key={member.id} style={{
            background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 12, padding: '14px 16px',
          }}>
            {/* 멤버 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {member.photoURL ? (
                <img src={member.photoURL} alt={member.name}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #2e2e38' }} />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2e2e38',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#7a7a8e' }}>
                  {member.name?.[0] || '?'}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#e8e8f0', fontWeight: 600 }}>{member.name}</div>
                <div style={{ fontSize: 11, color: '#7a7a8e' }}>총 {total}개 · 완료율 {rate}%</div>
              </div>
              {/* 완료율 미니 바 */}
              <div style={{ width: 80, background: '#23232b', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: rate >= 80 ? '#34d399' : rate >= 40 ? '#fbbf24' : '#7c6af7', width: `${rate}%`, transition: 'width .5s' }} />
              </div>
            </div>

            {/* 상태별 뱃지 */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUS_ORDER.map((status) => {
                const cnt = memberCards.filter((c) => c.status === status).length;
                if (!cnt) return null;
                const sc = STATUS_COLOR[status];
                return (
                  <span key={status} style={{
                    fontSize: 11, borderRadius: 6, padding: '3px 10px', fontWeight: 600,
                    background: sc.bg, color: sc.color,
                  }}>
                    {STATUS_LABEL[status]} {cnt}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MemberKanbanStatus;
