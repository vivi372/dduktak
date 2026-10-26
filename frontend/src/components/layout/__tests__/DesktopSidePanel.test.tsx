import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DesktopSidePanel } from '@/components/layout/DesktopSidePanel';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/themeStore';
import * as homeApi from '@/services/homeApi';
import type { UserProfileResponseDto } from '@/types/auth';
import type { HomeBriefing } from '@/types/home';

vi.mock('@/services/homeApi', () => ({
  getHomeBriefing: vi.fn(),
}));

const mockBriefing: HomeBriefing = {
  nickname: '뚝딱이',
  totalIngredientsCount: 2,
  expiringIngredientsCount: 2,
  imminentIngredients: [
    {
      ingredientId: 101,
      name: '계란',
      dDay: 1,
    },
  ],
  topRecipe: null,
};

const mockUser: UserProfileResponseDto = {
  userId: '3f7f754c-d561-4b93-b79b-9d73a4f29f2a',
  email: 'user@dduktak.com',
  nickname: '뚝딱이',
  userTag: '1024',
  profileImage: 'https://example.com/profile.png',
  status: 'ACTIVE',
  quietTimeStart: '21:00:00',
  quietTimeEnd: '08:00:00',
  loginProvider: 'email',
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DesktopSidePanel (데스크톱 좌측 40% Sticky 사이드 패널) 단위 테스트', () => {
  const mockOnOpenAddTray = vi.fn();

  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      isLoading: false,
      user: { ...mockUser },
    });
    vi.mocked(homeApi.getHomeBriefing).mockResolvedValue(mockBriefing);
  });

  it('브랜드 로고 타이틀과 슬로건을 정상적으로 렌더링해야 한다', () => {
    renderWithProviders(<DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />);

    expect(screen.getByText('오늘의 뚝딱')).toBeInTheDocument();
    expect(screen.getByText('1인 가구를 위한 쉽고 빠른 요리')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '오늘의 뚝딱 홈으로 이동' })).toBeInTheDocument();
  });

  it('로그인한 사용자의 닉네임과 내 정보 링크를 렌더링해야 한다', () => {
    renderWithProviders(<DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />);

    expect(screen.getByText('뚝딱이님')).toBeInTheDocument();
    expect(screen.getByText('냉장고 비울 준비 완료!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '내 정보' })).toBeInTheDocument();
  });

  it('비로그인 사용자일 경우 게스트 안내 문구와 로그인 버튼을 렌더링해야 한다', () => {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
    });

    renderWithProviders(<DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />);

    expect(screen.getByText('게스트 자취요리사')).toBeInTheDocument();
    expect(screen.getByText('로그인하고 맞춤 요리 추천')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument();
  });

  it('내 냉장고 브리핑 위젯과 소비기한 임박 정보를 렌더링해야 한다', async () => {
    renderWithProviders(<DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />);

    expect(screen.getByRole('heading', { level: 2, name: '내 냉장고 브리핑' })).toBeInTheDocument();
    expect(await screen.findByText(/의 재료가 곧 만료돼요!/)).toBeInTheDocument();
    expect(await screen.findByText('계란')).toBeInTheDocument();
  });

  it('재료가 0개일 때는 냉장고가 비어있다는 안내 문구를 렌더링해야 한다', async () => {
    vi.mocked(homeApi.getHomeBriefing).mockResolvedValue({
      ...mockBriefing,
      totalIngredientsCount: 0,
      expiringIngredientsCount: 0,
      imminentIngredients: [],
    });

    renderWithProviders(<DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />);

    expect(await screen.findByText(/아직 등록된 재료가 없어요/)).toBeInTheDocument();
  });

  it('빠른 이동 메뉴(홈, 내 냉장고, 레시피, 마이페이지, 알림함) 링크를 모두 렌더링해야 한다', () => {
    renderWithProviders(<DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />);

    expect(screen.getByRole('link', { name: '홈' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /내 냉장고/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /뚝딱 레시피/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /마이페이지/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /알림함/ })).toBeInTheDocument();
  });

  it('"새 재료 추가하기" 버튼 클릭 시 onOpenAddTray 콜백이 호출되어야 한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />);

    const addButton = screen.getByRole('button', { name: '새 재료 추가하기' });
    await user.click(addButton);

    expect(mockOnOpenAddTray).toHaveBeenCalledTimes(1);
  });

  it('테마 토글 버튼 클릭 시 useThemeStore 상태가 전환되어야 한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />);

    const initialTheme = useThemeStore.getState().theme;
    const toggleButton = screen.getByRole('button', {
      name: initialTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환',
    });

    await user.click(toggleButton);
    expect(useThemeStore.getState().theme).not.toBe(initialTheme);
  });
});
