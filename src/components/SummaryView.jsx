import { useState, useMemo } from 'react';
import usePersonalStore from '../store/personalStore';
import useAuthStore from '../store/authStore';
import useTeamStore from '../store/teamStore';

const fmtDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const PRIORITY_LABEL = { high: '높음', medium: '보통', low: '낮음' };
const PRIORITY_STYLE = {
  high:   { bg: 'rgba(248,113,113,.15)', color: '#f87171' },
  medium: { bg: 'rgba(124,106,247,.15)', color: '#a78bfa' },
  low:    { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
};
const PRIO_BAR_COLOR = { high: '#f87171', medium: '#7c6af7', low: '#34d399' };
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DAYS   = ['일','월','화','수','목','금','토'];

const STATUS_LABEL = { todo: '할 일', inProgress: '진행 중', review: '검토', done: '완료' };
const STATUS_COLOR = {
  todo:       { bg: 'rgba(124,106,247,.15)', color: '#a78bfa' },
  inProgress: { bg: 'rgba(251,191,36,.12)',  color: '#fbbf24' },
  review:     { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  done:       { bg: 'rgba(248,113,113,.12)', color: '#f87171' },
};

const inMonth = (todo, year, month) => {
  const ts = todo.archivedAt || todo.createdAt;
  if (!ts) return false;
  const d = new Date(ts);
  return d.getFullYear() === year && d.getMonth() === month;
};

const inYear = (todo, year) => {
  const ts = todo.archivedAt || todo.createdAt;
  if (!ts) return false;
  return new Date(ts).getFullYear() === year;
};

const isOverdue = (todo) => {
  if (todo.done) return false;
  const ref = todo.endDate || todo.startDate;
  if (!ref) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(ref) < today;
};

const dateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ── 공통 컴포넌트 ──────────────────────────────────────────
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

function ArchiveList({ items, onRestore }) {
  if (items.length === 0) {
    return <div style={{ textAlign: 'center', padding: '32px 0', color: '#7a7a8e', fontSize: 13 }}>아카이브가 비어있어요</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto', paddingRight: 4, scrollbarWidth: 'none' }}>
      {items.map((item) => {
        const ps = PRIORITY_STYLE[item.priority || 'medium'];
        return (
          <div key={item.id} style={{
            background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 10, padding: '11px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1, fontSize: 13, color: '#55556a', textDecoration: 'line-through', textDecorationColor: '#55556a', wordBreak: 'break-all' }}>
              {item.text}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#7a7a8e' }}>{fmtDate(item.archivedAt)}</div>
              <span style={{ fontSize: 10, borderRadius: 4, padding: '1px 6px', fontWeight: 700, background: ps.bg, color: ps.color }}>
                {PRIORITY_LABEL[item.priority || 'medium']}
              </span>
            </div>
            <button
              onClick={() => onRestore(item.id)}
              style={{
                background: 'transparent', border: '1.5px solid #2e2e38', borderRadius: 6, color: '#7a7a8e',
                cursor: 'pointer', fontSize: 11, padding: '3px 8px', transition: 'all .15s', whiteSpace: 'nowrap',
                fontFamily: 'Noto Sans KR, sans-serif',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c6af7'; e.currentTarget.style.color = '#a78bfa'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; }}
            >
              복원
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── 주간 완료율 차트 ──────────────────────────────────────
function WeeklyChart({ archive, todos }) {
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = dateStr(d);
      const completed = archive.filter((t) => t.archivedAt && fmtDate(t.archivedAt) === ds).length;
      const created   = [...todos, ...archive].filter((t) => t.createdAt && fmtDate(new Date(t.createdAt)) === ds).length;
      result.push({ ds, label: DAYS[d.getDay()], date: d.getDate(), completed, created, isToday: i === 0 });
    }
    return result;
  }, [archive, todos]);

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

// ── 멤버별 칸반 현황 ─────────────────────────────────────
function MemberKanbanStatus({ cards, members }) {
  const STATUS_ORDER = ['todo', 'inProgress', 'review', 'done'];

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

// ── 평균 소요 시간 ────────────────────────────────────────
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

// ── 메인 ─────────────────────────────────────────────────
function SummaryView() {
  const { todos, archive, restoreFromArchive } = usePersonalStore();
  const { user } = useAuthStore();
  const { cards, members } = useTeamStore();

  const now = new Date();
  const [period, setPeriod] = useState('weekly'); // weekly | monthly | yearly
  const [selYear, setSelYear]   = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());

  const handleRestore = (archiveId) => restoreFromArchive(user.uid, archiveId);

  // 멤버 목록 (id 포함)
  const memberList = useMemo(() => {
    return members.map((m) => ({ id: m.uid || m.id, ...m }));
  }, [members]);

  // Monthly
  const monthlyTodos   = useMemo(() => todos.filter((t) => inMonth(t, selYear, selMonth)),   [todos,   selYear, selMonth]);
  const monthlyArchive = useMemo(() => archive.filter((t) => inMonth(t, selYear, selMonth)), [archive, selYear, selMonth]);
  const monthlyAll     = useMemo(() => [...monthlyTodos, ...monthlyArchive], [monthlyTodos, monthlyArchive]);

  const mTotal   = monthlyAll.length;
  const mDone    = monthlyAll.filter((t) => t.done || t.archivedAt).length;
  const mRate    = mTotal === 0 ? '0%' : Math.round((mDone / mTotal) * 100) + '%';
  const mOverdue = monthlyTodos.filter(isOverdue).length;

  // Yearly
  const yearlyTodos   = useMemo(() => todos.filter((t) => inYear(t, selYear)),   [todos,   selYear]);
  const yearlyArchive = useMemo(() => archive.filter((t) => inYear(t, selYear)), [archive, selYear]);
  const yearlyAll     = useMemo(() => [...yearlyTodos, ...yearlyArchive], [yearlyTodos, yearlyArchive]);

  const yTotal   = yearlyAll.length;
  const yDone    = yearlyAll.filter((t) => t.done || t.archivedAt).length;
  const yRate    = yTotal === 0 ? '0%' : Math.round((yDone / yTotal) * 100) + '%';
  const yOverdue = yearlyTodos.filter(isOverdue).length;

  // Monthly chart for yearly view
  const monthlyChartData = useMemo(() =>
    Array.from({ length: 12 }, (_, m) => {
      const items = [...todos, ...archive].filter((t) => inMonth(t, selYear, m));
      const done  = items.filter((t) => t.done || t.archivedAt).length;
      return { month: m, total: items.length, done };
    }), [todos, archive, selYear]);

  const maxDone = Math.max(...monthlyChartData.map((d) => d.done), 1);

  const SectionTitle = ({ children, count }) => (
    <div style={{ fontSize: 12, fontWeight: 700, color: '#7a7a8e', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      {children}
      {count !== undefined && (
        <span style={{ background: '#23232b', borderRadius: 99, fontFamily: 'Space Mono, monospace', fontSize: 11, padding: '1px 8px', color: '#7a7a8e', fontWeight: 400 }}>
          {count}
        </span>
      )}
    </div>
  );

  const NavBtn = ({ onClick, children }) => (
    <button onClick={onClick}
      style={{ background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 8, color: '#7a7a8e', cursor: 'pointer', fontSize: 16, padding: '5px 14px', transition: 'all .15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c6af7'; e.currentTarget.style.color = '#a78bfa'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; }}>
      {children}
    </button>
  );

  const TodayBtn = ({ onClick, label }) => (
    <button onClick={onClick}
      style={{ background: 'transparent', border: '1.5px solid #2e2e38', borderRadius: 8, color: '#7a7a8e', cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 12, padding: '5px 14px', transition: 'all .15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c6af7'; e.currentTarget.style.color = '#a78bfa'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; }}>
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', animation: 'fadeUp .4s ease' }}>

      {/* 기간 탭 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
        {[{ key: 'weekly', label: '주간' }, { key: 'monthly', label: '월간' }, { key: 'yearly', label: '연간' }].map((tab) => (
          <button key={tab.key} onClick={() => setPeriod(tab.key)} style={{
            background: period === tab.key ? '#7c6af7' : 'transparent',
            border: `1.5px solid ${period === tab.key ? '#7c6af7' : '#2e2e38'}`,
            borderRadius: 99, color: period === tab.key ? '#fff' : '#7a7a8e',
            cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 13,
            fontWeight: period === tab.key ? 500 : 400, padding: '6px 20px', transition: 'all .15s',
          }}
          onMouseEnter={(e) => { if (period !== tab.key) { e.currentTarget.style.borderColor = '#7c6af7'; e.currentTarget.style.color = '#a78bfa'; } }}
          onMouseLeave={(e) => { if (period !== tab.key) { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; } }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 주간 ── */}
      {period === 'weekly' && (
        <div>
          {/* 주간 KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {(() => {
              const today = new Date();
              const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6);
              const wa = dateStr(weekAgo);
              const td = dateStr(today);
              const wArchive = archive.filter((t) => t.archivedAt && fmtDate(t.archivedAt) >= wa && fmtDate(t.archivedAt) <= td);
              const wTodos   = [...todos, ...archive].filter((t) => {
                const ds = fmtDate(new Date(t.createdAt));
                return ds >= wa && ds <= td;
              });
              const wDone     = wArchive.length;
              const wTotal    = wTodos.length;
              const wRate     = wTotal === 0 ? '0%' : Math.round((wDone / wTotal) * 100) + '%';
              const wOverdue  = todos.filter(isOverdue).length;
              return <>
                <KpiCard label="이번 주 등록" value={wTotal}   colorClass="accent"  sub="최근 7일" />
                <KpiCard label="이번 주 완료" value={wDone}    colorClass="success" sub="최근 7일" />
                <KpiCard label="주간 완료율"  value={wRate}    colorClass="warn"    sub={`${wDone}/${wTotal}`} />
                <KpiCard label="기간초과"      value={wOverdue} colorClass="danger"  sub="현재 미완료" />
              </>;
            })()}
          </div>

          {/* 주간 완료 차트 */}
          <SectionTitle>일별 등록 / 완료</SectionTitle>
          <WeeklyChart archive={archive} todos={todos} />

          {/* 멤버별 칸반 현황 */}
          <SectionTitle>멤버별 칸반 현황</SectionTitle>
          <MemberKanbanStatus cards={cards} members={memberList} />

          {/* 평균 소요 시간 */}
          <SectionTitle>완료 소요 시간</SectionTitle>
          <div style={{ marginBottom: 24 }}>
            <AvgCompletionTime archive={archive} />
          </div>
        </div>
      )}

      {/* ── 월간 ── */}
      {period === 'monthly' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <NavBtn onClick={() => { if (selMonth === 0) { setSelYear(y => y - 1); setSelMonth(11); } else setSelMonth(m => m - 1); }}>‹</NavBtn>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 17, fontWeight: 700, color: '#a78bfa', flex: 1, textAlign: 'center' }}>
              {selYear}년 {selMonth + 1}월
            </div>
            <NavBtn onClick={() => { if (selMonth === 11) { setSelYear(y => y + 1); setSelMonth(0); } else setSelMonth(m => m + 1); }}>›</NavBtn>
            <TodayBtn onClick={() => { setSelYear(now.getFullYear()); setSelMonth(now.getMonth()); }} label="이번 달" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <KpiCard label="전체"    value={mTotal}   colorClass="accent"  sub="등록된 할 일" />
            <KpiCard label="완료"    value={mDone}    colorClass="success" sub="완료된 항목" />
            <KpiCard label="완료율"  value={mRate}    colorClass="warn"    sub={`${mDone}/${mTotal}`} />
            <KpiCard label="기간초과" value={mOverdue} colorClass="danger"  sub="미완료 지연" />
          </div>

          <SectionTitle>우선순위별 완료</SectionTitle>
          <div style={{ marginBottom: 24 }}>
            <PriorityBars todos={monthlyAll} />
          </div>

          {/* 멤버별 칸반 현황 */}
          <SectionTitle>멤버별 칸반 현황</SectionTitle>
          <MemberKanbanStatus cards={cards} members={memberList} />

          {/* 평균 소요 시간 */}
          <SectionTitle>완료 소요 시간</SectionTitle>
          <div style={{ marginBottom: 24 }}>
            <AvgCompletionTime archive={monthlyArchive} />
          </div>

          <SectionTitle count={monthlyArchive.length}>아카이브</SectionTitle>
          <ArchiveList items={monthlyArchive} onRestore={handleRestore} />
        </div>
      )}

      {/* ── 연간 ── */}
      {period === 'yearly' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <NavBtn onClick={() => setSelYear(y => y - 1)}>‹</NavBtn>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 17, fontWeight: 700, color: '#a78bfa', flex: 1, textAlign: 'center' }}>
              {selYear}년
            </div>
            <NavBtn onClick={() => setSelYear(y => y + 1)}>›</NavBtn>
            <TodayBtn onClick={() => setSelYear(now.getFullYear())} label="올해" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <KpiCard label="전체"    value={yTotal}   colorClass="accent"  sub="등록된 할 일" />
            <KpiCard label="완료"    value={yDone}    colorClass="success" sub="완료된 항목" />
            <KpiCard label="완료율"  value={yRate}    colorClass="warn"    sub={`${yDone}/${yTotal}`} />
            <KpiCard label="기간초과" value={yOverdue} colorClass="danger"  sub="미완료 지연" />
          </div>

          {/* 월별 완료 차트 */}
          <SectionTitle>월별 완료 현황</SectionTitle>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8, alignItems: 'end',
            background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 12,
            padding: '20px 16px 14px', marginBottom: 24,
          }}>
            {monthlyChartData.map((d) => {
              const barH = maxDone === 0 ? 2 : Math.max(2, Math.round((d.done / maxDone) * 80));
              const isCurrent = d.month === now.getMonth() && selYear === now.getFullYear();
              return (
                <div key={d.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: 80, alignItems: 'flex-end' }}>
                    <div style={{
                      width: '70%', borderRadius: '4px 4px 0 0', minHeight: 2,
                      background: d.done > 0 ? 'linear-gradient(180deg, #a78bfa, #7c6af7)' : '#7c6af7',
                      opacity: d.done > 0 ? 0.9 : 0.3,
                      height: barH, transition: 'height .5s cubic-bezier(.4,0,.2,1)',
                    }} />
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#7a7a8e' }}>{d.done}</div>
                  <div style={{ fontSize: 10, color: isCurrent ? '#a78bfa' : '#7a7a8e', fontWeight: isCurrent ? 700 : 400 }}>
                    {MONTHS[d.month]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 멤버별 칸반 현황 */}
          <SectionTitle>멤버별 칸반 현황</SectionTitle>
          <MemberKanbanStatus cards={cards} members={memberList} />

          {/* 평균 소요 시간 */}
          <SectionTitle>완료 소요 시간</SectionTitle>
          <div style={{ marginBottom: 24 }}>
            <AvgCompletionTime archive={yearlyArchive} />
          </div>

          <SectionTitle count={yearlyArchive.length}>아카이브</SectionTitle>
          <ArchiveList items={yearlyArchive} onRestore={handleRestore} />
        </div>
      )}
    </div>
  );
}

export default SummaryView;
