import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DesktopSidePanel } from '@/components/layout/DesktopSidePanel';
import { useMockAuthStore } from '@/store/mockAuthStore';
import { useThemeStore } from '@/store/themeStore';

describe('DesktopSidePanel (데스크톱 좌측 40% Sticky 사이드 패널) 단위 테스트', () => {
  const mockOnOpenAddTray = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useMockAuthStore.setState({
      isLoggedIn: true,
      hasIngredients: true,
    });
  });

  it('브랜드 로고 타이틀과 슬로건을 정상적으로 렌더링해야 한다', () => {
    render(
      <MemoryRouter>
        <DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />
      </MemoryRouter>,
    );

    expect(screen.getByText('오늘의 뚝딱')).toBeInTheDocument();
    expect(screen.getByText('1인 가구를 위한 쉽고 빠른 요리')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '오늘의 뚝딱 홈으로 이동' })).toBeInTheDocument();
  });

  it('내 냉장고 브리핑 위젯과 소비기한 임박 정보를 렌더링해야 한다', () => {
    render(
      <MemoryRouter>
        <DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 2, name: '내 냉장고 브리핑' })).toBeInTheDocument();
    expect(screen.getByText(/의 재료가 곧 만료돼요!/)).toBeInTheDocument();
    expect(screen.getByText('계란')).toBeInTheDocument();
  });

  it('재료가 0개일 때는 냉장고가 비어있다는 안내 문구를 렌더링해야 한다', () => {
    useMockAuthStore.setState({ hasIngredients: false });

    render(
      <MemoryRouter>
        <DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/아직 등록된 재료가 없어요/)).toBeInTheDocument();
  });

  it('빠른 이동 메뉴(홈, 내 냉장고, 레시피, 마이페이지, 알림함) 링크를 모두 렌더링해야 한다', () => {
    render(
      <MemoryRouter>
        <DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /홈 피드/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /내 냉장고/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /뚝딱 레시피/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /마이페이지/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /알림함/ })).toBeInTheDocument();
  });

  it('"새 재료 추가하기" 버튼 클릭 시 onOpenAddTray 콜백이 호출되어야 한다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />
      </MemoryRouter>,
    );

    const addButton = screen.getByRole('button', { name: '새 재료 추가하기' });
    await user.click(addButton);

    expect(mockOnOpenAddTray).toHaveBeenCalledTimes(1);
  });

  it('테마 토글 버튼 클릭 시 useThemeStore 상태가 전환되어야 한다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DesktopSidePanel onOpenAddTray={mockOnOpenAddTray} />
      </MemoryRouter>,
    );

    const initialTheme = useThemeStore.getState().theme;
    const toggleButton = screen.getByRole('button', {
      name: initialTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환',
    });

    await user.click(toggleButton);
    expect(useThemeStore.getState().theme).not.toBe(initialTheme);
  });
});
