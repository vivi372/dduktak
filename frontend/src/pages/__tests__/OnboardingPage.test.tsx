import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OnboardingPage from '@/pages/OnboardingPage';
import { useOnboardingStore, ONBOARDING_STORAGE_KEY } from '@/store/useOnboardingStore';

// useNavigate 모킹
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('OnboardingPage 최초 실행 사용자 가이드 온보딩 단위 테스트', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
    useOnboardingStore.setState({ hasSeenOnboarding: false });
  });

  it('초기 1단계 슬라이드(냉장고 D-Day 관리)를 정상적으로 렌더링해야 한다', () => {
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    expect(screen.getByText('D-Day 신호등 스마트 관리')).toBeInTheDocument();
    expect(screen.getByText(/버려지는 재료 없이/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '건너뛰기' })).toBeInTheDocument();
  });

  it('다음 버튼 클릭 시 2단계(영수증 AI 스캔) 슬라이드로 전환되어야 한다', async () => {
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    const nextBtn = screen.getByRole('button', { name: '다음' });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('1초 만에 쏙! AI 간편 스캔')).toBeInTheDocument();
      expect(screen.getByText(/장보고 온 영수증 한 장/)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '이전 슬라이드' })).toBeInTheDocument();
  });

  it('3단계까지 진행 후 시작하기 클릭 시 권한 사전 안내 다이얼로그가 노출되어야 한다', async () => {
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    // 3단계 슬라이드 인디케이터 직접 클릭
    fireEvent.click(screen.getByRole('button', { name: '3번째 슬라이드로 이동' }));

    await waitFor(() => {
      expect(screen.getByText('1인 가구 황금 레시피 매칭')).toBeInTheDocument();
      expect(screen.getByText(/남은 재료 맞춤 뚝딱 요리/)).toBeInTheDocument();
    });

    // 3단계 시작하기 버튼 클릭
    const startBtn = screen.getByRole('button', { name: /오늘의 뚝딱 시작하기/ });
    fireEvent.click(startBtn);

    // 권한 사전 안내 다이얼로그 확인
    await waitFor(() => {
      expect(screen.getByText('더 편리한 요리 생활을 위한 권한 안내')).toBeInTheDocument();
    });
    expect(screen.getByText('카메라 (선택)')).toBeInTheDocument();
    expect(screen.getByText('알림 (선택)')).toBeInTheDocument();
  });

  it('건너뛰기 클릭 시 확인 모달 없이 온보딩 완료 처리 후 /login으로 이동해야 한다', () => {
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    const skipBtn = screen.getByRole('button', { name: '건너뛰기' });
    fireEvent.click(skipBtn);

    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true');
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
