const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const databaseURL = process.env.FIREBASE_DATABASE_URL;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL,
});

const db = admin.database();

async function archiveDoneItems() {
  console.log('🔍 완료 항목 자동 아카이브 시작...');

  const membersSnap = await db.ref('members').get();
  if (!membersSnap.exists()) {
    console.log('멤버 없음, 종료');
    return;
  }

  const members = membersSnap.val();
  const uids = Object.keys(members);
  let totalArchived = 0;

  for (const uid of uids) {
    const todosSnap = await db.ref(`personal/${uid}`).get();
    if (!todosSnap.exists()) continue;

    const todos = todosSnap.val();
    const updates = {};

    for (const [id, todo] of Object.entries(todos)) {
      if (todo.done && !todo.archived) {
        updates[`${id}/archived`] = true;
        updates[`${id}/archivedAt`] = Date.now();
        totalArchived++;
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.ref(`personal/${uid}`).update(updates);
      console.log(`  ✅ ${members[uid]?.name || uid}: ${Object.keys(updates).length / 2}개 아카이브`);
    }
  }

  console.log(`\n✅ 완료: 총 ${totalArchived}개 항목이 아카이브됨`);
}

archiveDoneItems()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 오류:', err);
    process.exit(1);
  });
