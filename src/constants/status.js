// ── 칸반 상태 상수 ────────────────────────────────────────

export const STATUS_ORDER = ['todo', 'inProgress', 'review', 'done'];

export const STATUS_LABEL = {
  todo:       '할 일',
  inProgress: '진행 중',
  review:     '검토',
  done:       '완료',
};

export const STATUS_COLOR = {
  todo:       { bg: 'rgba(124,106,247,.15)', color: '#a78bfa' },
  inProgress: { bg: 'rgba(251,191,36,.12)',  color: '#fbbf24' },
  review:     { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  done:       { bg: 'rgba(248,113,113,.12)', color: '#f87171' },
};

export const COL_COLORS = {
  todo:   '#7c6af7',
  doing:  '#fbbf24',
  review: '#60a5fa',
  done:   '#34d399',
};
