// ── 테마 & 공통 스타일 ────────────────────────────────────

export const COLORS = {
  // backgrounds
  bgDeep:    '#0f0f11',
  bgCard:    '#1a1a1f',
  bgInput:   '#23232b',
  bgHover:   '#1e1e2a',

  // borders
  border:    '#2e2e38',
  borderHover: '#3e3e50',

  // text
  textPrimary:   '#e8e8f0',
  textSecondary: '#7a7a8e',
  textMuted:     '#55556a',

  // accents
  accent:    '#7c6af7',
  accentLight: '#a78bfa',
  success:   '#34d399',
  warn:      '#fbbf24',
  danger:    '#f87171',
};

export const DATE_STATUS_STYLE = {
  overdue:  { color: '#f87171', border: 'rgba(248,113,113,.3)', bg: 'rgba(248,113,113,.08)' },
  today:    { color: '#fbbf24', border: 'rgba(251,191,36,.3)',  bg: 'rgba(251,191,36,.08)'  },
  upcoming: { color: '#34d399', border: 'rgba(52,211,153,.3)',  bg: 'rgba(52,211,153,.08)'  },
};

// 공통 인라인 스타일 프리셋
export const STYLE = {
  card: {
    background: COLORS.bgCard,
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: 12,
  },
  input: {
    background: COLORS.bgInput,
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: 10,
    color: COLORS.textPrimary,
    fontFamily: 'Noto Sans KR, sans-serif',
    fontSize: 14,
    padding: '10px 14px',
    outline: 'none',
  },
  select: {
    background: COLORS.bgCard,
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: 12,
    color: COLORS.textPrimary,
    fontFamily: 'Noto Sans KR, sans-serif',
    fontSize: 13,
    padding: '12px 10px',
    outline: 'none',
    cursor: 'pointer',
  },
  btnPrimary: {
    background: COLORS.accent,
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
    transition: 'background .15s, transform .1s',
  },
  btnGhost: {
    background: 'transparent',
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: 6,
    color: COLORS.textSecondary,
    cursor: 'pointer',
    transition: 'all .15s',
  },
  mono: {
    fontFamily: 'Space Mono, monospace',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.65)',
    backdropFilter: 'blur(4px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
