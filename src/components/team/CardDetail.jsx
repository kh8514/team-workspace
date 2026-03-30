import { useState, useEffect } from 'react';
import { X, Trash2, Send, Pencil } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useTeamStore, { getAssigneeIds } from '../../store/teamStore';
import { subscribeComments, addComment, deleteComment } from '../../firebase/team';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { TAG_COLORS, DEFAULT_TAG_COLOR, getTagColor } from '../../constants/tags';

const PRIORITY_STYLE = {
  high:   { bg: 'rgba(248,113,113,.18)', color: '#f87171',  border: 'rgba(248,113,113,.3)',  label: '높음' },
  medium: { bg: 'rgba(251,191,36,.15)',  color: '#fbbf24',  border: 'rgba(251,191,36,.3)',   label: '보통' },
  low:    { bg: 'rgba(52,211,153,.13)',  color: '#34d399',  border: 'rgba(52,211,153,.3)',   label: '낮음' },
};

const STATUS_OPTIONS = [
  { key: 'todo',       label: '📌 할 일' },
  { key: 'inProgress', label: '⚡ 진행 중' },
  { key: 'review',     label: '👀 검토' },
  { key: 'done',       label: '✅ 완료' },
];

const inputStyle = {
  width: '100%',
  background: '#23232b',
  border: '1.5px solid #2e2e38',
  borderRadius: 8,
  color: '#e8e8f0',
  fontFamily: 'Noto Sans KR, sans-serif',
  fontSize: 13,
  padding: '9px 12px',
  outline: 'none',
  transition: 'border-color .2s',
};

const labelStyle = {
  display: 'block',
  fontSize: 11,
  color: '#7a7a8e',
  fontWeight: 600,
  marginBottom: 6,
  letterSpacing: '.3px',
};

