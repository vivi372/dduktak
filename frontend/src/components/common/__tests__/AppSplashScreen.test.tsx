import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppSplashScreen } from '@/components/common/AppSplashScreen';
import { useAppSplashStore } from '@/store/useAppSplashStore';

// Capacitor 및 SplashScreen 모킹
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: {
    hide: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('AppSplashScreen 컴포넌트 단위 테스트', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAppSplashStore.setState({ isVisible: true, hasPlayedThisSession: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('스플래시 노출 상태일 때 브랜드 슬로건과 서비스 타이틀을 렌더링해야 한다', () => {
    render(<AppSplashScreen duration={1000} />);

    expect(screen.getByRole('status', { name: '앱 로딩 인트로 화면' })).toBeInTheDocument();
    expect(screen.getByText('1인 가구 냉장고 맞춤 요리 솔루션')).toBeInTheDocument();
    expect(screen.getByText('뚝딱')).toBeInTheDocument();
    expect(screen.getByText('냉장고 재료를 준비하고 있어요...')).toBeInTheDocument();
  });

  it('지정된 시간이 경과하면 스토어의 hideSplash가 호출되어 화면에서 닫혀야 한다', () => {
    render(<AppSplashScreen duration={1000} />);

    expect(useAppSplashStore.getState().isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(useAppSplashStore.getState().isVisible).toBe(false);
  });

  it('isVisible이 false일 때는 스플래시 화면이 렌더링되지 않아야 한다', () => {
    useAppSplashStore.setState({ isVisible: false });
    render(<AppSplashScreen duration={1000} />);

    expect(screen.queryByRole('status', { name: '앱 로딩 인트로 화면' })).not.toBeInTheDocument();
  });
});
