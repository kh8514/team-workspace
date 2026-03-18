import { useState, useMemo } from 'react';
import usePersonalStore from '../store/personalStore';
import useAuthStore from '../store/authStore';

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

// Check if a todo was created or modified in a given month/year
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

function KpiCard({ label, value, colorClass, sub }) {
  const colorMap = {
    accent: '#a78bfa',
    success: '#34d399',
    warn: '#fbbf24',
    danger: '#f87171',
    text: '#e8e8f0',
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
  const total = todos.filter((t) => t.done).length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {priorities.map((p) => {
        const count = todos.filter((t) => t.done && (t.priority || 'medium') === p).length;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
      {items.map((item) => {
        const ps = PRIORITY_STYLE[item.priority || 'medium'];
        return (
          <div key={item.id} style={{
            background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 10, padding: '11px 14px',
            display: 'flex', alignItems: 'center', gap: 10, animation: 'itemIn .2s ease',
          }}>
            <div style={{ flex: 1, fontSize: 14, color: '#55556a', textDecoration: 'line-through', textDecorationColor: '#55556a', wordBreak: 'break-all' }}>
              {item.text}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#7a7a8e' }}>
                {fmtDate(item.archivedAt)}
              </div>
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

function SummaryView() {
  const { todos, archive, restoreFromArchive } = usePersonalStore();
  const { user } = useAuthStore();

  const now = new Date();
  const [period, setPeriod] = useState('monthly'); // monthly | yearly
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth()); // 0-based

  const handleRestore = (archiveId) => {
    restoreFromArchive(user.uid, archiveId);
  };

  // Monthly data
  const monthlyTodos = useMemo(() => todos.filter((t) => inMonth(t, selYear, selMonth)), [todos, selYear, selMonth]);
  const monthlyArchive = useMemo(() => archive.filter((t) => inMonth(t, selYear, selMonth)), [archive, selYear, selMonth]);
  const monthlyAll = useMemo(() => [...monthlyTodos, ...monthlyArchive], [monthlyTodos, monthlyArchive]);

  const mTotal = monthlyAll.length;
  const mDone = monthlyAll.filter((t) => t.done || t.archivedAt).length;
  const mRate = mTotal === 0 ? '0' : Math.round((mDone / mTotal) * 100) + '%';
  const mOverdue = monthlyTodos.filter(isOverdue).length;

  // Yearly data
  const yearlyTodos = useMemo(() => todos.filter((t) => inYear(t, selYear)), [todos, selYear]);
  const yearlyArchive = useMemo(() => archive.filter((t) => inYear(t, selYear)), [archive, selYear]);
  const yearlyAll = useMemo(() => [...yearlyTodos, ...yearlyArchive], [yearlyTodos, yearlyArchive]);

  const yTotal = yearlyAll.length;
  const yDone = yearlyAll.filter((t) => t.done || t.archivedAt).length;
  const yRate = yTotal === 0 ? '0' : Math.round((yDone / yTotal) * 100) + '%';
  const yOverdue = yearlyTodos.filter(isOverdue).length;

  // Monthly chart data for yearly view
  const monthlyChartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const mItems = [...todos, ...archive].filter((t) => inMonth(t, selYear, m));
      const done = mItems.filter((t) => t.done || t.archivedAt).length;
      return { month: m, total: mItems.length, done };
    });
  }, [todos, archive, selYear]);

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
    <button
      onClick={onClick}
      style={{ background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 8, color: '#7a7a8e', cursor: 'pointer', fontSize: 16, padding: '5px 14px', transition: 'all .15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c6af7'; e.currentTarget.style.color = '#a78bfa'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; }}
    >
      {children}
    </button>
  );

  const TodayBtn = ({ onClick, label }) => (
    <button
      onClick={onClick}
      style={{ background: 'transparent', border: '1.5px solid #2e2e38', borderRadius: 8, color: '#7a7a8e', cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 12, padding: '5px 14px', transition: 'all .15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c6af7'; e.currentTarget.style.color = '#a78bfa'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', animation: 'fadeUp .4s ease' }}>

      {/* 기간 탭 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
        {[{ key: 'monthly', label: '월간' }, { key: 'yearly', label: '연간' }].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            style={{
              background: period === tab.key ? '#7c6af7' : 'transparent',
              border: `1.5px solid ${period === tab.key ? '#7c6af7' : '#2e2e38'}`,
              borderRadius: 99,
              color: period === tab.key ? '#fff' : '#7a7a8e',
              cursor: 'pointer',
              fontFamily: 'Noto Sans KR, sans-serif',
              fontSize: 13,
              fontWeight: period === tab.key ? 500 : 400,
              padding: '6px 20px',
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => { if (period !== tab.key) { e.currentTarget.style.borderColor = '#7c6af7'; e.currentTarget.style.color = '#a78bfa'; } }}
            onMouseLeave={(e) => { if (period !== tab.key) { e.currentTarget.style.borderColor = '#2e2e38'; e.currentTarget.style.color = '#7a7a8e'; } }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 월간 ── */}
      {period === 'monthly' && (
        <div>
          {/* 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <NavBtn onClick={() => {
              if (selMonth === 0) { setSelYear(y => y - 1); setSelMonth(11); }
              else setSelMonth(m => m - 1);
            }}>‹</NavBtn>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 17, fontWeight: 700, color: '#a78bfa', flex: 1, textAlign: 'center' }}>
              {selYear}년 {selMonth + 1}월
            </div>
            <NavBtn onClick={() => {
              if (selMonth === 11) { setSelYear(y => y + 1); setSelMonth(0); }
              else setSelMonth(m => m + 1);
            }}>›</NavBtn>
            <TodayBtn onClick={() => { setSelYear(now.getFullYear()); setSelMonth(now.getMonth()); }} label="이번 달" />
          </div>

          {/* KPI 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <KpiCard label="전체" value={mTotal} colorClass="accent" sub="등록된 할 일" />
            <KpiCard label="완료" value={mDone} colorClass="success" sub="완료된 항목" />
            <KpiCard label="완료율" value={mRate} colorClass="warn" sub={`${mDone}/${mTotal}`} />
            <KpiCard label="기간초과" value={mOverdue} colorClass="danger" sub="미완료 지연" />
          </div>

          {/* 우선순위 바 */}
          <SectionTitle>우선순위별 완료</SectionTitle>
          <div style={{ marginBottom: 24 }}>
            <PriorityBars todos={monthlyAll} />
          </div>

          {/* 아카이브 */}
          <SectionTitle count={monthlyArchive.length}>아카이브</SectionTitle>
          <ArchiveList items={monthlyArchive} onRestore={handleRestore} />
        </div>
      )}

      {/* ── 연간 ── */}
      {period === 'yearly' && (
        <div>
          {/* 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <NavBtn onClick={() => setSelYear(y => y - 1)}>‹</NavBtn>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 17, fontWeight: 700, color: '#a78bfa', flex: 1, textAlign: 'center' }}>
              {selYear}년
            </div>
            <NavBtn onClick={() => setSelYear(y => y + 1)}>›</NavBtn>
            <TodayBtn onClick={() => setSelYear(now.getFullYear())} label="올해" />
          </div>

          {/* KPI 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <KpiCard label="전체" value={yTotal} colorClass="accent" sub="등록된 할 일" />
            <KpiCard label="완료" value={yDone} colorClass="success" sub="완료된 항목" />
            <KpiCard label="완료율" value={yRate} colorClass="warn" sub={`${yDone}/${yTotal}`} />
            <KpiCard label="기간초과" value={yOverdue} colorClass="danger" sub="미완료 지연" />
          </div>

          {/* 월별 차트 */}
          <SectionTitle>월별 완료 현황</SectionTitle>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8, alignItems: 'end',
            background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 12, padding: '20px 16px 14px',
            marginBottom: 24,
          }}>
            {monthlyChartData.map((d) => {
              const barHeight = maxDone === 0 ? 2 : Math.max(2, Math.round((d.done / maxDone) * 80));
              const isCurrent = d.month === now.getMonth() && selYear === now.getFullYear();
              return (
                <div key={d.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: 80, alignItems: 'flex-end' }}>
                    <div style={{
                      width: '70%', borderRadius: '4px 4px 0 0', minHeight: 2,
                      background: d.done > 0 ? 'linear-gradient(180deg, #a78bfa, #7c6af7)' : '#7c6af7',
                      opacity: d.done > 0 ? 0.9 : 0.3,
                      height: barHeight,
                      transition: 'height .5s cubic-bezier(.4,0,.2,1)',
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

          {/* 아카이브 */}
          <SectionTitle count={yearlyArchive.length}>아카이브</SectionTitle>
          <ArchiveList items={yearlyArchive} onRestore={handleRestore} />
        </div>
      )}
    </div>
  );
}

export default SummaryView;
