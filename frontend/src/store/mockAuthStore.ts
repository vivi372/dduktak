import { create } from 'zustand';
import { mockUser } from '@/mocks/user.mock';
import type { UserProfile } from '@/types/user';

interface MockAuthState {
  /** 로그인 상태 여부 */
  isLoggedIn: boolean;
  /** 현재 로그인된 유저 프로필 */
  user: UserProfile;
  /** 냉장고 식재료 보유 여부 (true: 정상 브리핑, false: 재료 0개 Empty State) */
  hasIngredients: boolean;
  /** 온보딩 웰컴 팝업 모달 노출 여부 */
  showWelcomeModal: boolean;

  /** 카카오/구글 소셜 간편 로그인 (목업 동작: 로그인 후 웰컴 모달 오픈) */
  login: (provider: 'kakao' | 'google') => void;
  /** 일반 이메일 로그인 */
  loginWithEmail: (email: string) => void;
  /** 일반 이메일 회원가입 (입력된 닉네임과 함께 가입 후 웰컴 모달 오픈) */
  signupWithEmail: (email: string, nickname: string) => void;
  /** 로그아웃 처리 */
  logout: () => void;
  /** 식재료 보유 상태 전환 (개발자 검수용) */
  setHasIngredients: (has: boolean) => void;
  /** 웰컴 모달 열기 */
  openWelcomeModal: () => void;
  /** 웰컴 모달 닫기 */
  closeWelcomeModal: () => void;
}

/**
 * 개발자 검수 및 UI 시나리오 제어용 전역 Mock 세션 스토어
 * (실제 백엔드/Supabase Auth 연동 전까지 컴포넌트 간 로그인 및 화면 상태를 동기화)
 */
export const useMockAuthStore = create<MockAuthState>((set) => ({
  isLoggedIn: true,
  user: mockUser,
  hasIngredients: true,
  showWelcomeModal: false,

  login: () => {
    set({
      isLoggedIn: true,
      showWelcomeModal: true,
    });
  },

  loginWithEmail: (email) => {
    set((state) => ({
      isLoggedIn: true,
      user: { ...state.user, email: email || state.user.email },
      showWelcomeModal: false,
    }));
  },

  signupWithEmail: (email, nickname) => {
    set((state) => ({
      isLoggedIn: true,
      user: {
        ...state.user,
        email: email || state.user.email,
        nickname: nickname || state.user.nickname,
      },
      showWelcomeModal: true,
    }));
  },

  logout: () => {
    set({
      isLoggedIn: false,
      showWelcomeModal: false,
    });
  },

  setHasIngredients: (hasIngredients) => {
    set({ hasIngredients });
  },

  openWelcomeModal: () => {
    set({ showWelcomeModal: true });
  },

  closeWelcomeModal: () => {
    set({ showWelcomeModal: false });
  },
}));
