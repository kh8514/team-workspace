import { create } from 'zustand';
import {
  subscribeTodos,
  addTodo,
  toggleTodo,
  deleteTodo,
  updateTodo,
  getTodoBySyncId,
  updateTodoDates,
  updateTodoPriority,
  updateTodoSyncId,
  archiveTodos,
  subscribeArchive,
  restoreFromArchive,
} from '../firebase/personal';
import { addCard, getCardBySyncId, moveCard, deleteCard } from '../firebase/team';

const usePersonalStore = create((set, get) => ({
  todos: [],
  archive: [],
  filter: 'all',       // all | active | done
  unsubscribe: null,
  unsubscribeArchiveFn: null,

  // 실시간 구독
  subscribe: (uid) => {
    const unsub = subscribeTodos(uid, (todos) => set({ todos }));
    set({ unsubscribe: unsub });
  },

  // 구독 해제
  unsubscribeAll: () => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();
    set({ todos: [], unsubscribe: null });
  },

  // 아카이브 구독
  subscribeArchive: (uid) => {
    const unsub = subscribeArchive(uid, (archive) => set({ archive }));
    set({ unsubscribeArchiveFn: unsub });
  },

  // 아카이브 구독 해제
  unsubscribeArchive: () => {
    const { unsubscribeArchiveFn } = get();
    if (unsubscribeArchiveFn) unsubscribeArchiveFn();
    set({ archive: [], unsubscribeArchiveFn: null });
  },

  // 필터
  setFilter: (filter) => set({ filter }),

  // 필터링된 투두
  getFilteredTodos: () => {
    const { todos, filter } = get();
    if (filter === 'active') return todos.filter((t) => !t.done);
    if (filter === 'done')   return todos.filter((t) => t.done);
    return todos;
  },

  // 투두 추가 (칸반 자동 생성 없음 — 공유 버튼으로 수동 공유)
  addTodo: async (uid, text, user, startDate = null, endDate = null, priority = 'medium') => {
    const ref = await addTodo(uid, text, null, startDate, endDate, priority);
    return { id: ref.key, text, startDate, endDate, priority, syncId: null };
  },

  // 투두를 칸반에 공유 (공유 버튼 클릭 시)
  shareTodoToKanban: async (uid, todoId, todo, user) => {
    const syncId = Date.now().toString(36) + Math.random().toString(36).slice(2);

    // 1. 칸반 카드 생성
    await addCard({
      title: todo.text,
      syncId,
      status: 'todo',
      authorId: uid,
      authorName: user.displayName,
      assigneeId: uid,
      priority: todo.priority || 'medium',
      description: '',
      dueDate: todo.endDate || '',
    });

    // 2. 투두에 syncId 저장
    await updateTodoSyncId(uid, todoId, syncId);
  },

  // 칸반 공유 취소 (카드 삭제 + syncId 제거)
  cancelTodoShare: async (uid, todoId, syncId) => {
    // 1. 칸반 카드 삭제
    if (syncId) {
      const card = await getCardBySyncId(syncId);
      if (card) await deleteCard(card.id);
    }

    // 2. 투두에서 syncId 제거
    await updateTodoSyncId(uid, todoId, null);
  },

  // 완료 토글 → 칸반 카드 상태 동기화
  toggleTodo: async (uid, todoId, done, syncId) => {
    // 1. 투두 토글
    await toggleTodo(uid, todoId, done);

    // 2. 칸반 카드 상태 변경
    if (syncId) {
      const card = await getCardBySyncId(syncId);
      if (card) {
        // done: true → 칸반 'done' / done: false → 칸반 'todo'
        await moveCard(card.id, !done ? 'done' : 'todo');
      }
    }
  },

  // 투두 삭제 → syncId 있으면 칸반 카드도 함께 삭제
  deleteTodo: async (uid, todoId, syncId) => {
    if (syncId) {
      const card = await getCardBySyncId(syncId);
      if (card) await deleteCard(card.id);
    }
    await deleteTodo(uid, todoId);
  },
  updateTodo: (uid, todoId, text) => updateTodo(uid, todoId, text),
  updateTodoDates: (uid, todoId, startDate, endDate) => updateTodoDates(uid, todoId, startDate, endDate),
  updateTodoPriority: (uid, todoId, priority) => updateTodoPriority(uid, todoId, priority),

  // 완료된 항목 아카이브 + 연결된 칸반 카드 삭제
  archiveDoneTodos: async (uid) => {
    const { todos } = get();
    const doneTodos = todos.filter((t) => t.done);
    if (!doneTodos.length) return 0;

    // syncId 있는 항목은 칸반 카드도 삭제
    for (const todo of doneTodos) {
      if (todo.syncId) {
        const card = await getCardBySyncId(todo.syncId);
        if (card) await deleteCard(card.id);
      }
    }

    await archiveTodos(uid, doneTodos.map((t) => t.id));
    return doneTodos.length;
  },

  // 아카이브에서 복원
  restoreFromArchive: (uid, archiveId) => restoreFromArchive(uid, archiveId),
}));

export default usePersonalStore;
