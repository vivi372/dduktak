import { useEffect, useState } from 'react';
import { Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/constants/routes';
import type { RouteHandle } from '@/router/handle';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { DesktopSidePanel } from './DesktopSidePanel';
import { QuickAddTray } from './QuickAddTray';
import { WelcomeModal } from '@/components/auth/WelcomeModal';
import { GlobalErrorModal } from '@/components/common/GlobalErrorModal';
import { FloatingDevSwitcher } from '@/components/common/FloatingDevSwitcher';
import { AppSplashScreen } from '@/components/common/AppSplashScreen';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { useNativeBackButton } from '@/hooks/useNativeBackButton';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { usePlatformStore } from '@/store/usePlatformStore';

/**
 * 공통 앱 셸 (반응형 2-Column Split 레이아웃)
 * - 모바일/태블릿 (lg 미만): max-w-[480px] mx-auto 1열 모바일 프레임
 *   - 상단 Header + 콘텐츠 스크롤 + 하단 BottomNav + Thumb Zone FAB
 * - 데스크톱 (lg 이상):
 *   - 일반 페이지: max-w-5xl 2-컬럼 스플릿 (좌측 40% Sticky 사이드 패널 + 우측 60% 메인 피드 & 콘텐츠)
 *   - 로그인/온보딩 페이지 (hideSidePanel): 불필요한 시각적 노이즈를 제거하고 화면 중앙(max-w-[480px] mx-auto) 단독 집중 뷰 제공
 *   - 로그인 성공 시: 중앙 카드가 우측으로 매끄럽게 리포지셔닝되며 좌측 사이드바가 슬라이드 페이드인으로 등장하는 프리미엄 레이아웃 트랜지션
 */
export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const reduceMotion = useReducedMotion();
  const handle = matches[matches.length - 1]?.handle as RouteHandle | undefined;

  const [trayOpen, setTrayOpen] = useState(false);
  const { hasSeenOnboarding } = useOnboardingStore();
  const { isApp } = usePlatformStore();

  // 하이브리드 모바일 안드로이드 하드웨어 물리 뒤로가기 버튼 제어
  useNativeBackButton();

  // 최초 방문 유저 감지 시 앱 시작 가이드 온보딩(/onboarding) 화면으로 자동 분기 (모바일 앱 환경 한정)
  useEffect(() => {
    if (isApp && !hasSeenOnboarding && pathname === ROUTES.HOME) {
      navigate(ROUTES.ONBOARDING, { replace: true });
    }
  }, [isApp, hasSeenOnboarding, pathname, navigate]);

  const isAuthOrOnboarding =
    pathname === ROUTES.LOGIN ||
    pathname === ROUTES.ONBOARDING ||
    pathname === ROUTES.RESET_PASSWORD;
  const showNav = !isAuthOrOnboarding && !handle?.hideBottomNav;
  const showHeader = !handle?.hideHeader && !isAuthOrOnboarding;
  const hideSidePanel = Boolean(handle?.hideSidePanel || isAuthOrOnboarding);

  return (
    <div className="min-h-dvh w-full">
      {/* 라우트 전환 시 이전 스크롤 위치 유지 방지 및 상단 리셋 */}
      <ScrollToTop />

      {/* 데스크톱 컨테이너: hideSidePanel 여부에 따라 max-w-5xl (2-컬럼) 또는 max-w-[480px] (중앙 단독) 가변 전환 */}
      <div
        className={cn(
          'mx-auto flex min-h-dvh w-full justify-center transition-[max-width,gap] duration-300 lg:items-start lg:px-4 lg:py-6',
          hideSidePanel
            ? 'max-w-[480px]'
            : 'max-w-5xl lg:gap-8',
        )}
      >
        {/* [좌측 40% (Sticky Side Panel)] - 로그인 화면에서는 숨겨지고, 일반 페이지 진입 시 슬라이드/페이드 인 */}
        <AnimatePresence mode="popLayout">
          {!hideSidePanel && (
            <motion.aside
              key="desktop-side-panel"
              initial={reduceMotion ? false : { opacity: 0, x: -30, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -30, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block lg:w-[40%] xl:w-[38%] shrink-0"
            >
              <DesktopSidePanel onOpenAddTray={() => setTrayOpen(true)} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* [메인 피드 & 콘텐츠 프레임]
            - hideSidePanel (로그인 시): 데스크톱에서도 중앙에 단독(max-w-[480px]) 정렬
            - 일반 페이지: 데스크톱에서 우측 60% 메인 콘텐츠 프레임으로 자연스럽게 리포지셔닝
        */}
        <div
          className={cn(
            'relative flex min-h-dvh w-full flex-col bg-background shadow-[0_0_50px_rgba(74,31,24,0.08)] dark:border-white/10 dark:shadow-[0_0_80px_rgba(0,0,0,0.85)]',
            'border-x border-border/80 transition-[max-width,width] duration-300',
            hideSidePanel
              ? 'max-w-[480px] mx-auto lg:rounded-3xl lg:border lg:border-border/80 lg:shadow-card'
              : 'max-w-[480px] mx-auto lg:mx-0 lg:min-h-[calc(100vh-3rem)] lg:w-[60%] lg:flex-1 lg:max-w-none lg:rounded-3xl lg:border lg:border-border/80 lg:shadow-card',
          )}
        >
          {showHeader && <Header />}

          <main
            className={cn(
              'flex-1',
              showHeader ? 'px-4 pt-4' : 'px-0 pt-0',
              showNav
                ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom)+1.5rem)] lg:pb-6'
                : 'pb-6',
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>

      {/* 모바일 하단 탭바 (ThumbZone):
          - 부모 transform 및 layout 애니메이션 간섭으로부터 100% 격리된 순수 Viewport Fixed 요소
          - 페이지 이동 시에도 0% 플리커 및 상시 고정 유지 (데스크톱에서는 lg:hidden)
      */}
      {showNav && <BottomNav onOpenTray={() => setTrayOpen(true)} />}

      {/* 재료 추가 퀵 트레이 바텀시트/모달 (모바일/데스크톱 공통 사용) */}
      <QuickAddTray open={trayOpen} onClose={() => setTrayOpen(false)} />

      {/* 온보딩 웰컴 팝업 모달 */}
      <WelcomeModal />

      {/* 백엔드 UX 태그 전역 에러 모달 (_ALERT_, _CONFIRM_, _FATAL_) */}
      <GlobalErrorModal />

      {/* 개발자 검수용 상태 스위처 */}
      <FloatingDevSwitcher />

      {/* 앱 구동 오프닝 인트로 및 스플래시 애니메이션 */}
      <AppSplashScreen />
    </div>
  );
}
