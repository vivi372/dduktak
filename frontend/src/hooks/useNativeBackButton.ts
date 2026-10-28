import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/routes';

/**
 * 하이브리드 모바일 안드로이드 하드웨어 물리 뒤로가기 버튼(Back Button) 제어 훅
 * - 모달/바텀시트가 열려 있으면 ESC 이벤트 또는 닫기 버튼/백드롭 클릭으로 최우선 닫기 (DEF-03 보완)
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

        // 1. 열려 있는 모달/다이얼로그/바텀시트가 있는지 DOM 검사 (중첩 모달 시 가장 마지막/최상단 모달 타겟팅)
        const dialogs = document.querySelectorAll<HTMLElement>(
          '[role="dialog"], [aria-modal="true"]'
        );
        if (dialogs.length > 0) {
          const topDialog = dialogs[dialogs.length - 1];

          // 1-1. ESC 키 리스너가 등록된 모달을 위해 keydown 이벤트 디스패치
          window.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
          );

          // 1-2. ESC 리스너가 없는 모달까지 100% 확실히 닫히도록 닫기 버튼 또는 취소/백드롭 폴백 클릭
          setTimeout(() => {
            if (document.body.contains(topDialog)) {
              const closeBtn =
                topDialog.querySelector<HTMLElement>('button[aria-label="닫기"]') ||
                Array.from(topDialog.querySelectorAll<HTMLElement>('button')).find(
                  (btn) => btn.textContent?.trim() === '취소' || btn.textContent?.trim() === '확인 완료'
                );

              if (closeBtn) {
                closeBtn.click();
              } else {
                const backdrop = topDialog.querySelector<HTMLElement>(
                  '[aria-hidden="true"], .fixed.inset-0'
                );
                backdrop?.click();
              }
            }
          }, 10);

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
