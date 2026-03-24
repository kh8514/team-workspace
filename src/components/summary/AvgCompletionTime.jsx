import { useMemo } from 'react';

function AvgCompletionTime({ archive }) {
  const stats = useMemo(() => {
    const items = archive.filter((t) => t.createdAt && t.archivedAt);
    if (!items.length) return null;
    const diffs = items.map((t) => (t.archivedAt - t.createdAt) / (1000 * 60 * 60 * 24));
    const avg = diffs.reduce((s, d) => s + d, 0) / diffs.length;
    const min = Math.min(...diffs);
    const max = Math.max(...diffs);
    return { avg, min, max, count: items.length };
  }, [archive]);

  if (!stats) {
    return <div style={{ textAlign: 'center', padding: '24px 0', color: '#7a7a8e', fontSize: 13 }}>데이터가 부족합니다</div>;
  }

  const fmt = (v) => v < 1 ? '1일 미만' : `${Math.round(v)}일`;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {[
        { label: '평균 소요', value: fmt(stats.avg), color: '#a78bfa', sub: `${stats.count}개 기준` },
        { label: '최단 완료', value: fmt(stats.min), color: '#34d399', sub: '가장 빠른 완료' },
        { label: '최장 소요', value: fmt(stats.max), color: '#f87171', sub: '가장 오래 걸린 완료' },
      ].map((item) => (
        <div key={item.label} style={{
          background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 12, padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: '#7a7a8e', marginBottom: 8 }}>{item.label}</div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 22, fontWeight: 700, color: item.color }}>
            {item.value}
          </div>
          <div style={{ fontSize: 11, color: '#55556a', marginTop: 6 }}>{item.sub}</div>
        </div>
      ))}
    </div>
  );
}

export default AvgCompletionTime;
