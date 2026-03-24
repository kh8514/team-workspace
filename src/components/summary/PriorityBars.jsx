import { PRIORITY_LABEL, PRIO_BAR_COLOR } from '../../constants/priority';

function PriorityBars({ todos }) {
  const priorities = ['high', 'medium', 'low'];
  const total = todos.filter((t) => t.done || t.archivedAt).length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {priorities.map((p) => {
        const count = todos.filter((t) => (t.done || t.archivedAt) && (t.priority || 'medium') === p).length;
        const pct = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12, width: 40, flexShrink: 0, color: '#7a7a8e' }}>{PRIORITY_LABEL[p]}</div>
            <div style={{ flex: 1, background: '#23232b', borderRadius: 99, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: PRIO_BAR_COLOR[p], width: `${pct}%`, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#7a7a8e', width: 30, textAlign: 'right', flexShrink: 0 }}>
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PriorityBars;
