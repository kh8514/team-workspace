import { create } from "zustand";
import { auth } from "../firebase/config"
import { onAuthStateChanged } from "firebase/auth";
import { loginWithGoogle, logout } from "../firebase/auth"


const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    console: null,

    // 로그인
    login: async () => {
        try {
            set({ error: null });
            await loginWithGoogle();
        } catch (error) {
            set({ error: error.code === 'auth/popup-blocked' ? 'auth/popup-blocked' : error.message });
        }
    },

    // 로그아웃
    logout: async () => {
        await logout();
        set({ user: null })
    },

    // 인증 상태 감지 (앱 시작 시 1번 실행)
    initAuth: () => {
        onAuthStateChanged(auth, (user) => {
            set({ user, loading: false });
        });
    },
}));

export default useAuthStore;