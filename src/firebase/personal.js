import { db } from './config';
import { ref, push, update, remove, onValue, off, get } from 'firebase/database';

// 개인 투두 실시간 구독 (archived 제외)
export const subscribeTodos = (uid, callback) => {
  const todosRef = ref(db, `personal/${uid}`);
  onValue(todosRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const todos = Object.entries(data)
        .filter(([, v]) => !v.archived)
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => b.createdAt - a.createdAt);
      callback(todos);
    } else {
      callback([]);
    }
  });
  return () => off(todosRef);
};

// 투두 추가 (syncId 없이 추가, 공유 시에만 syncId 설정)
export const addTodo = (uid, text, syncId = null, startDate = null, endDate = null, priority = 'medium') => {
  const todosRef = ref(db, `personal/${uid}`);
  return push(todosRef, {
    text,
    done: false,
    syncId: syncId || null,
    createdAt: Date.now(),
    startDate: startDate || null,
    endDate: endDate || null,
    priority: priority || 'medium',
  });
};

// 투두에 syncId 설정 (칸반 공유 시)
export const updateTodoSyncId = (uid, todoId, syncId) => {
  const todoRef = ref(db, `personal/${uid}/${todoId}`);
  return update(todoRef, { syncId });
};

// 완료 토글
export const toggleTodo = (uid, todoId, done) => {
  const todoRef = ref(db, `personal/${uid}/${todoId}`);
  return update(todoRef, { done: !done });
};

// 투두 삭제
export const deleteTodo = (uid, todoId) => {
  const todoRef = ref(db, `personal/${uid}/${todoId}`);
  return remove(todoRef);
};

// 투두 수정
export const updateTodo = (uid, todoId, text) => {
  const todoRef = ref(db, `personal/${uid}/${todoId}`);
  return update(todoRef, { text, updatedAt: Date.now() });
};

// syncId로 투두 조회
export const getTodoBySyncId = async (uid, syncId) => {
  const todosRef = ref(db, `personal/${uid}`);
  const snapshot = await get(todosRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.val();
  const entry = Object.entries(data).find(([, v]) => v.syncId === syncId);
  return entry ? { id: entry[0], ...entry[1] } : null;
};

// syncId로 투두 완료 상태 변경
export const setTodoDoneBySyncId = async (uid, syncId, done) => {
  const todo = await getTodoBySyncId(uid, syncId);
  if (!todo) return;
  const todoRef = ref(db, `personal/${uid}/${todo.id}`);
  return update(todoRef, { done });
};

// 날짜 범위 업데이트
export const updateTodoDates = (uid, todoId, startDate, endDate) => {
  const todoRef = ref(db, `personal/${uid}/${todoId}`);
  return update(todoRef, { startDate: startDate ?? null, endDate: endDate ?? null });
};

// 우선순위 업데이트
export const updateTodoPriority = (uid, todoId, priority) => {
  const todoRef = ref(db, `personal/${uid}/${todoId}`);
  return update(todoRef, { priority });
};

// 완료된 투두 아카이브 (archived 플래그로 처리, 별도 노드 불필요)
export const archiveTodos = async (uid, todoIds) => {
  for (const todoId of todoIds) {
    const todoRef = ref(db, `personal/${uid}/${todoId}`);
    await update(todoRef, { archived: true, archivedAt: Date.now() });
  }
};

// 아카이브 실시간 구독 (personal 노드에서 archived=true 필터링)
export const subscribeArchive = (uid, callback) => {
  const todosRef = ref(db, `personal/${uid}`);
  onValue(todosRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const items = Object.entries(data)
        .filter(([, v]) => v.archived)
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
      callback(items);
    } else {
      callback([]);
    }
  });
  return () => off(todosRef);
};

// 아카이브에서 복원 (플래그 해제)
export const restoreFromArchive = async (uid, archiveId) => {
  const todoRef = ref(db, `personal/${uid}/${archiveId}`);
  await update(todoRef, { archived: false, archivedAt: null, done: false });
};
