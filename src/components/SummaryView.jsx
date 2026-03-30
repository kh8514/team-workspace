import { useState, useMemo } from 'react';
import usePersonalStore from '../store/personalStore';
import useAuthStore from '../store/authStore';
import useTeamStore from '../store/teamStore';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { fmtTimestamp, dateStr, inMonth, inYear, isOverdue } from '../utils/date';

import KpiCard from './summary/KpiCard';
import PriorityBars from './summary/PriorityBars';
import ArchiveList from './summary/ArchiveList';
import WeeklyChart from './summary/WeeklyChart';
import MemberKanbanStatus from './summary/MemberKanbanStatus';
import AvgCompletionTime from './summary/AvgCompletionTime';

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

// ── 메인 ─────────────────────────────────────────────────
function SummaryView() {
  const { todos, archive, restoreFromArchive } = usePersonalStore();
  const { user } = useAuthStore();
  const { cards, members } = useTeamStore();
  const { isMobile } = useBreakpoint();

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
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {(() => {
              const today = new Date();
              const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6);
              const wa = dateStr(weekAgo);
              const td = dateStr(today);
              const wArchive   = archive.filter((t) => t.archivedAt && fmtTimestamp(t.archivedAt) >= wa && fmtTimestamp(t.archivedAt) <= td);
              const wKanban    = cards.filter((c) => c.status === 'done' && c.updatedAt && fmtTimestamp(new Date(c.updatedAt)) >= wa && fmtTimestamp(new Date(c.updatedAt)) <= td);
              const wTodos     = [...todos, ...archive].filter((t) => {
                const ds = fmtTimestamp(new Date(t.createdAt));
                return ds >= wa && ds <= td;
              });
              const wDone     = wArchive.length + wKanban.length;
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
          <WeeklyChart archive={archive} todos={todos} cards={cards} />

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

          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
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

          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <KpiCard label="전체"    value={yTotal}   colorClass="accent"  sub="등록된 할 일" />
            <KpiCard label="완료"    value={yDone}    colorClass="success" sub="완료된 항목" />
            <KpiCard label="완료율"  value={yRate}    colorClass="warn"    sub={`${yDone}/${yTotal}`} />
            <KpiCard label="기간초과" value={yOverdue} colorClass="danger"  sub="미완료 지연" />
          </div>

          {/* 월별 완료 차트 */}
          <SectionTitle>월별 완료 현황</SectionTitle>
          <div style={{
            overflowX: isMobile ? 'auto' : 'visible',
            marginBottom: 24,
          }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8, alignItems: 'end',
            background: '#1a1a1f', border: '1.5px solid #2e2e38', borderRadius: 12,
            padding: '20px 16px 14px',
            minWidth: isMobile ? 600 : 'auto',
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
