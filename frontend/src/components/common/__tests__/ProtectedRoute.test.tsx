import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { useAuthStore } from '@/store/useAuthStore';
import { ROUTES } from '@/constants/routes';

describe('ProtectedRoute 라우트 가드 컴포넌트 단위 테스트', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      session: null,
    });
  });

  it('isLoading이 true일 경우 로딩 스피너 및 안내 문구를 노출해야 한다', () => {
    useAuthStore.setState({
      isLoading: true,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={['/inventory']}>
        <Routes>
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <div>내 냉장고 페이지</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('로그인 정보를 확인하고 있어요...')).toBeInTheDocument();
    expect(screen.queryByText('내 냉장고 페이지')).not.toBeInTheDocument();
  });

  it('비인증 상태(isAuthenticated=false)일 경우 /login으로 리다이렉트되어야 한다', () => {
    useAuthStore.setState({
      isLoading: false,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={['/mypage']}>
        <Routes>
          <Route
            path="/mypage"
            element={
              <ProtectedRoute>
                <div>마이페이지 콘텐츠</div>
              </ProtectedRoute>
            }
          />
          <Route path={ROUTES.LOGIN} element={<div>로그인 페이지</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // 보호된 페이지는 보이지 않고 로그인 페이지로 이동
    expect(screen.queryByText('마이페이지 콘텐츠')).not.toBeInTheDocument();
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
  });

  it('인증 완료(isAuthenticated=true) 상태일 경우 자식 페이지를 정상 렌더링해야 한다', () => {
    useAuthStore.setState({
      isLoading: false,
      isAuthenticated: true,
      user: { userId: 'test-user' } as any,
    });

    render(
      <MemoryRouter initialEntries={['/inventory']}>
        <Routes>
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <div>보호된 내 냉장고 화면</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('보호된 내 냉장고 화면')).toBeInTheDocument();
  });
});
