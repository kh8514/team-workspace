import { auth, db } from './config';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';

// 화이트리스트 — .env의 VITE_WHITELIST (콤마 구분)
const WHITELIST = import.meta.env.VITE_WHITELIST
  ? import.meta.env.VITE_WHITELIST.split(',').map((e) => e.trim())
  : [];

// Google 로그인
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!WHITELIST.includes(user.email)) {
      await signOut(auth);
      throw new Error('접근 권한이 없습니다.');
    }

    const memberRef = ref(db, `members/${user.uid}`);
    const snapshot = await get(memberRef);
    if (!snapshot.exists()) {
      await set(memberRef, {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: Date.now(),
      });
    }

    return user;
  } catch (error) {
    if (error.code === 'auth/popup-blocked') {
      const err = new Error('POPUP_BLOCKED');
      err.code = 'auth/popup-blocked';
      throw err;
    }
    throw error;
  }
};

// 로그아웃
export const logout = async () => {
  await signOut(auth);
};