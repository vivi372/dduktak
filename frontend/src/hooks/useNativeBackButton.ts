import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/routes';

/**
 * 하이브리드 모바일 안드로이드 하드웨어 물리 뒤로가기 버튼(Back Button) 제어 훅
 * - 모달/바텀시트가 열려 있으면 ESC 이벤트 발생으로 최우선 닫기
 * - 일반 서브 화면에서는 navigate(-1)로 직전 히스토리 복귀
 * - 홈 화면('/')에서는 2초 이내 더블 탭 시 안전하게 앱 종료(exitApp)
 */
export function useNativeBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPressTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backButtonListener = CapacitorApp.addListener(
      'backButton',
      ({ canGoBack }) => {
        const now = Date.now();

        // 1. 열려 있는 모달/다이얼로그/바텀시트가 있는지 DOM 검사
        const activeDialog = document.querySelector(
          '[role="dialog"], [aria-modal="true"]'
        );
        if (activeDialog) {
          // ESC 키 이벤트를 트리거하여 활성 모달 닫기
          window.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
          );
          return;
        }

        // 2. 홈 화면 또는 루트 경로일 때 앱 종료 제어 (2초 내 더블 탭)
        if (location.pathname === ROUTES.HOME || !canGoBack) {
          if (now - lastBackPressTimeRef.current < 2000) {
            CapacitorApp.exitApp();
          } else {
            lastBackPressTimeRef.current = now;
            toast.info('한 번 더 누르면 앱이 종료됩니다.', {
              duration: 2000,
            });
          }
          return;
        }

        // 3. 일반 서브 화면에서는 직전 페이지로 복귀
        navigate(-1);
      }
    );

    return () => {
      backButtonListener.then((listener) => listener.remove());
    };
  }, [navigate, location.pathname]);
}
