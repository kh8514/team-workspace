/**
 * 마감일 초과 카드 → FCM 푸시 알림 발송
 * GitHub Actions에서 매일 오전 9시 KST 실행
 */
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const databaseURL    = process.env.FIREBASE_DATABASE_URL;

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL });

const db = admin.database();

const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

async function main() {
  const today = todayYMD();
  console.log(`[overdue-notify] 실행일: ${today}`);

  // 1. 칸반 카드 조회
  const cardsSnap = await db.ref('team/cards').once('value');
  const cardsData  = cardsSnap.val() || {};

  const overdueCards = Object.values(cardsData).filter(
    (c) => c.endDate && c.endDate < today && c.status !== 'done' && c.status !== 'archived'
  );

  if (!overdueCards.length) {
    console.log('[overdue-notify] 마감 초과 카드 없음 — 종료');
    return;
  }

  console.log(`[overdue-notify] 초과 카드 ${overdueCards.length}건`);

  // 2. 카드별 담당자 UID 수집 (중복 제거)
  const assigneeSet = new Set(overdueCards.map((c) => c.assigneeId).filter(Boolean));

  // 3. 담당자별 FCM 토큰 수집 + 발송
  let sentCount = 0;

  for (const uid of assigneeSet) {
    const userCards = overdueCards.filter((c) => c.assigneeId === uid);

    const tokenSnap = await db.ref(`fcmTokens/${uid}`).once('value');
    const tokenData  = tokenSnap.val();
    if (!tokenData) {
      console.log(`  [skip] ${uid} — 토큰 없음`);
      continue;
    }

    const tokens = Object.values(tokenData).map((t) => t.token).filter(Boolean);
    if (!tokens.length) continue;

    const title = `⚠️ 마감 초과 ${userCards.length}건`;
    const body  = userCards.slice(0, 3).map((c) => `• ${c.title}`).join('\n')
                + (userCards.length > 3 ? `\n외 ${userCards.length - 3}건` : '');

    const message = {
      notification: { title, body },
      data: { type: 'overdue', count: String(userCards.length) },
      tokens,
    };

    try {
      const res = await admin.messaging().sendEachForMulticast(message);
      sentCount += res.successCount;
      console.log(`  [sent] ${uid} — ${res.successCount}/${tokens.length} 성공`);

      // 만료된 토큰 삭제
      res.responses.forEach((r, i) => {
        if (!r.success) {
          const key = tokens[i].slice(-20);
          db.ref(`fcmTokens/${uid}/${key}`).remove();
          console.log(`  [cleanup] 만료 토큰 제거: ...${key}`);
        }
      });
    } catch (err) {
      console.error(`  [error] ${uid}:`, err.message);
    }
  }

  console.log(`[overdue-notify] 완료 — 총 ${sentCount}건 발송`);
}

main().catch(console.error);
