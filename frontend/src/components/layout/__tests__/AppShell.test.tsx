import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';

// useMatches 모킹
const mockUseMatches = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useMatches: () => mockUseMatches(),
  };
});

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
      {ui}
    </QueryClientProvider>,
  );
}

describe('AppShell 레이아웃 반응형 및 로그인 분기 단위 테스트', () => {
  it('일반 화면(홈 등)에서는 데스크톱 사이드 패널(DesktopSidePanel)과 하단 탭바를 렌더링해야 한다', () => {
    mockUseMatches.mockReturnValue([
      { handle: { title: '홈', hideSidePanel: false, hideBottomNav: false, hideHeader: false } },
    ]);

    renderWithProviders(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<div>홈 콘텐츠</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('홈 콘텐츠')).toBeInTheDocument();
    // 데스크톱 사이드 패널의 타이틀
    expect(screen.getByRole('heading', { level: 2, name: '내 냉장고 브리핑' })).toBeInTheDocument();
    // 모바일 탭바
    expect(screen.getByRole('navigation', { name: '하단 메뉴' })).toBeInTheDocument();
  });

  it('로그인 화면(hideSidePanel=true, hideBottomNav=true)에서는 데스크톱 사이드 패널과 하단 탭바를 숨겨야 한다', () => {
    mockUseMatches.mockReturnValue([
      { handle: { title: '로그인', hideSidePanel: true, hideBottomNav: true, hideHeader: true } },
    ]);

    renderWithProviders(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/login" element={<div>로그인 전용 화면</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('로그인 전용 화면')).toBeInTheDocument();
    // 사이드 패널 요소는 마운트되지 않아야 함
    expect(screen.queryByRole('heading', { level: 2, name: '내 냉장고 브리핑' })).not.toBeInTheDocument();
    // 하단 탭바도 마운트되지 않아야 함
    expect(screen.queryByRole('navigation', { name: '하단 메뉴' })).not.toBeInTheDocument();
  });
});
