const { onValueCreated, onValueUpdated } = require('firebase-functions/v2/database');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const db = getDatabase();

// FCM 토큰 목록 조회
async function getTokensForUsers(uids) {
  const tokens = [];
  await Promise.all(
    uids.map(async (uid) => {
      const snap = await db.ref(`fcmTokens/${uid}`).get();
      if (snap.exists()) {
        Object.values(snap.val()).forEach((t) => {
          if (t.token) tokens.push(t.token);
        });
      }
    })
  );
  return tokens;
}

// FCM 전송 (유효하지 않은 토큰 자동 제거)
async function sendToTokens(tokens, title, body) {
  if (!tokens.length) return;
  const msg = {
    notification: { title, body },
    webpush: {
      notification: {
        title,
        body,
        icon: '/team-workspace/icon-192.png',
        badge: '/team-workspace/icon-192.png',
      },
      fcmOptions: { link: '/team-workspace/' },
    },
    tokens,
  };
  try {
    const res = await getMessaging().sendEachForMulticast(msg);
    // 실패한 토큰 정리
    res.responses.forEach((r, i) => {
      if (!r.success && r.error?.code === 'messaging/registration-token-not-registered') {
        const tokenKey = tokens[i].slice(-20);
        // 어느 uid 것인지 모르므로 fcmTokens 전체에서 검색 후 제거
        db.ref('fcmTokens').orderByChild('token').equalTo(tokens[i]).once('value', (snap) => {
          snap.forEach((child) => child.ref.remove());
        });
      }
    });
  } catch (err) {
    console.error('FCM 전송 실패:', err);
  }
}

// 담당자 UIDs 추출 (하위 호환)
function getAssigneeIds(card) {
  if (card.assigneeIds && Array.isArray(card.assigneeIds) && card.assigneeIds.length) {
    return card.assigneeIds;
  }
  return card.assigneeId ? [card.assigneeId] : [];
}

// ── 카드 생성 → 담당자 알림 ─────────────────────────────────
exports.onCardCreated = onValueCreated(
  { ref: '/team/{cardId}', region: 'asia-northeast3' },
  async (event) => {
    const card = event.data.val();
    if (!card) return;

    const assigneeIds = getAssigneeIds(card).filter((id) => id !== card.authorId);
    if (!assigneeIds.length) return;

    const tokens = await getTokensForUsers(assigneeIds);
    await sendToTokens(
      tokens,
      '새 팀 업무 배정',
      `${card.authorName || '팀원'}님이 "${card.title}" 업무를 배정했습니다.`
    );
  }
);

// ── 카드 상태 변경 → 담당자 알림 ────────────────────────────
exports.onCardStatusChanged = onValueUpdated(
  { ref: '/team/{cardId}', region: 'asia-northeast3' },
  async (event) => {
    const before = event.data.before.val();
    const after = event.data.after.val();
    if (!before || !after) return;
    if (before.status === after.status) return;

    const STATUS_LABEL = { todo: '할 일', inProgress: '진행 중', review: '검토', done: '완료' };
    const assigneeIds = getAssigneeIds(after);
    if (!assigneeIds.length) return;

    const tokens = await getTokensForUsers(assigneeIds);
    await sendToTokens(
      tokens,
      '업무 상태 변경',
      `"${after.title}" → ${STATUS_LABEL[after.status] || after.status}`
    );
  }
);

// ── 댓글 추가 → 카드 담당자 알림 ────────────────────────────
exports.onCommentCreated = onValueCreated(
  { ref: '/comments/{cardId}/{commentId}', region: 'asia-northeast3' },
  async (event) => {
    const comment = event.data.val();
    if (!comment) return;

    const cardId = event.params.cardId;
    const cardSnap = await db.ref(`team/${cardId}`).get();
    if (!cardSnap.exists()) return;

    const card = cardSnap.val();
    // 댓글 작성자 제외한 담당자에게만
    const assigneeIds = getAssigneeIds(card).filter((id) => id !== comment.authorId);
    if (!assigneeIds.length) return;

    const tokens = await getTokensForUsers(assigneeIds);
    await sendToTokens(
      tokens,
      `댓글: ${card.title}`,
      `${comment.authorName || '팀원'}: ${comment.text?.slice(0, 60) || ''}`
    );
  }
);
