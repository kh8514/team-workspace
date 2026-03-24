// ── 날짜 유틸리티 ─────────────────────────────────────────

/** 오늘 날짜를 YYYY-MM-DD 문자열로 반환 */
export const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Date 객체를 YYYY-MM-DD 문자열로 반환 */
export const dateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** 연-월-일 정수를 YYYY-MM-DD 문자열로 반환 */
export const ymd = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** YYYY-MM-DD → MM.DD 축약 표시 */
export const fmtDate = (s) => {
  if (!s) return '';
  const [, m, d] = s.split('-');
  return `${m}.${d}`;
};

/** timestamp → YYYY-MM-DD */
export const fmtTimestamp = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return dateStr(d);
};

/** 시작일/종료일 → 범위 라벨 문자열 */
export const dateRangeLabel = (startDate, endDate) => {
  if (!startDate && !endDate) return null;
  if (startDate && endDate)
    return startDate === endDate ? fmtDate(startDate) : `${fmtDate(startDate)} ~ ${fmtDate(endDate)}`;
  if (startDate) return `${fmtDate(startDate)} ~`;
  return `~ ${fmtDate(endDate)}`;
};

/** 시작일/종료일 → 'overdue' | 'today' | 'upcoming' | null */
export const dateStatus = (startDate, endDate) => {
  const today = todayYMD();
  const ref = endDate || startDate;
  if (!ref) return null;
  if (ref < today) return 'overdue';
  if (ref === today) return 'today';
  return 'upcoming';
};

/** 특정 날짜에 해당하는 투두 필터 */
export const getTodosForDate = (todos, dateStr) => {
  return todos.filter((t) => {
    const s = t.startDate;
    const e = t.endDate;
    if (s && e) return dateStr >= s && dateStr <= e;
    if (s && !e) return dateStr === s;
    if (!s && e) return dateStr === e;
    return false;
  });
};

/** 상대 시간 표시 (방금 전, N분 전, N시간 전, N일 전) */
export const fmtRelativeTime = (ts) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  if (h < 24) return `${h}시간 전`;
  if (d < 7) return `${d}일 전`;
  return fmtTimestamp(ts);
};

/** 해당 월에 속하는지 검사 */
export const inMonth = (todo, year, month) => {
  const ts = todo.archivedAt || todo.createdAt;
  if (!ts) return false;
  const d = new Date(ts);
  return d.getFullYear() === year && d.getMonth() === month;
};

/** 해당 연도에 속하는지 검사 */
export const inYear = (todo, year) => {
  const ts = todo.archivedAt || todo.createdAt;
  if (!ts) return false;
  return new Date(ts).getFullYear() === year;
};

/** 기간 초과 여부 검사 */
export const isOverdue = (todo) => {
  if (todo.done) return false;
  const ref = todo.endDate || todo.startDate;
  if (!ref) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(ref) < today;
};
