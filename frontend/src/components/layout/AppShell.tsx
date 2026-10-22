import { Outlet, useLocation, useMatches } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { RouteHandle } from '@/router/handle';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { WelcomeModal } from '@/components/auth/WelcomeModal';
import { FloatingDevSwitcher } from '@/components/common/FloatingDevSwitcher';

/**
 * 공통 앱 셸: 480px 중앙 모바일 프레임 (PC에서는 좌우를 크림 그라데이션 배경으로 채움)
 * Header(sticky, 선택적) + 스크롤 콘텐츠 + BottomNav(fixed, 선택적) + WelcomeModal + FloatingDevSwitcher
 */
export function AppShell() {
  const { pathname } = useLocation();
  const matches = useMatches();
  const reduceMotion = useReducedMotion();
  const handle = matches[matches.length - 1]?.handle as RouteHandle | undefined;

  const showNav = !handle?.hideBottomNav;
  const showHeader = !handle?.hideHeader;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col border-x border-border/80 bg-background shadow-[0_0_50px_rgba(74,31,24,0.08)] dark:border-white/10 dark:shadow-[0_0_80px_rgba(0,0,0,0.85)]">
      {showHeader && <Header />}

      <main
        className={cn(
          'flex-1',
          showHeader ? 'px-4 pt-4' : 'px-0 pt-0',
          // 탭바 높이 + 안전 영역 + 여유만큼 하단 패딩 (콘텐츠 가림 방지)
          showNav ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom)+1.5rem)]' : 'pb-6',
        )}
      >
        <motion.div
          key={pathname}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </main>

      {showNav && <BottomNav />}

      {/* 온보딩 웰컴 팝업 모달 */}
      <WelcomeModal />

      {/* 개발자 검수용 상태 스위처 */}
      <FloatingDevSwitcher />
    </div>
  );
}
