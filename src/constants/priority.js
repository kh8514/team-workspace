// ── 우선순위 상수 ─────────────────────────────────────────

export const PRIORITY_CYCLE = ['high', 'medium', 'low'];

export const PRIORITY_LABEL = { high: '높음', medium: '보통', low: '낮음' };

export const PRIORITY_STYLE = {
  high:   { bg: 'rgba(248,113,113,.15)', color: '#f87171', border: 'rgba(248,113,113,.3)', label: '높음' },
  medium: { bg: 'rgba(124,106,247,.15)', color: '#a78bfa', border: 'rgba(124,106,247,.3)', label: '보통' },
  low:    { bg: 'rgba(52,211,153,.12)',  color: '#34d399', border: 'rgba(52,211,153,.3)',  label: '낮음' },
};

export const PRIORITY_EVENT_STYLE = {
  high:   { bg: 'rgba(248,113,113,.25)', color: '#f87171' },
  medium: { bg: 'rgba(124,106,247,.25)', color: '#a78bfa' },
  low:    { bg: 'rgba(52,211,153,.2)',   color: '#34d399' },
};

export const PRIO_BAR_COLOR = { high: '#f87171', medium: '#7c6af7', low: '#34d399' };
