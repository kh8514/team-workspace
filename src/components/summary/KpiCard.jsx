function KpiCard({ label, value, colorClass, sub }) {
  const colorMap = {
    accent: '#a78bfa', success: '#34d399', warn: '#fbbf24',
    danger: '#f87171', text: '#e8e8f0',
  };
  return (
    <div style={{ background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, color: '#7a7a8e', fontWeight: 600, marginBottom: 6, letterSpacing: '.3px' }}>{label}</div>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 26, fontWeight: 700, color: colorMap[colorClass] || '#e8e8f0' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#7a7a8e', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default KpiCard;
