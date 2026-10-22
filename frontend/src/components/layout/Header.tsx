import { Link, useMatches, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Moon, Sun } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { mockNotifications } from '@/mocks';
import { useThemeStore } from '@/store/themeStore';
import type { RouteHandle } from '@/router/handle';
import logoIcon from '@/assets/logo-icon.png';

/** 상단 공통 헤더: 홈 탭은 로고 아이콘 + 워드마크, 서브 페이지는 뒤로가기 + 제목 */
export function Header() {
  const matches = useMatches();
  const navigate = useNavigate();
  const { theme, toggle } = useThemeStore();
  const handle = matches[matches.length - 1]?.handle as RouteHandle | undefined;

  // 직접 URL로 진입해 히스토리가 없으면 홈으로 이동
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(ROUTES.HOME);
  };

  return (
    <header className="sticky top-0 z-30 flex h-header items-center justify-between border-b border-border/60 bg-background/85 px-3 backdrop-blur-md">
      {handle?.showBack ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goBack}
            aria-label="뒤로가기"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-accent active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-extrabold tracking-tight">{handle.title}</h1>
        </div>
      ) : (
        <Link to={ROUTES.HOME} aria-label="오늘의 뚝딱 홈" className="flex items-center gap-2 pl-1">
          {/* 로고의 핵심 모티브(냄비)만 원형 크롭 */}
          <img
            src={logoIcon}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-brand-200 dark:ring-brand-700/60"
          />
          <span className="text-xl font-black tracking-tight text-brand-600 dark:text-brand-300">오늘의 뚝딱</span>
        </Link>
      )}

      <div className="flex items-center">
        <button
          type="button"
          onClick={toggle}
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <Link
          to={ROUTES.NOTIFICATIONS}
          aria-label={mockNotifications.hasUnread ? `알림 (읽지 않은 알림 ${mockNotifications.unreadCount}개)` : '알림'}
          className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-accent active:scale-95"
        >
          <Bell className="h-5 w-5" />
          {mockNotifications.hasUnread && (
            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-dday-urgent ring-2 ring-background" />
          )}
        </Link>
      </div>
    </header>
  );
}
