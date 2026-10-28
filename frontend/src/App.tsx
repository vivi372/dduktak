import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { useAuthStore } from '@/store/useAuthStore';
import { NativePushService } from '@/services/nativePushService';
import { ROUTES } from '@/constants/routes';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { supabase } from '@/services/supabaseClient';

/** 앱 루트: 라우터 연결, Supabase Auth 세션 동기화, 구글 로그인 딥링크 연동 및 하이브리드 네이티브 푸시 수신기 초기화 */
export const App = () => {
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initialize();

    // 1. 하이브리드 모바일 네이티브 푸시 알림 수신기 초기화 (스플래시 완료 후 비동기 안전 실행)
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

    // 2. 모바일 네이티브 딥링크 및 앱 상태 감지 리스너 (구글 소셜 로그인 앱 복귀 & 백그라운드 복귀 시 동기화)
    let urlListenerHandle: { remove: () => void } | null = null;
    let stateListenerHandle: { remove: () => void } | null = null;

    if (Capacitor.isNativePlatform()) {
      // 2-1. 구글 OAuth 완료 후 앱 복귀 딥링크 (com.dduktak.app://... 또는 dduktak://...)
      CapApp.addListener('appUrlOpen', async (event) => {
        const urlStr = event.url;
        console.log('[DeepLink] 앱 호출 URL 수신:', urlStr);

        if (urlStr.includes('access_token=') || urlStr.includes('code=')) {
          try {
            const hashIndex = urlStr.indexOf('#');
            const queryIndex = urlStr.indexOf('?');
            let paramsString = '';
            if (hashIndex !== -1) {
              paramsString = urlStr.substring(hashIndex + 1);
            } else if (queryIndex !== -1) {
              paramsString = urlStr.substring(queryIndex + 1);
            }

            const params = new URLSearchParams(paramsString);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const code = params.get('code');

            if (accessToken && refreshToken) {
              console.log('[DeepLink] access_token 획득 ➔ Supabase 세션 설정');
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              await useAuthStore.getState().initialize();
              NativePushService.sendTokenToBackend().catch(() => {});
              router.navigate(ROUTES.HOME);
            } else if (code) {
              console.log('[DeepLink] auth code 획득 ➔ Supabase 세션 교환');
              await supabase.auth.exchangeCodeForSession(code);
              await useAuthStore.getState().initialize();
              NativePushService.sendTokenToBackend().catch(() => {});
              router.navigate(ROUTES.HOME);
            }
          } catch (oauthErr) {
            console.error('[DeepLink] OAuth 세션 복구 실패:', oauthErr);
          }
        }
      }).then((handle) => {
        urlListenerHandle = handle;
      });

      // 2-2. 앱이 백그라운드에서 다시 포그라운드로 복귀 시 알림 및 세션 최신화
      CapApp.addListener('appStateChange', (state) => {
        if (state.isActive) {
          NativePushService.sendTokenToBackend().catch(() => {});
        }
      }).then((handle) => {
        stateListenerHandle = handle;
      });
    }

    return () => {
      clearTimeout(pushTimer);
      unsubscribe?.();
      urlListenerHandle?.remove();
      stateListenerHandle?.remove();
      NativePushService.cleanup();
    };
  }, []);

  return <RouterProvider router={router} />;
};

export default App;
