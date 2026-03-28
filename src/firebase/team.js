import { db } from './config';
import { auth } from './config';
import { ref, push, update, remove, onValue, off, get, set, runTransaction } from 'firebase/database';

// 칸반 카드 실시간 구독
export const subscribeCards = (callback) => {
  const cardsRef = ref(db, 'team');
  onValue(cardsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const cards = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => b.createdAt - a.createdAt);
      callback(cards);
    } else {
      callback([]);
    }
  });
  return () => off(cardsRef);
};

// 멤버 목록 실시간 구독
export const subscribeMembers = (callback) => {
  const membersRef = ref(db, 'members');
  onValue(membersRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(Object.entries(snapshot.val()).map(([uid, value]) => ({ uid, ...value })));
    } else {
      callback([]);
    }
  });
  return () => off(membersRef);
};

// 카드 추가 (syncId 포함)
export const addCard = (cardData) => {
  const cardsRef = ref(db, 'team');
  return push(cardsRef, {
    ...cardData,
    status: cardData.status || 'todo',
    createdAt: Date.now(),
  });
};

// 카드 수정
export const updateCard = (cardId, data) => {
  const cardRef = ref(db, `team/${cardId}`);
  return update(cardRef, { ...data, updatedAt: Date.now() });
};

// 카드 상태 변경
export const moveCard = (cardId, status) => {
  const cardRef = ref(db, `team/${cardId}`);
  return update(cardRef, { status, updatedAt: Date.now() });
};

// 카드 삭제 (작성자만 가능)
export const deleteCard = async (cardId) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('로그인이 필요합니다.');
  const cardRef = ref(db, `team/${cardId}`);
  const snapshot = await get(cardRef);
  if (snapshot.exists() && snapshot.val().authorId !== uid) {
    throw new Error('카드 작성자만 삭제할 수 있습니다.');
  }
  return remove(cardRef);
};

// syncId로 카드 조회
export const getCardBySyncId = async (syncId) => {
  const cardsRef = ref(db, 'team');
  const snapshot = await get(cardsRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.val();
  const entry = Object.entries(data).find(([, v]) => v.syncId === syncId);
  return entry ? { id: entry[0], ...entry[1] } : null;
};

// 댓글 구독
export const subscribeComments = (cardId, callback) => {
  const commentsRef = ref(db, `comments/${cardId}`);
  onValue(commentsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const comments = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => a.createdAt - b.createdAt);
      callback(comments);
    } else {
      callback([]);
    }
  });
  return () => off(commentsRef);
};

// 댓글 추가
export const addComment = async (cardId, commentData) => {
  const commentsRef = ref(db, `comments/${cardId}`);
  const result = await push(commentsRef, { ...commentData, createdAt: Date.now() });
  await runTransaction(ref(db, `team/${cardId}/commentCount`), (n) => (n || 0) + 1);
  return result;
};

// 댓글 삭제 (작성자만 가능)
export const deleteComment = async (cardId, commentId) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('로그인이 필요합니다.');
  const commentRef = ref(db, `comments/${cardId}/${commentId}`);
  const snapshot = await get(commentRef);
  if (snapshot.exists() && snapshot.val().authorId !== uid) {
    throw new Error('댓글 작성자만 삭제할 수 있습니다.');
  }
  await remove(commentRef);
  await runTransaction(ref(db, `team/${cardId}/commentCount`), (n) => Math.max((n || 0) - 1, 0));
};

// ── 팀 공통 태그 ──────────────────────────────────────────

// 팀 태그 실시간 구독
export const subscribeTeamTags = (callback) => {
  const tagsRef = ref(db, 'teamTags');
  onValue(tagsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(Object.entries(snapshot.val()).map(([id, v]) => ({ id, ...v })));
    } else {
      callback([]);
    }
  });
  return () => off(tagsRef);
};

// 팀 태그 저장 (label을 id로 사용, 중복 방지)
export const saveTeamTag = (tag) => {
  const tagId = tag.label.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/g, '');
  if (!tagId) return Promise.resolve();
  return set(ref(db, `teamTags/${tagId}`), { label: tag.label, color: tag.color });
};

// 팀 태그 삭제
export const removeTeamTag = (tagId) => remove(ref(db, `teamTags/${tagId}`));