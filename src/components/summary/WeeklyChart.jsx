import { useMemo } from 'react';
import { fmtTimestamp, dateStr } from '../../utils/date';

const DAYS = ['일','월','화','수','목','금','토'];

function WeeklyChart({ archive, todos, cards }) {
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = dateStr(d);
      // 아카이브 완료 + 칸반 done 카드 (updatedAt 기준)
      const archivedDone = archive.filter((t) => t.archivedAt && fmtTimestamp(t.archivedAt) === ds).length;
      const kanbanDone   = cards.filter((c) => c.status === 'done' && c.updatedAt && fmtTimestamp(new Date(c.updatedAt)) === ds).length;
      const completed    = archivedDone + kanbanDone;
      const created      = [...todos, ...archive].filter((t) => t.createdAt && fmtTimestamp(new Date(t.createdAt)) === ds).length;
      result.push({ ds, label: DAYS[d.getDay()], date: d.getDate(), completed, created, isToday: i === 0 });
    }
    return result;
  }, [archive, todos, cards]);

  const maxVal = Math.max(...days.map((d) => Math.max(d.completed, d.created)), 1);

  return (
    <div style={{
      background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 12,
      padding: '20px 20px 16px', marginBottom: 24,
    }}>
      {/* 범례 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, justifyContent: 'flex-end' }}>
        {[{ color: '#7c6af7', label: '등록' }, { color: '#34d399', label: '완료' }].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#7a7a8e' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* 바 차트 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, alignItems: 'flex-end', height: 100 }}>
        {days.map((d) => {
          const completedH = Math.max(2, Math.round((d.completed / maxVal) * 84));
          const createdH   = Math.max(2, Math.round((d.created   / maxVal) * 84));
          return (
            <div key={d.ds} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 84 }}>
                {/* 등록 */}
                <div style={{
                  width: 10, borderRadius: '3px 3px 0 0', minHeight: 2,
                  background: d.isToday ? '#a78bfa' : '#7c6af7',
                  opacity: d.created > 0 ? 0.7 : 0.2,
                  height: createdH,
                  transition: 'height .5s cubic-bezier(.4,0,.2,1)',
                }} />
                {/* 완료 */}
                <div style={{
                  width: 10, borderRadius: '3px 3px 0 0', minHeight: 2,
                  background: '#34d399',
                  opacity: d.completed > 0 ? 0.85 : 0.2,
                  height: completedH,
                  transition: 'height .5s cubic-bezier(.4,0,.2,1)',
                }} />
              </div>
              <div style={{ fontSize: 11, color: d.isToday ? '#a78bfa' : '#7a7a8e', fontWeight: d.isToday ? 700 : 400 }}>
                {d.label}
              </div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#55556a' }}>
                {d.date}
              </div>
            </div>
          );
        })}
      </div>

      {/* 요약 */}
      <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 12, borderTop: '1px solid #2e2e38' }}>
        <div style={{ fontSize: 12, color: '#7a7a8e' }}>
          이번 주 등록 <span style={{ fontFamily: 'Space Mono, monospace', color: '#a78bfa', fontWeight: 700 }}>
            {days.reduce((s, d) => s + d.created, 0)}
          </span>개
        </div>
        <div style={{ fontSize: 12, color: '#7a7a8e' }}>
          이번 주 완료 <span style={{ fontFamily: 'Space Mono, monospace', color: '#34d399', fontWeight: 700 }}>
            {days.reduce((s, d) => s + d.completed, 0)}
          </span>개
        </div>
      </div>
    </div>
  );
}

export default WeeklyChart;
