import { db } from './config';
import { ref, push, update, remove, onValue, off, get } from 'firebase/database';

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

// 멤버 목록 조회
export const getMembers = async () => {
  const membersRef = ref(db, 'members');
  const snapshot = await get(membersRef);
  if (snapshot.exists()) {
    return Object.entries(snapshot.val())
      .map(([uid, value]) => ({ uid, ...value }));
  }
  return [];
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

// 카드 삭제
export const deleteCard = (cardId) => {
  const cardRef = ref(db, `team/${cardId}`);
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
export const addComment = (cardId, commentData) => {
  const commentsRef = ref(db, `comments/${cardId}`);
  return push(commentsRef, {
    ...commentData,
    createdAt: Date.now(),
  });
};

// 댓글 삭제
export const deleteComment = (cardId, commentId) => {
  const commentRef = ref(db, `comments/${cardId}/${commentId}`);
  return remove(commentRef);
};