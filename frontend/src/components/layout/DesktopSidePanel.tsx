import { Link, NavLink } from 'react-router-dom';
import {
  Bell,
  ChefHat,
  Home,
  Moon,
  Plus,
  Refrigerator,
  Sun,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useThemeStore } from '@/store/themeStore';
import { useHomeBriefing } from '@/hooks/useHome';
import { useNotifications } from '@/hooks/useNotification';
import { DDayBadge } from '@/components/common/DDayBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/utils/cn';
import logoIcon from '@/assets/logo-icon.png';

const DEFAULT_PROFILE_IMAGE =
  'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/profiles/Default%20Profile.png';

interface DesktopSidePanelProps {
  /** 재료 추가 바텀시트/트레이 열기 콜백 */
  onOpenAddTray: () => void;
}

interface NavMenuItem {
  to: string;
  label: string;
  Icon: typeof Home;
  badge?: number | string;
  end?: boolean;
}

/**
 * 데스크톱 화면 (lg: 1024px 이상) 좌측 40% Sticky 사이드 패널
 * - 브랜드 로고 및 슬로건
 * - 내 냉장고 요약 브리핑 위젯 (임박 재료 카운트 & D-Day 뱃지)
 * - 퀵 메뉴 및 네비게이션
 * - 새 재료 등록 빠른 실행 버튼 (QuickAddTray 연동)
 */