function CardDetail({ card, onClose }) {
  const { user } = useAuthStore();
  const { members, teamTags, updateCard, deleteCard, saveTeamTag } = useTeamStore();
  const { isMobile } = useBreakpoint();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: card.title,
    description: card.description || '',
    assigneeIds: getAssigneeIds(card),
    tags: card.tags || [],
    priority: card.priority || 'medium',
    startDate: card.startDate || '',
    endDate: card.endDate || card.dueDate || '',
    status: card.status,
    isTeam: card.isTeam || false,
  });
  const [tagInput, setTagInput] = useState('');
  const [tagColor, setTagColor] = useState(DEFAULT_TAG_COLOR);

  const toggleAssignee = (uid) => {
    const ids = editData.assigneeIds;
    setEditData({
      ...editData,
      assigneeIds: ids.includes(uid) ? ids.filter((id) => id !== uid) : [...ids, uid],
    });
  };

  const addTag = (label, color) => {
    const l = label.trim();
    if (!l || editData.tags.some((t) => t.label === l)) return;
    const tag = { label: l, color: color.id };
    setEditData({ ...editData, tags: [...editData.tags, tag] });
    saveTeamTag(tag);
    setTagInput('');
  };

  const removeTag = (label) =>
    setEditData({ ...editData, tags: editData.tags.filter((t) => t.label !== label) });

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput, tagColor);
    }
  };

  useEffect(() => {
    const unsub = subscribeComments(card.id, setComments);
    return () => unsub();
  }, [card.id]);

  const handleUpdate = () => {
    updateCard(card.id, {
      ...editData,
      assigneeId: editData.assigneeIds[0] || null,
      dueDate: editData.endDate,
    }, card);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('카드를 삭제할까요?')) {
      deleteCard(card.id, card);
      onClose();
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(card.id, {
      text: commentText.trim(),
      authorId: user.uid,
      authorName: user.displayName,
      authorPhoto: user.photoURL,
    });
    setCommentText('');
  };

  const cardAssignees = getAssigneeIds(card).map((id) => members.find((m) => m.uid === id)).filter(Boolean);
  const ps = PRIORITY_STYLE[card.priority] || PRIORITY_STYLE.medium;
  const statusLabel = STATUS_OPTIONS.find((s) => s.key === card.status)?.label || card.status;

  const startDate = card.startDate || '';
  const endDate = card.endDate || card.dueDate || '';

  const fmtDate = (s) => {
    if (!s) return '미정';
    const [y, m, d] = s.split('-');
    return `${y}.${m}.${d}`;
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => !isMobile && e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-card"
        style={{
          background: '#1a1a1f',
          border: isMobile ? 'none' : '1.5px solid #2e2e38',
          borderRadius: isMobile ? 0 : 16,
          width: '100%',
          maxWidth: isMobile ? '100%' : 520,
          maxHeight: isMobile ? '100dvh' : '90vh',
          height: isMobile ? '100dvh' : 'auto',
          overflowY: 'auto',
          animation: 'modalIn .2s ease',
        }}
      >
        {/* 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1.5px solid #2e2e38',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
              background: ps.bg, color: ps.color, border: `1.5px solid ${ps.border}`,
            }}>
              {ps.label}
            </span>
            <span style={{ fontSize: 12, color: '#7a7a8e' }}>{statusLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {card.authorId === user.uid && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ background: 'none', border: 'none', color: '#7a7a8e', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'color .15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#a78bfa'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#7a7a8e'}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={handleDelete}
                  style={{ background: 'none', border: 'none', color: '#7a7a8e', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'color .15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#7a7a8e'}
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#7a7a8e', cursor: 'pointer', padding: 4, borderRadius: 6, fontSize: 18, lineHeight: 1, transition: 'color .15s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#e8e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#7a7a8e'}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          {isEditing ? (
            /* ── 수정 폼 ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>제목</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                  onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
                />
              </div>
              <div>
                <label style={labelStyle}>설명</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                  onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                  onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
                  placeholder="설명 (선택)"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* 팀 업무일 때만 담당자 선택 표시 */}
                {editData.isTeam && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>담당자</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {members.map((m) => {
                        const selected = editData.assigneeIds.includes(m.uid);
                        return (
                          <button
                            key={m.uid}
                            type="button"
                            onClick={() => toggleAssignee(m.uid)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '5px 10px', borderRadius: 20, cursor: 'pointer',
                              fontSize: 12, fontFamily: 'Noto Sans KR, sans-serif',
                              border: `1.5px solid ${selected ? '#7c6af7' : '#2e2e38'}`,
                              background: selected ? 'rgba(124,106,247,.15)' : '#23232b',
                              color: selected ? '#a78bfa' : '#7a7a8e',
                              transition: 'all .15s',
                            }}
                          >
                            {m.photoURL
                              ? <img src={m.photoURL} alt={m.name} style={{ width: 16, height: 16, borderRadius: '50%' }} />
                              : <div style={{ width: 16, height: 16, borderRadius: '50%', background: selected ? '#7c6af7' : '#3e3e50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff' }}>{m.name?.[0]}</div>
                            }
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <label style={labelStyle}>우선순위</label>
                  <select
                    value={editData.priority}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                    style={{ ...inputStyle }}
                    onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                    onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
                  >
                    <option value="high">🔴 높음</option>
                    <option value="medium">🟡 보통</option>
                    <option value="low">🟢 낮음</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>상태</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    style={{ ...inputStyle }}
                    onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                    onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>시작일</label>
                  <input
                    type="date"
                    value={editData.startDate}
                    onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                    style={{ ...inputStyle }}
                    onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                    onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>종료일</label>
                  <input
                    type="date"
                    value={editData.endDate}
                    onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                    style={{ ...inputStyle }}
                    onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                    onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>구분</label>
                  <div style={{ display: 'flex', background: '#23232b', border: '1.5px solid #2e2e38', borderRadius: 8, padding: 3, width: 'fit-content' }}>
                    {[{ v: false, label: '개인 업무' }, { v: true, label: '팀 업무' }].map(({ v, label }) => (
                      <button key={label} type="button" onClick={() => setEditData({ ...editData, isTeam: v })}
                        style={{
                          padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                          fontSize: 12, fontWeight: 600, fontFamily: 'Noto Sans KR, sans-serif', transition: 'all .15s',
                          background: editData.isTeam === v ? '#7c6af7' : 'transparent',
                          color: editData.isTeam === v ? '#fff' : '#7a7a8e',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 태그 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>태그</label>

                  {/* 색상 선택 */}
                  <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                    {TAG_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setTagColor(c)}
                        style={{
                          width: 18, height: 18, borderRadius: '50%', cursor: 'pointer',
                          background: c.color, border: tagColor.id === c.id ? `2.5px solid #fff` : '2.5px solid transparent',
                          padding: 0, flexShrink: 0, transition: 'border-color .15s',
                        }}
                      />
                    ))}
                  </div>

                  {/* 태그 입력 */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="태그 입력 후 Enter"
                      style={{ ...inputStyle, flex: 1, padding: '7px 10px' }}
                      onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                      onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
                    />
                    <button
                      type="button"
                      onClick={() => addTag(tagInput, tagColor)}
                      style={{
                        background: tagColor.bg, border: `1.5px solid ${tagColor.border}`,
                        borderRadius: 7, color: tagColor.color, cursor: 'pointer',
                        fontSize: 13, padding: '0 12px', flexShrink: 0,
                      }}
                    >
                      추가
                    </button>
                  </div>

                  {/* 팀 공통 태그 */}
                  {teamTags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                      {teamTags.map((t) => {
                        const tc = getTagColor(t.color);
                        const already = editData.tags.some((x) => x.label === t.label);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => already ? removeTag(t.label) : addTag(t.label, tc)}
                            style={{
                              fontSize: 11, padding: '3px 9px', borderRadius: 99, cursor: 'pointer',
                              background: already ? tc.bg : 'transparent',
                              border: `1.5px solid ${already ? tc.border : '#2e2e38'}`,
                              color: already ? tc.color : '#7a7a8e',
                              transition: 'all .15s',
                            }}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 현재 카드 태그 */}
                  {editData.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {editData.tags.map((t) => {
                        const tc = getTagColor(t.color);
                        return (
                          <span
                            key={t.label}
                            style={{
                              fontSize: 11, padding: '3px 8px', borderRadius: 99,
                              background: tc.bg, border: `1.5px solid ${tc.border}`, color: tc.color,
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            {t.label}
                            <button
                              type="button"
                              onClick={() => removeTag(t.label)}
                              style={{ background: 'none', border: 'none', color: tc.color, cursor: 'pointer', padding: 0, fontSize: 13, lineHeight: 1, opacity: 0.7 }}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleUpdate}
                  style={{ flex: 1, background: '#7c6af7', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, fontWeight: 500, padding: '10px', transition: 'background .15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#a78bfa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#7c6af7'}
                >
                  저장
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{ flex: 1, background: '#23232b', border: 'none', borderRadius: 8, color: '#7a7a8e', cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, fontWeight: 500, padding: '10px', transition: 'all .15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#e8e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#7a7a8e'}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            /* ── 상세 보기 ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e8e8f0', lineHeight: 1.4, flex: 1 }}>
                  {card.title}
                </h2>
                {card.isTeam && (
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, flexShrink: 0, marginTop: 3,
                    background: 'rgba(124,106,247,.15)', border: '1.5px solid rgba(124,106,247,.35)', color: '#a78bfa', fontWeight: 600 }}>
                    팀 업무
                  </span>
                )}
              </div>
              {card.description && (
                <p style={{ fontSize: 14, color: '#7a7a8e', lineHeight: 1.6 }}>{card.description}</p>
              )}

              {/* 태그 */}
              {(card.tags || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(card.tags || []).map((t) => {
                    const tc = getTagColor(t.color);
                    return (
                      <span
                        key={t.label}
                        style={{
                          fontSize: 11, padding: '3px 9px', borderRadius: 99,
                          background: tc.bg, border: `1.5px solid ${tc.border}`, color: tc.color,
                        }}
                      >
                        {t.label}
                      </span>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: card.isTeam ? '1fr 1fr' : '1fr', gap: 10 }}>
                {/* 담당자 — 팀 업무만 표시 */}
                {card.isTeam && (
                  <div style={{ background: '#23232b', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ fontSize: 11, color: '#7a7a8e', fontWeight: 600, marginBottom: 6, letterSpacing: '.3px' }}>담당자</p>
                    {cardAssignees.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {cardAssignees.map((a) => (
                          <div key={a.uid} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {a.photoURL
                              ? <img src={a.photoURL} alt={a.name} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                              : <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#7c6af7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>{a.name?.[0]}</div>
                            }
                            <span style={{ fontSize: 13, color: '#e8e8f0', fontWeight: 500 }}>{a.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: '#7a7a8e' }}>미지정</span>
                    )}
                  </div>
                )}
                {/* 기간 */}
                <div style={{ background: '#23232b', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, color: '#7a7a8e', fontWeight: 600, marginBottom: 6, letterSpacing: '.3px' }}>기간</p>
                  <span style={{ fontSize: 13, color: '#e8e8f0', fontWeight: 500, fontFamily: 'Space Mono, monospace' }}>
                    {startDate || endDate
                      ? `${fmtDate(startDate)} ~ ${fmtDate(endDate)}`
                      : '미정'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── 댓글 (수정 중엔 숨김) ── */}
          {!isEditing && <div style={{ borderTop: '1.5px solid #2e2e38', marginTop: 20, paddingTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#7a7a8e', marginBottom: 14, letterSpacing: '.3px' }}>
              💬 댓글 {comments.length}
            </p>

            {/* 댓글 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, maxHeight: 200, overflowY: 'auto' }}>
              {comments.length === 0 ? (
                <p style={{ fontSize: 12, color: '#3e3e50', textAlign: 'center', padding: '12px 0' }}>
                  첫 댓글을 남겨보세요
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} style={{ display: 'flex', gap: 10 }}>
                    <img
                      src={comment.authorPhoto}
                      alt={comment.authorName}
                      style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, border: '1.5px solid #2e2e38' }}
                    />
                    <div style={{ flex: 1, background: '#23232b', borderRadius: 10, padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa' }}>{comment.authorName}</span>
                        {comment.authorId === user.uid && (
                          <button
                            onClick={() => deleteComment(card.id, comment.id)}
                            style={{ background: 'none', border: 'none', color: '#7a7a8e', cursor: 'pointer', fontSize: 13, padding: '0 2px', transition: 'color .15s' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#7a7a8e'}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: '#e8e8f0', lineHeight: 1.5 }}>{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 댓글 입력 */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="댓글을 입력하세요..."
                style={{
                  flex: 1,
                  background: '#23232b',
                  border: '1.5px solid #2e2e38',
                  borderRadius: 10,
                  color: '#e8e8f0',
                  fontFamily: 'Noto Sans KR, sans-serif',
                  fontSize: 13,
                  padding: '9px 12px',
                  outline: 'none',
                  transition: 'border-color .2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#7c6af7'}
                onBlur={(e) => e.target.style.borderColor = '#2e2e38'}
              />
              <button
                onClick={handleAddComment}
                style={{
                  background: '#7c6af7',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '0 14px',
                  transition: 'background .15s',
                  display: 'flex', alignItems: 'center',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#a78bfa'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#7c6af7'}
              >
                <Send size={14} />
              </button>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}

export default CardDetail;
