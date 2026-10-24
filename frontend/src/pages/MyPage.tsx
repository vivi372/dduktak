import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, ChevronRight, LogIn, LogOut, Moon, MoonStar, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { mockUser } from '@/mocks';
import { useThemeStore } from '@/store/themeStore';
import { useMockAuthStore } from '@/store/mockAuthStore';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex h-11 items-center"
    >
      <span className={cn('flex h-7 w-12 items-center rounded-full p-1 transition-colors', checked ? 'bg-brand-500' : 'bg-border')}>
        <span className={cn('h-5 w-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
      </span>
    </button>
  );
}

function Row({ icon, label, right, onClick }: { icon: ReactNode; label: string; right?: ReactNode; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className="flex min-h-14 w-full items-center gap-3 px-4 text-left"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
        {icon}
      </span>
      <span className="flex-1 text-[15px] font-semibold">{label}</span>
      {right}
    </Tag>
  );
}

/** 마이페이지 프레임 (프로필 수정/설정 상세는 Step 3A-5) */
export default function MyPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useThemeStore();
  const { isLoggedIn, logout } = useMockAuthStore();
  const [expireWarn, setExpireWarn] = useState(true);
  const [reaction, setReaction] = useState(true);
  const soon = (m: string) => toast.info(`${m} 기능은 다음 단계에서 만들어져요 🍳`);

  const handleLogout = () => {
    logout();
    toast.success('로그아웃 되었습니다.');
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black tracking-tight">마이페이지</h1>

      {isLoggedIn ? (
        <Card className="flex items-center gap-4 p-4">
          <img src={mockUser.profileImage} alt="프로필 이미지" className="h-16 w-16 rounded-full bg-brand-100 object-cover ring-2 ring-brand-200" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold">
              {mockUser.nickname}
              <span className="ml-1 text-sm font-semibold text-muted-foreground">#{mockUser.userTag}</span>
            </p>
            <p className="truncate text-sm text-muted-foreground">{mockUser.email}</p>
          </div>
          <button type="button" onClick={() => soon('프로필 수정')} className="min-h-11 rounded-full bg-brand-100 px-4 text-sm font-bold text-brand-700 active:scale-95 dark:bg-brand-900/40 dark:text-brand-200">
            수정
          </button>
        </Card>
      ) : (
        <Card className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-base font-extrabold text-foreground">로그인이 필요해요</p>
            <p className="text-xs text-muted-foreground">로그인하고 나만의 냉장고 레시피를 관리해보세요.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.LOGIN)}
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-brand-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 active:scale-95"
          >
            <LogIn className="h-4 w-4" />
            로그인
          </button>
        </Card>
      )}

      <section aria-label="알림 설정">
        <h2 className="mb-2 px-1 text-sm font-bold font-sans text-muted-foreground">알림 설정</h2>
        <Card className="divide-y divide-border overflow-hidden p-0">
          <Row icon={<BellRing className="h-5 w-5" />} label="소비기한 임박 알림" right={<Toggle checked={expireWarn} onChange={setExpireWarn} label="소비기한 임박 알림" />} />
          <Row icon={<BellRing className="h-5 w-5" />} label="좋아요/요리완료 알림" right={<Toggle checked={reaction} onChange={setReaction} label="좋아요 요리완료 알림" />} />
          <Row
            icon={<MoonStar className="h-5 w-5" />}
            label="방해금지 시간"
            onClick={() => soon('방해금지 시간 설정')}
            right={
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                {mockUser.quietTimeStart.slice(0, 5)} ~ {mockUser.quietTimeEnd.slice(0, 5)}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
            }
          />
        </Card>
      </section>

      <section aria-label="화면 설정">
        <h2 className="mb-2 px-1 text-sm font-bold font-sans text-muted-foreground">화면 설정</h2>
        <Card className="overflow-hidden p-0">
          <Row icon={<Moon className="h-5 w-5" />} label="다크 모드" right={<Toggle checked={theme === 'dark'} onChange={toggle} label="다크 모드" />} />
        </Card>
      </section>

      <section aria-label="계정">
        <Card className="divide-y divide-border overflow-hidden p-0">
          {isLoggedIn ? (
            <>
              <Row icon={<LogOut className="h-5 w-5" />} label="로그아웃" onClick={handleLogout} />
              <Row icon={<UserX className="h-5 w-5" />} label="회원 탈퇴" onClick={() => soon('회원 탈퇴')} />
            </>
          ) : (
            <Row icon={<LogIn className="h-5 w-5" />} label="소셜 로그인 하러가기" onClick={() => navigate(ROUTES.LOGIN)} />
          )}
        </Card>
      </section>
    </div>
  );
}
