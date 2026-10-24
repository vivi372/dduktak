import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { useAuthStore } from '@/store/useAuthStore';

/** 앱 루트: 라우터 연결 및 Supabase Auth 세션 동기화 (공통 레이아웃은 router의 AppShell이 담당) */
export const App = () => {
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initialize();
    return () => {
      unsubscribe?.();
    };
  }, []);

  return <RouterProvider router={router} />;
};

export default App;
