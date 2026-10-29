import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppSplashScreen } from '@/components/common/AppSplashScreen';
import { useAppSplashStore } from '@/store/useAppSplashStore';
import { usePlatformStore } from '@/store/usePlatformStore';
import * as serverWarmup from '@/services/serverWarmupService';

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
    usePlatformStore.setState({ isApp: true, isWeb: false, mode: 'app' });
    useAppSplashStore.setState({ isVisible: true, hasPlayedThisSession: false });
    // 기본적으로 서버가 켜져 있는 상태(Hot Start)로 모킹
    vi.spyOn(serverWarmup, 'pingBackend').mockResolvedValue({
      ok: true,
      status: 200,
      durationMs: 50,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('스플래시 노출 상태일 때 브랜드 슬로건과 서비스 타이틀을 렌더링해야 한다', () => {
    render(<AppSplashScreen minDuration={1000} />);

    expect(screen.getByRole('status', { name: '앱 로딩 인트로 화면' })).toBeInTheDocument();
    expect(screen.getByAltText('오늘의 뚝딱 공식 로고')).toBeInTheDocument();
    expect(screen.getByText('1인 가구 냉장고 맞춤 요리 솔루션')).toBeInTheDocument();
    expect(screen.getByText(/뚝딱/)).toBeInTheDocument();
    expect(screen.getByText('냉장고 재료를 준비하고 있어요...')).toBeInTheDocument();
  });

  it('서버 웜업 완료 및 최소 노출 시간 경과 시 스토어의 hideSplash가 호출되어 화면이 닫혀야 한다', async () => {
    render(<AppSplashScreen minDuration={1000} />);

    expect(useAppSplashStore.getState().isVisible).toBe(true);

    // pingBackend 비동기 응답 해결
    await act(async () => {
      await Promise.resolve();
    });

    // 최소 시간(1000ms) + 100% 완료 페이드아웃 타이머(350ms) 진행
    act(() => {
      vi.advanceTimersByTime(1400);
    });

    expect(useAppSplashStore.getState().isVisible).toBe(false);
  });

  it('서버가 Cold Start(슬립 상태)인 경우 스플래시가 닫히지 않고 서버 깨우기 안내 문구로 전환되어야 한다', async () => {
    // 서버 응답 실패 모킹 (부팅 중)
    vi.spyOn(serverWarmup, 'pingBackend').mockResolvedValue({
      ok: false,
      status: 502,
      durationMs: 200,
    });

    render(<AppSplashScreen minDuration={1000} />);

    await act(async () => {
      await Promise.resolve();
    });

    // 1000ms 경과해도 아직 닫히지 않아야 함
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(useAppSplashStore.getState().isVisible).toBe(true);

    // 2600ms 경과 시 친절한 서버 깨우기 문구 노출
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(
      screen.getByText(/냉장고 서버를 깨우고 있어요! 잠시만 기다려주세요/i),
    ).toBeInTheDocument();
    expect(useAppSplashStore.getState().isVisible).toBe(true);

    // 80초 초과 지연 시 비상 탈출 버튼 (새로고침, 앱 둘러보기) 노출
    act(() => {
      vi.advanceTimersByTime(80000);
    });
    expect(screen.getByRole('button', { name: '새로고침' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '앱 둘러보기' })).toBeInTheDocument();
  });

  it('isVisible이 false일 때는 스플래시 화면이 렌더링되지 않아야 한다', () => {
    useAppSplashStore.setState({ isVisible: false });
    render(<AppSplashScreen minDuration={1000} />);

    expect(screen.queryByRole('status', { name: '앱 로딩 인트로 화면' })).not.toBeInTheDocument();
  });
});
