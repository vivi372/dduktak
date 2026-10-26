import { create } from 'zustand';

export const ONBOARDING_STORAGE_KEY = 'dduktak_has_seen_onboarding';

interface OnboardingState {
  /** 앱 최초 실행 가이드 온보딩 열람 완료 여부 (localStorage 영속) */
  hasSeenOnboarding: boolean;
  /** 온보딩 완료 처리 (홈 또는 로그인으로 이동 전 호출) */
  markOnboardingAsSeen: () => void;
  /** 온보딩 이력 초기화 (개발자 검수 및 다시보기용) */
  resetOnboarding: () => void;
}

const getInitialState = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: getInitialState(),

  markOnboardingAsSeen: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    }
    set({ hasSeenOnboarding: true });
  },

  resetOnboarding: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
    set({ hasSeenOnboarding: false });
  },
}));
