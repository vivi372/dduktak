import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, Home, Plus, Refrigerator, User, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { QuickAddTray } from './QuickAddTray';

interface TabItem {
  to: string;
  label: string;
  Icon: LucideIcon;
}

const LEFT_TABS: TabItem[] = [
  { to: ROUTES.HOME, label: '홈', Icon: Home },
  { to: ROUTES.INVENTORY, label: '내 냉장고', Icon: Refrigerator },
];
const RIGHT_TABS: TabItem[] = [
  { to: ROUTES.RECIPES, label: '레시피', Icon: ChefHat },
  { to: ROUTES.MYPAGE, label: '마이', Icon: User },
];

function Tab({ to, label, Icon }: TabItem) {
  return (
    <NavLink
      to={to}
      end={to === ROUTES.HOME}
      className={({ isActive }) =>
        cn(
          'relative flex h-full min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
          isActive ? 'text-brand-600 dark:text-brand-300' : 'text-muted-foreground hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="tab-indicator"
              className="absolute top-0 h-1 w-8 rounded-b-full bg-brand-500"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} aria-hidden />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

interface BottomNavProps {
  /** 외부 트레이 열기 제어 콜백 */
  onOpenTray?: () => void;
}

/**
 * 하단 탭바 (Thumb Zone)
 * - 모바일/태블릿(lg 미만): 480px 프레임 폭 안에 고정, 중앙 FAB(56px)은 탭바 위로 20px 돌출
 * - 데스크톱(lg 이상): 2-컬럼 좌측 사이드 패널에 퀵 메뉴가 상시 노출되므로 하단 탭바는 숨김 (lg:hidden)
 */
export function BottomNav({ onOpenTray }: BottomNavProps = {}) {
  const [internalTrayOpen, setInternalTrayOpen] = useState(false);

  const handleOpen = () => {
    if (onOpenTray) {
      onOpenTray();
    } else {
      setInternalTrayOpen(true);
    }
  };

  return (
    <>
      <nav
        aria-label="하단 메뉴"
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border/80 border-x bg-background/90 pb-safe backdrop-blur-lg dark:border-white/10 lg:hidden"
      >
        <div className="grid h-tabbar grid-cols-5">
          {LEFT_TABS.map((t) => <Tab key={t.to} {...t} />)}

          {/* 중앙 재료 추가 FAB: 직경 56px, 탭바 위로 20px 돌출 */}
          <div className="relative flex items-end justify-center pb-2">
            <button
              type="button"
              onClick={handleOpen}
              aria-label="재료 추가"
              aria-haspopup="dialog"
              aria-expanded={internalTrayOpen}
              className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-500 text-brand-foreground shadow-fab ring-4 ring-background transition-transform animate-pulse-ring hover:scale-105 active:scale-90"
            >
              <Plus className="h-7 w-7" strokeWidth={3} />
            </button>
            <span className="text-[11px] font-bold text-brand-600 dark:text-brand-300">재료 추가</span>
          </div>

          {RIGHT_TABS.map((t) => <Tab key={t.to} {...t} />)}
        </div>
      </nav>
      {!onOpenTray && (
        <QuickAddTray open={internalTrayOpen} onClose={() => setInternalTrayOpen(false)} />
      )}
    </>
  );
}
