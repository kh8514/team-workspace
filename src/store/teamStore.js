import { create } from 'zustand';
import {
  subscribeCards,
  getMembers,
  addCard,
  updateCard,
  moveCard,
  deleteCard,
} from '../firebase/team';
import { setTodoDoneBySyncId, getTodoBySyncId, deleteTodo as deleteTodoFn, addTodo as addTodoFn, archiveTodos, updateTodoDates, updateTodoPriority } from '../firebase/personal';
import { logActivity, buildActivity } from '../firebase/activity';

const STATUS_LABEL = { todo: '할 일', inProgress: '진행 중', review: '검토', done: '완료' };

const useTeamStore = create((set, get) => ({
  cards: [],
  members: [],
  unsubscribe: null,
  filterAssignee: 'all',
  filterPriority: 'all',

  // 실시간 구독
  subscribe: () => {
    const unsubscribe = subscribeCards((cards) => set({ cards }));
    set({ unsubscribe });
  },

  // 구독 해제
  unsubscribeAll: () => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();
    set({ cards: [], unsubscribe: null });
  },

  // 멤버 목록 로드
  loadMembers: async () => {
    try {
      const members = await getMembers();
      set({ members });
    } catch (err) {
      console.error('멤버 목록 로드 실패:', err);
    }
  },

  // 필터
  setFilterAssignee: (value) => set({ filterAssignee: value }),
  setFilterPriority: (value) => set({ filterPriority: value }),

  // 카드 이동 → 투두 완료 동기화
  moveCard: async (cardId, status, card, assigneeId, actor) => {
    try {
      // 1. 칸반 카드 이동
      await moveCard(cardId, status);

      // 2. syncId 있으면 투두 동기화
      if (card.syncId && assigneeId) {
        const isDone = status === 'done';
        if (status === 'done' || card.status === 'done') {
          await setTodoDoneBySyncId(assigneeId, card.syncId, isDone);
        }
      }

      // 3. 활동 로그
      if (actor) {
        await logActivity(buildActivity('card_moved', actor, {
          title: card.title,
          from: STATUS_LABEL[card.status] || card.status,
          to:   STATUS_LABEL[status] || status,
        }));
      }
    } catch (err) {
      console.error('카드 이동 실패:', err);
      throw err;
    }
  },

  // CRUD
  // 칸반 카드 추가 → 개인 투두에도 공유 상태로 추가 (오늘 날짜)
  addCard: async (cardData, actor) => {
    try {
      const syncId = Date.now().toString(36) + Math.random().toString(36).slice(2);
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      await addCard({ ...cardData, syncId, startDate: today, endDate: today, dueDate: today });

      const uid = cardData.assigneeId || cardData.authorId;
      if (uid) {
        await addTodoFn(uid, cardData.title, syncId, today, today, cardData.priority || 'medium');
      }

      // 활동 로그
      if (actor) {
        await logActivity(buildActivity('card_created', actor, { title: cardData.title }));
      }
    } catch (err) {
      console.error('카드 추가 실패:', err);
      throw err;
    }
  },

  // 카드 업데이트 → syncId 있으면 날짜/우선순위 투두에도 동기화
  updateCard: async (cardId, data, card) => {
    try {
      await updateCard(cardId, data);
      if (!card?.syncId || !card?.assigneeId) return;
      const todo = await getTodoBySyncId(card.assigneeId, card.syncId);
      if (!todo) return;
      if ('startDate' in data || 'endDate' in data) {
        await updateTodoDates(card.assigneeId, todo.id, data.startDate ?? null, data.endDate ?? null);
      }
      if ('priority' in data) {
        await updateTodoPriority(card.assigneeId, todo.id, data.priority);
      }
    } catch (err) {
      console.error('카드 수정 실패:', err);
      throw err;
    }
  },

  // 카드 완료 처리 → 투두 아카이브 + 카드 삭제
  completeCard: async (cardId, card, actor) => {
    try {
      if (card?.syncId && card?.assigneeId) {
        const todo = await getTodoBySyncId(card.assigneeId, card.syncId);
        if (todo) await archiveTodos(card.assigneeId, [todo.id]);
      }
      await deleteCard(cardId);

      if (actor) {
        await logActivity(buildActivity('card_completed', actor, { title: card.title }));
      }
    } catch (err) {
      console.error('카드 완료 처리 실패:', err);
      throw err;
    }
  },

  // 카드 삭제 → syncId 있으면 연결된 투두도 함께 삭제
  deleteCard: async (cardId, card, actor) => {
    try {
      if (card?.syncId && card?.assigneeId) {
        const todo = await getTodoBySyncId(card.assigneeId, card.syncId);
        if (todo) await deleteTodoFn(card.assigneeId, todo.id);
      }
      await deleteCard(cardId);

      if (actor) {
        await logActivity(buildActivity('card_deleted', actor, { title: card?.title || '' }));
      }
    } catch (err) {
      console.error('카드 삭제 실패:', err);
      throw err;
    }
  },

  // 필터링된 카드
  getFilteredCards: () => {
    const { cards, filterAssignee, filterPriority } = get();
    return cards.filter((card) => {
      const matchAssignee = filterAssignee === 'all' || card.assigneeId === filterAssignee;
      const matchPriority = filterPriority === 'all' || card.priority === filterPriority;
      return matchAssignee && matchPriority;
    });
  },
}));

export default useTeamStore;