export function DesktopSidePanel({ onOpenAddTray }: DesktopSidePanelProps) {
  const { theme, toggle } = useThemeStore();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: briefing, isLoading: isBriefingLoading } = useHomeBriefing();
  const { data: notificationData } = useNotifications();
  const unreadCount = notificationData?.unreadCount ?? 0;
  const hasUnread = notificationData?.hasUnread ?? false;

  const isCardLoading = isAuthLoading || (isAuthenticated && isBriefingLoading);

  // 실제 로그인 유저의 재료 보유 상태 연산
  const hasIngredients = Boolean(
    isAuthenticated &&
      briefing &&
      ((briefing.totalIngredientsCount ?? 0) > 0 ||
        (briefing.imminentIngredients && briefing.imminentIngredients.length > 0)),
  );

  const hasExpiring = Boolean(
    isAuthenticated &&
      briefing &&
      briefing.expiringIngredientsCount > 0,
  );

  const NAV_ITEMS: NavMenuItem[] = [
    { to: ROUTES.HOME, label: '홈', Icon: Home, end: true },
    { to: ROUTES.INVENTORY, label: '내 냉장고', Icon: Refrigerator },
    { to: ROUTES.RECIPES, label: '뚝딱 레시피', Icon: ChefHat },
    { to: ROUTES.MYPAGE, label: '마이페이지', Icon: User },
    {
      to: ROUTES.NOTIFICATIONS,
      label: '알림함',
      Icon: Bell,
      badge: hasUnread ? unreadCount : undefined,
    },
  ];

  return (
    <aside
      className="sticky top-6 flex flex-col gap-4"
      aria-label="데스크톱 메인 사이드바"
    >
      {/* 1. 브랜드 헤더 카드 (로고, 슬로건, 테마 스위처) */}
      <Card className="overflow-hidden border border-border/80 bg-background/95 p-5 shadow-soft backdrop-blur-md dark:border-white/10 dark:bg-card">
        <div className="flex items-center justify-between">
          <Link
            to={ROUTES.HOME}
            aria-label="오늘의 뚝딱 홈으로 이동"
            className="group flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="relative">
              <img
                src={logoIcon}
                alt="오늘의 뚝딱 로고"
                width={44}
                height={44}
                className="h-11 w-11 rounded-2xl object-cover ring-2 ring-brand-300 transition-transform group-hover:scale-105 dark:ring-brand-700/60"
              />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white">
                ✨
              </span>
            </div>
            <div>
              <span className="block text-2xl font-yanolja font-black tracking-tight text-brand-600 dark:text-brand-300">
                오늘의 뚝딱
              </span>
              <span className="block text-xs font-semibold text-muted-foreground">
                1인 가구를 위한 쉽고 빠른 요리
              </span>
            </div>
          </Link>

          {/* 상단 다크/라이트 모드 토글 */}
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 text-muted-foreground transition-all hover:border-brand-300 hover:bg-accent hover:text-foreground active:scale-95 dark:border-white/10"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700" />
            )}
          </button>
        </div>

        {/* 사용자 환영 미니 배너 */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 px-3.5 py-2.5 dark:bg-muted/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={user?.profileImage || DEFAULT_PROFILE_IMAGE}
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-2 ring-brand-200 dark:ring-brand-800"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-foreground">
                {isAuthenticated ? `${user?.nickname || '회원'}님` : '게스트 자취요리사'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isAuthenticated ? '냉장고 비울 준비 완료!' : '로그인하고 맞춤 요리 추천'}
              </p>
            </div>
          </div>
          {!isAuthenticated ? (
            <Link
              to={ROUTES.LOGIN}
              className="shrink-0 rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-bold text-brand-foreground shadow-sm transition-transform active:scale-95"
            >
              로그인
            </Link>
          ) : (
            <Link
              to={ROUTES.MYPAGE}
              className="text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-300"
            >
              내 정보
            </Link>
          )}
        </div>
      </Card>

      {/* 2. 내 냉장고 요약 브리핑 위젯 (06_UI_UX_GUIDELINES.md 3.1 & 4.4절) */}
      <Card className="border border-border/80 bg-background/95 p-5 shadow-soft backdrop-blur-md dark:border-white/10 dark:bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-dday-urgent animate-pulse" />
            <h2 className="text-sm font-extrabold tracking-tight text-foreground">
              내 냉장고 브리핑
            </h2>
          </div>
          <Link
            to={ROUTES.INVENTORY}
            className="flex items-center gap-1 text-xs font-bold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-300"
          >
            <span>전체보기</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isCardLoading ? (
          <div className="mt-3.5 space-y-2">
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <div className="flex gap-1.5 pt-1">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          </div>
        ) : hasIngredients && briefing ? (
          <div className="mt-3.5">
            {hasExpiring ? (
              <p className="text-lg font-black text-foreground">
                <span className="text-dday-urgent">{briefing.expiringIngredientsCount}개</span>
                <span className="ml-1 text-sm font-bold text-muted-foreground">
                  의 재료가 곧 만료돼요! ⏰
                </span>
              </p>
            ) : (
              <p className="text-lg font-black text-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">총 {briefing.totalIngredientsCount || briefing.imminentIngredients.length}개</span>
                <span className="ml-1 text-sm font-bold text-muted-foreground">
                  의 재료가 신선해요! 🥬
                </span>
              </p>
            )}

            {/* 소비기한 임박/신선 재료 리스트 칩 */}
            {briefing.imminentIngredients && briefing.imminentIngredients.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {briefing.imminentIngredients.map((ing) => (
                  <li
                    key={ing.ingredientId}
                    className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/60 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-foreground dark:border-white/10"
                  >
                    <span className="truncate max-w-[80px]">{ing.name}</span>
                    <DDayBadge dDay={ing.dDay} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="mt-3.5 rounded-xl border border-dashed border-border bg-muted/30 p-3.5 text-center">
            <p className="text-xs font-bold text-muted-foreground">
              🧊 아직 등록된 재료가 없어요
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              재료를 등록하면 맞춤 요리와 유통기한을 알려드려요!
            </p>
          </div>
        )}

        {/* 퀵 액션: 새 재료 추가하기 버튼 */}
        <div className="mt-4 pt-3 border-t border-border/80 dark:border-white/10">
          <Button
            type="button"
            onClick={onOpenAddTray}
            className="w-full h-11 gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 font-bold text-white shadow-soft transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            <span>새 재료 추가하기</span>
          </Button>
        </div>
      </Card>

      {/* 3. 퀵 메뉴 / 네비게이션 */}
      <Card className="border border-border/80 bg-background/95 p-3 shadow-soft backdrop-blur-md dark:border-white/10 dark:bg-card">
        <p className="px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          빠른 이동 (Menu)
        </p>
        <nav className="flex flex-col gap-1" aria-label="사이드바 네비게이션">
          {NAV_ITEMS.map(({ to, label, Icon, badge, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-brand-500/10 text-brand-600 font-extrabold dark:bg-brand-500/20 dark:text-brand-300'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.99]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-transform group-hover:scale-110',
                        isActive
                          ? 'text-brand-600 dark:text-brand-300'
                          : 'text-muted-foreground group-hover:text-foreground',
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span>{label}</span>
                  </div>

                  {badge !== undefined && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-dday-urgent px-1.5 text-[11px] font-extrabold text-white">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </Card>

      {/* 4. 자취 꿀팁 & 푸터 정보 */}
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground dark:border-white/5">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-secondary" />
          <span>자취생 뚝딱 TIP</span>
        </div>
        <p className="mt-1 leading-relaxed text-[11px]">
          냉장고 속 재료 2~3개만으로도 든든한 한 끼를 완성할 수 있어요.
        </p>
        <p className="mt-3 text-[10px] text-muted-foreground/80">
          © 2026 오늘의 뚝딱 (Dduktak) · All rights reserved.
        </p>
      </div>
    </aside>
  );
}
