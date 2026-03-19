import { db } from './config';
import { ref, push, query, orderByChild, limitToLast, onValue, off } from 'firebase/database';

// 활동 유형별 아이콘 + 텍스트 생성
export const buildActivity = (type, actor, payload) => {
  const base = {
    type,
    actorId:    actor.uid,
    actorName:  actor.displayName || actor.name || '알 수 없음',
    actorPhoto: actor.photoURL || null,
    createdAt:  Date.now(),
  };

  switch (type) {
    case 'todo_created':
      return { ...base, icon: '✏️', title: payload.text, detail: '투두를 추가했습니다' };
    case 'todo_done':
      return { ...base, icon: '✅', title: payload.text, detail: '투두를 완료했습니다' };
    case 'todo_archived':
      return { ...base, icon: '🗂', title: payload.text || `${payload.count}개 항목`, detail: '완료 항목을 삭제했습니다' };
    case 'todo_shared':
      return { ...base, icon: '🔗', title: payload.text, detail: '칸반에 공유했습니다' };
    case 'card_created':
      return { ...base, icon: '🃏', title: payload.title, detail: `칸반 카드를 추가했습니다` };
    case 'card_moved':
      return { ...base, icon: '🔀', title: payload.title, detail: `${payload.from} → ${payload.to}` };
    case 'card_completed':
      return { ...base, icon: '🏁', title: payload.title, detail: '카드를 완료 처리했습니다' };
    case 'card_deleted':
      return { ...base, icon: '🗑', title: payload.title, detail: '카드를 삭제했습니다' };
    case 'comment_added':
      return { ...base, icon: '💬', title: payload.cardTitle, detail: `댓글: ${payload.text.slice(0, 30)}${payload.text.length > 30 ? '…' : ''}` };
    default:
      return { ...base, icon: '📌', title: payload.title || '', detail: '' };
  }
};

// 활동 로그 추가
export const logActivity = (activityData) => {
  const actRef = ref(db, 'activity');
  return push(actRef, activityData);
};

// 활동 피드 실시간 구독 (최근 50개)
export const subscribeActivity = (callback) => {
  const actRef = query(ref(db, 'activity'), orderByChild('createdAt'), limitToLast(50));
  onValue(actRef, (snapshot) => {
    if (snapshot.exists()) {
      const items = Object.entries(snapshot.val())
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.createdAt - a.createdAt);
      callback(items);
    } else {
      callback([]);
    }
  });
  return () => off(actRef);
};
