import { create } from 'zustand';
import { Capacitor } from '@capacitor/core';

export type PlatformMode = 'auto' | 'app' | 'web';

interface PlatformState {
  /** 플랫폼 모드: 'auto' (Capacitor 감지) | 'app' (강제 네이티브 앱) | 'web' (강제 웹 브라우저) */
  mode: PlatformMode;
  /** 현재 환경이 모바일 앱(또는 강제 앱 시뮬레이션)인지 여부 */
  isApp: boolean;
  /** 현재 환경이 웹 브라우저인지 여부 */
  isWeb: boolean;
  /** 플랫폼 모드 수동 변경 (Dev 테스트용) */
  setMode: (mode: PlatformMode) => void;
}

const getInitialMode = (): PlatformMode => {
  if (typeof window === 'undefined') return 'auto';
  const saved = localStorage.getItem('dduktak_platform_mode') as PlatformMode | null;
  return saved || 'auto';
};

const computeIsApp = (mode: PlatformMode): boolean => {
  if (mode === 'app') return true;
  if (mode === 'web') return false;
  return Capacitor.isNativePlatform();
};

export const usePlatformStore = create<PlatformState>((set) => {
  const initialMode = getInitialMode();
  const initialIsApp = computeIsApp(initialMode);

  return {
    mode: initialMode,
    isApp: initialIsApp,
    isWeb: !initialIsApp,
    setMode: (newMode: PlatformMode) => {
      const isApp = computeIsApp(newMode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dduktak_platform_mode', newMode);
      }
      set({
        mode: newMode,
        isApp,
        isWeb: !isApp,
      });
    },
  };
});
