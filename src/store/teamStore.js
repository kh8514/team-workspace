import { create } from 'zustand';
import {
  subscribeCards,
  subscribeMembers,
  subscribeTeamTags,
  saveTeamTag,
  removeTeamTag,
  addCard,
  updateCard,
  moveCard,
  deleteCard,
} from '../firebase/team';
import { setTodoDoneBySyncId, getTodoBySyncId, deleteTodo as deleteTodoFn, addTodo as addTodoFn, archiveTodos, updateTodoDates, updateTodoPriority } from '../firebase/personal';
import { logActivity, buildActivity } from '../firebase/activity';

const STATUS_LABEL = { todo: '할 일', inProgress: '진행 중', review: '검토', done: '완료' };

// 하위 호환: assigneeIds 배열 반환 (구 assigneeId 필드 지원)
export const getAssigneeIds = (card) =>
  card.assigneeIds?.length ? card.assigneeIds : (card.assigneeId ? [card.assigneeId] : []);

// 주 담당자 (syncId 연동용)
const getPrimaryAssigneeId = (card) => getAssigneeIds(card)[0] || null;

const useTeamStore = create((set, get) => ({
  cards: [],
  members: [],
  teamTags: [],
  unsubscribe: null,
  unsubscribeMembers: null,
  unsubscribeTeamTags: null,
  filterAssignee: 'all',
  filterPriority: 'all',
  filterTag: null,

  // 실시간 구독
  subscribe: () => {
    const unsubscribe = subscribeCards((cards) => set({ cards }));
    set({ unsubscribe });
  },

  // 구독 해제
  unsubscribeAll: () => {
    const { unsubscribe, unsubscribeMembers, unsubscribeTeamTags } = get();
    if (unsubscribe) unsubscribe();
    if (unsubscribeMembers) unsubscribeMembers();
    if (unsubscribeTeamTags) unsubscribeTeamTags();
    set({ cards: [], members: [], teamTags: [], unsubscribe: null, unsubscribeMembers: null, unsubscribeTeamTags: null });
  },

  // 멤버 목록 실시간 구독
  loadMembers: () => {
    const unsubscribeMembers = subscribeMembers((members) => set({ members }));
    set({ unsubscribeMembers });
  },

  // 팀 태그 실시간 구독
  loadTeamTags: () => {
    const unsubscribeTeamTags = subscribeTeamTags((teamTags) => set({ teamTags }));
    set({ unsubscribeTeamTags });
  },

  // 팀 태그 저장
  saveTeamTag: (tag) => saveTeamTag(tag),

  // 팀 태그 삭제
  removeTeamTag: (tagId) => removeTeamTag(tagId),

  // 필터
  setFilterAssignee: (value) => set({ filterAssignee: value }),
  setFilterPriority: (value) => set({ filterPriority: value }),
  setFilterTag: (tag) => set({ filterTag: tag }),

  // 카드 이동 → 주 담당자 투두 완료 동기화
  moveCard: async (cardId, status, card, actor) => {
    try {
      await moveCard(cardId, status);

      const primaryId = getPrimaryAssigneeId(card);
      if (card.syncId && primaryId) {
        const isDone = status === 'done';
        if (status === 'done' || card.status === 'done') {
          await setTodoDoneBySyncId(primaryId, card.syncId, isDone);
        }
      }

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

  // 칸반 카드 추가
  addCard: async (cardData, actor) => {
    try {
      const syncId = Date.now().toString(36) + Math.random().toString(36).slice(2);
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const assigneeIds = cardData.assigneeIds?.length ? cardData.assigneeIds : (cardData.assigneeId ? [cardData.assigneeId] : []);
      const assigneeId = assigneeIds[0] || cardData.authorId;

      await addCard({ ...cardData, assigneeIds, assigneeId, syncId, startDate: today, endDate: today, dueDate: today });

      if (assigneeId) {
        await addTodoFn(assigneeId, cardData.title, syncId, today, today, cardData.priority || 'medium');
      }

      if (actor) {
        await logActivity(buildActivity('card_created', actor, { title: cardData.title }));
      }
    } catch (err) {
      console.error('카드 추가 실패:', err);
      throw err;
    }
  },

  // 카드 업데이트 → 주 담당자 투두 날짜/우선순위 동기화
  updateCard: async (cardId, data, card) => {
    try {
      // assigneeIds 변경 시 assigneeId(주 담당자)도 함께 업데이트
      const updateData = { ...data };
      if (data.assigneeIds) {
        updateData.assigneeId = data.assigneeIds[0] || null;
      }
      await updateCard(cardId, updateData);

      const primaryId = getPrimaryAssigneeId(card);
      if (!card?.syncId || !primaryId) return;
      const todo = await getTodoBySyncId(primaryId, card.syncId);
      if (!todo) return;
      if ('startDate' in data || 'endDate' in data) {
        await updateTodoDates(primaryId, todo.id, data.startDate ?? null, data.endDate ?? null);
      }
      if ('priority' in data) {
        await updateTodoPriority(primaryId, todo.id, data.priority);
      }
    } catch (err) {
      console.error('카드 수정 실패:', err);
      throw err;
    }
  },

  // 카드 완료 처리 → 주 담당자 투두 아카이브 + 카드 삭제
  completeCard: async (cardId, card, actor) => {
    try {
      const primaryId = getPrimaryAssigneeId(card);
      if (card?.syncId && primaryId) {
        const todo = await getTodoBySyncId(primaryId, card.syncId);
        if (todo) await archiveTodos(primaryId, [todo.id]);
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

  // 카드 삭제 → 주 담당자 투두도 함께 삭제
  deleteCard: async (cardId, card, actor) => {
    try {
      const primaryId = getPrimaryAssigneeId(card);
      if (card?.syncId && primaryId) {
        const todo = await getTodoBySyncId(primaryId, card.syncId);
        if (todo) await deleteTodoFn(primaryId, todo.id);
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

  // 필터링된 카드 (assigneeIds 배열 + 태그 필터 지원)
  getFilteredCards: () => {
    const { cards, filterAssignee, filterPriority, filterTag } = get();
    return cards.filter((card) => {
      const ids = getAssigneeIds(card);
      const matchAssignee = filterAssignee === 'all' || ids.includes(filterAssignee);
      const matchPriority = filterPriority === 'all' || card.priority === filterPriority;
      const matchTag = !filterTag || (card.tags || []).some((t) => t.label === filterTag.label);
      return matchAssignee && matchPriority && matchTag;
    });
  },
}));

export default useTeamStore;
