import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import HomePage from '@/pages/HomePage';
import InventoryPage from '@/pages/InventoryPage';
import RecipeFeedPage from '@/pages/RecipeFeedPage';
import MyPage from '@/pages/MyPage';
import NotificationPage from '@/pages/NotificationPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ROUTES } from '@/constants/routes';
import type { RouteHandle } from './handle';

const h = (handle: RouteHandle) => handle;

/** 앱 라우터: AppShell(공통 레이아웃) 아래에 5개 탭/서브 페이지 + 404 */
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: ROUTES.HOME, element: <HomePage />, handle: h({ title: '홈', brand: true }) },
      { path: ROUTES.INVENTORY, element: <InventoryPage />, handle: h({ title: '내 냉장고', brand: true }) },
      { path: ROUTES.RECIPES, element: <RecipeFeedPage />, handle: h({ title: '뚝딱 레시피', brand: true }) },
      { path: ROUTES.MYPAGE, element: <MyPage />, handle: h({ title: '마이페이지', brand: true }) },
      { path: ROUTES.NOTIFICATIONS, element: <NotificationPage />, handle: h({ title: '알림함', showBack: true }) },
      { path: '*', element: <NotFoundPage />, handle: h({ title: '길을 잃었어요', brand: true }) },
    ],
  },
]);
