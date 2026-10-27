import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import InventoryPage from '@/pages/InventoryPage';
import RecipeFeedPage from '@/pages/RecipeFeedPage';
import RecipeDetailPage from '@/pages/RecipeDetailPage';
import RecipeFormPage from '@/pages/RecipeFormPage';
import MyPage from '@/pages/MyPage';
import NotificationPage from '@/pages/NotificationPage';
import LoginPage from '@/pages/LoginPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import OnboardingPage from '@/pages/OnboardingPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ROUTES } from '@/constants/routes';
import type { RouteHandle } from './handle';

const h = (handle: RouteHandle) => handle;

/** 앱 라우터: AppShell(공통 레이아웃) 아래에 5개 탭/서브 페이지 + 레시피 상세/작성 + 로그인 + 404 */
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: ROUTES.HOME, element: <HomePage />, handle: h({ title: '홈', brand: true }) },
      {
        path: ROUTES.INVENTORY,
        element: (
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        ),
        handle: h({ title: '내 냉장고', brand: true }),
      },
      { path: ROUTES.RECIPES, element: <RecipeFeedPage />, handle: h({ title: '뚝딱 레시피', brand: true }) },
      {
        path: ROUTES.RECIPE_NEW,
        element: (
          <ProtectedRoute>
            <RecipeFormPage />
          </ProtectedRoute>
        ),
        handle: h({ title: '레시피 작성', showBack: true, backPath: ROUTES.RECIPES }),
      },
      {
        path: ROUTES.RECIPE_EDIT,
        element: (
          <ProtectedRoute>
            <RecipeFormPage />
          </ProtectedRoute>
        ),
        handle: h({ title: '레시피 수정', showBack: true }),
      },
      {
        path: ROUTES.RECIPE_DETAIL,
        element: <RecipeDetailPage />,
        handle: h({ title: '레시피 상세', showBack: true, backPath: ROUTES.RECIPES }),
      },
      {
        path: ROUTES.MYPAGE,
        element: (
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        ),
        handle: h({ title: '마이페이지', brand: true }),
      },
      {
        path: ROUTES.NOTIFICATIONS,
        element: (
          <ProtectedRoute>
            <NotificationPage />
          </ProtectedRoute>
        ),
        handle: h({ title: '알림함', showBack: true, backPath: ROUTES.HOME }),
      },
      {
        path: ROUTES.LOGIN,
        element: <LoginPage />,
        handle: h({ title: '로그인', hideBottomNav: true, hideHeader: true, hideSidePanel: true }),
      },
      {
        path: ROUTES.RESET_PASSWORD,
        element: <ResetPasswordPage />,
        handle: h({ title: '비밀번호 재설정', hideBottomNav: true, hideHeader: true, hideSidePanel: true }),
      },
      {
        path: ROUTES.ONBOARDING,
        element: <OnboardingPage />,
        handle: h({ title: '앱 시작 가이드', hideBottomNav: true, hideHeader: true, hideSidePanel: true }),
      },
      { path: '*', element: <NotFoundPage />, handle: h({ title: '길을 잃었어요', brand: true }) },
    ],
  },
]);
