import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { useAuthStore } from '@/store/useAuthStore';
import { NativePushService } from '@/services/nativePushService';
import { ROUTES } from '@/constants/routes';

/** 앱 루트: 라우터 연결, Supabase Auth 세션 동기화 및 하이브리드 네이티브 푸시 수신기 초기화 */
export const App = () => {
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initialize();

    // 하이브리드 모바일 네이티브 푸시 알림 수신기 초기화 및 딥링크 라우팅 (스플래시 완료 후 비동기 안전 실행)
    const pushTimer = setTimeout(() => {
      try {
        NativePushService.initPushNotifications((data) => {
          if (data?.route) {
            router.navigate(data.route);
          } else if (data?.targetId) {
            router.navigate(ROUTES.NOTIFICATIONS);
          }
        });
      } catch (e) {
        console.warn('NativePushService initialization skipped:', e);
      }
    }, 1200);

    return () => {
      clearTimeout(pushTimer);
      unsubscribe?.();
      NativePushService.cleanup();
    };
  }, []);

  return <RouterProvider router={router} />;
};

export default App;
