export const TAG_COLORS = [
  { id: 'purple', bg: 'rgba(124,106,247,.2)', color: '#a78bfa', border: 'rgba(124,106,247,.4)' },
  { id: 'blue',   bg: 'rgba(59,130,246,.2)',  color: '#60a5fa', border: 'rgba(59,130,246,.4)' },
  { id: 'green',  bg: 'rgba(52,211,153,.2)',  color: '#34d399', border: 'rgba(52,211,153,.4)' },
  { id: 'yellow', bg: 'rgba(251,191,36,.2)',  color: '#fbbf24', border: 'rgba(251,191,36,.4)' },
  { id: 'red',    bg: 'rgba(248,113,113,.2)', color: '#f87171', border: 'rgba(248,113,113,.4)' },
  { id: 'pink',   bg: 'rgba(236,72,153,.2)',  color: '#f472b6', border: 'rgba(236,72,153,.4)' },
  { id: 'orange', bg: 'rgba(251,146,60,.2)',  color: '#fb923c', border: 'rgba(251,146,60,.4)' },
  { id: 'teal',   bg: 'rgba(45,212,191,.2)',  color: '#2dd4bf', border: 'rgba(45,212,191,.4)' },
];

export const DEFAULT_TAG_COLOR = TAG_COLORS[0];

export const getTagColor = (colorId) => TAG_COLORS.find((c) => c.id === colorId) || TAG_COLORS[0];
