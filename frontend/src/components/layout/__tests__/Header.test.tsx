import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { useThemeStore } from '@/store/themeStore';
import * as notificationHooks from '@/hooks/useNotification';

// useMatches & useNavigate 모킹
const mockUseMatches = vi.fn();
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useMatches: () => mockUseMatches(),
    useNavigate: () => mockNavigate,
  };
});

// useNotifications 모킹
vi.mock('@/hooks/useNotification', () => ({
  useNotifications: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Header 컴포넌트 단위 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificationHooks.useNotifications).mockReturnValue({
      data: { unreadCount: 2, hasUnread: true, notifications: [] },
      isLoading: false,
      isError: false,
    } as any);
  });

  it('기본 홈 상태(showBack=false)일 때 서비스 로고와 "오늘의 뚝딱" 타이틀을 렌더링해야 한다', () => {
    mockUseMatches.mockReturnValue([{ handle: { showBack: false } }]);

    render(<Header />, { wrapper: createWrapper() });

    expect(screen.getByText('오늘의 뚝딱')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '오늘의 뚝딱 홈' })).toBeInTheDocument();
  });

  it('서브 페이지(showBack=true)일 때 뒤로가기 버튼과 페이지 제목을 렌더링해야 한다', () => {
    mockUseMatches.mockReturnValue([
      { handle: { showBack: true, title: '내 재료 보관소' } },
    ]);

    render(<Header />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: '뒤로가기' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: '내 재료 보관소' })).toBeInTheDocument();
  });

  it('테마 토글 버튼 클릭 시 useThemeStore의 toggle이 호출되어야 한다', async () => {
    mockUseMatches.mockReturnValue([{ handle: {} }]);
    const user = userEvent.setup();

    render(<Header />, { wrapper: createWrapper() });

    const initialTheme = useThemeStore.getState().theme;
    const toggleButton = screen.getByRole('button', {
      name: initialTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환',
    });

    await user.click(toggleButton);
    expect(useThemeStore.getState().theme).not.toBe(initialTheme);
  });

  it('읽지 않은 알림이 있을 때(hasUnread=true) 종 아이콘에 Red Dot 뱃지가 노출되어야 한다', () => {
    mockUseMatches.mockReturnValue([{ handle: {} }]);

    render(<Header />, { wrapper: createWrapper() });

    const redDot = screen.getByTestId('header-red-dot');
    expect(redDot).toBeInTheDocument();
  });

  it('읽지 않은 알림이 없을 때(hasUnread=false) 종 아이콘에 Red Dot 뱃지가 노출되지 않아야 한다', () => {
    mockUseMatches.mockReturnValue([{ handle: {} }]);
    vi.mocked(notificationHooks.useNotifications).mockReturnValue({
      data: { unreadCount: 0, hasUnread: false, notifications: [] },
      isLoading: false,
      isError: false,
    } as any);

    render(<Header />, { wrapper: createWrapper() });

    expect(screen.queryByTestId('header-red-dot')).not.toBeInTheDocument();
  });

  it('handle.backPath가 지정된 서브 페이지일 때 뒤로가기 클릭 시 해당 경로로 navigate되어야 한다', async () => {
    mockUseMatches.mockReturnValue([
      { handle: { showBack: true, title: '레시피 상세', backPath: '/recipes' } },
    ]);
    const user = userEvent.setup();

    render(<Header />, { wrapper: createWrapper() });

    const backButton = screen.getByRole('button', { name: '뒤로가기' });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/recipes');
  });
});

