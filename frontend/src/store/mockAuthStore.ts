import { create } from 'zustand';
import type { UserProfile } from '@/types/user';

const INITIAL_DEV_USER: UserProfile = {
  userId: '3f7f754c-d561-4b93-b79b-9d73a4f29f2a',
  email: 'user@dduktak.com',
  nickname: '뚝딱이',
  userTag: '1024',
  profileImage:
    'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/profiles/Default%20Profile.png',
  status: 'ACTIVE',
  quietTimeStart: '21:00:00',
  quietTimeEnd: '08:00:00',
  loginProvider: 'email',
};

interface MockAuthState {
  /** 로그인 상태 여부 */
  isLoggedIn: boolean;
  /** 현재 로그인된 유저 프로필 */
  user: UserProfile;
  /** 냉장고 식재료 보유 여부 (true: 정상 브리핑, false: 재료 0개 Empty State) */
  hasIngredients: boolean;
  /** 온보딩 웰컴 팝업 모달 노출 여부 */
  showWelcomeModal: boolean;

  /** 구글 소셜 간편 로그인 (목업 동작: 로그인 후 웰컴 모달 오픈) */
  login: (provider: 'google') => void;
  /** 일반 이메일 로그인 */
  loginWithEmail: (email: string) => void;
  /** 일반 이메일 회원가입 (입력된 닉네임과 함께 가입 후 웰컴 모달 오픈) */
  signupWithEmail: (email: string, nickname: string) => void;
  /** 로그아웃 처리 */
  logout: () => void;
  /** 식재료 보유 상태 전환 (개발자 검수용) */
  setHasIngredients: (has: boolean) => void;
  /** 프로필 정보(닉네임, 프로필 이미지) 수정 */
  updateProfile: (nickname: string, profileImage?: string) => void;
  /** 야간 방해금지 시간 설정 */
  updateQuietTime: (start: string, end: string) => void;
  /** 회원 탈퇴 (세션 파기 및 탈퇴 처리) */
  withdraw: () => void;
  /** 계정 이메일 변경 (이메일 인증 승인 완료 시뮬레이션) */
  changeEmail: (newEmail: string) => void;
  /** 로그인 프로바이더 변경 (소셜 vs 이메일 검수 시뮬레이터용) */
  setLoginProvider: (provider: 'email' | 'google') => void;
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
  user: INITIAL_DEV_USER,
  hasIngredients: true,
  showWelcomeModal: false,

  login: (provider) => {
    set((state) => ({
      isLoggedIn: true,
      showWelcomeModal: true,
      user: {
        ...state.user,
        loginProvider: provider,
        email: 'google_user@gmail.com',
      },
    }));
  },

  loginWithEmail: (email) => {
    set((state) => ({
      isLoggedIn: true,
      user: { ...state.user, email: email || state.user.email, loginProvider: 'email' },
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
        loginProvider: 'email',
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

  updateProfile: (nickname, profileImage) => {
    set((state) => ({
      user: {
        ...state.user,
        nickname: nickname.trim() || state.user.nickname,
        profileImage: profileImage || state.user.profileImage,
      },
    }));
  },

  updateQuietTime: (start, end) => {
    set((state) => ({
      user: {
        ...state.user,
        quietTimeStart: start,
        quietTimeEnd: end,
      },
    }));
  },

  withdraw: () => {
    set((state) => ({
      isLoggedIn: false,
      showWelcomeModal: false,
      user: {
        ...state.user,
        status: 'WITHDRAWN',
      },
    }));
  },

  changeEmail: (newEmail) => {
    set((state) => ({
      user: {
        ...state.user,
        email: newEmail.trim(),
      },
    }));
  },

  setLoginProvider: (provider) => {
    set((state) => ({
      user: {
        ...state.user,
        loginProvider: provider,
      },
    }));
  },

  openWelcomeModal: () => {
    set({ showWelcomeModal: true });
  },

  closeWelcomeModal: () => {
    set({ showWelcomeModal: false });
  },
}));
