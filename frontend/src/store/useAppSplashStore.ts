import { create } from 'zustand';

interface AppSplashState {
  /** 현재 스플래시 오프닝 화면 노출 여부 */
  isVisible: boolean;
  /** 이번 세션에서 이미 스플래시 애니메이션이 재생되었는지 여부 */
  hasPlayedThisSession: boolean;
  /** 스플래시 화면 닫기 (메인/온보딩 화면으로 크로스페이드) */
  hideSplash: () => void;
  /** 스플래시 화면 다시 띄우기 (개발자 검수 및 시연용) */
  replaySplash: () => void;
}

export const useAppSplashStore = create<AppSplashState>((set) => ({
  // 브라우저 세션(sessionStorage) 기준 최초 1회만 자동 노출
  isVisible: typeof window !== 'undefined' ? !sessionStorage.getItem('dduktak_splash_shown') : true,
  hasPlayedThisSession: typeof window !== 'undefined' ? !!sessionStorage.getItem('dduktak_splash_shown') : false,

  hideSplash: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dduktak_splash_shown', 'true');
    }
    set({ isVisible: false, hasPlayedThisSession: true });
  },

  replaySplash: () => {
    set({ isVisible: true });
  },
}));
