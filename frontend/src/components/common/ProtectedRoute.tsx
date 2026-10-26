/**
 * 보호된 라우트 가드 컴포넌트 (08_DEVELOPMENT_MASTER_PLAN.md Phase 3B-1)
 *
 * /inventory, /mypage, /notifications, /recipes/new, /recipes/:id/edit 등
 * 로그인이 필요한 경로에 비인증 사용자가 접근할 경우 /login으로 안전하게 리다이렉트합니다.
 */

import { type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
  children?: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // 초기 세션 검증 진행 중일 때는 깔끔한 스켈레톤 뷰 제공
  if (isLoading) {
    return (
      <div className="space-y-4 p-4 animate-in fade-in-50" aria-busy="true" aria-label="인증 확인 중">
        <div className="flex items-center justify-between">
          <div className="h-7 w-28 rounded-xl bg-muted/60 animate-pulse" />
          <div className="h-7 w-20 rounded-xl bg-muted/60 animate-pulse" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-28 w-full rounded-2xl bg-muted/50 animate-pulse" />
          <div className="h-24 w-full rounded-2xl bg-muted/50 animate-pulse" />
          <div className="h-24 w-full rounded-2xl bg-muted/50 animate-pulse" />
        </div>
      </div>
    );
  }

  // 비인증 상태일 때: 기존 요청 URL(location)을 state에 담아 로그인 페이지로 이동
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 인증 완료 상태일 때
  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
