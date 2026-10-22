import { Outlet, useLocation, useMatches } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { RouteHandle } from '@/router/handle';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

/**
 * 공통 앱 셸: 480px 중앙 모바일 프레임 (PC에서는 좌우를 크림 그라데이션 배경으로 채움)
 * Header(sticky) + 스크롤 콘텐츠 + BottomNav(fixed, 프레임 폭 내)
 */
export function AppShell() {
  const { pathname } = useLocation();
  const matches = useMatches();
  const reduceMotion = useReducedMotion();
  const handle = matches[matches.length - 1]?.handle as RouteHandle | undefined;
  const showNav = !handle?.hideBottomNav;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-background shadow-[0_0_60px_rgba(74,31,24,0.08)]">
      <Header />
      <main
        className={cn(
          'flex-1 px-4 pt-4',
          // 탭바 높이 + 안전 영역 + 여유만큼 하단 패딩 (콘텐츠 가림 방지)
          showNav ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom)+1.5rem)]' : 'pb-8',
        )}
      >
        <motion.div
          key={pathname}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
