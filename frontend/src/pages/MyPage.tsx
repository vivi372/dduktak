import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, ChevronRight, LogIn, LogOut, Moon, MoonStar, UserX, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { useThemeStore } from '@/store/themeStore';
import { useMockAuthStore } from '@/store/mockAuthStore';
import { useNotificationStore } from '@/store/notificationStore';
import {
  ProfileEditModal,
  QuietTimeModal,
  WithdrawModal,
  MyRecipeShortcutCard,
  ChangeEmailModal,
} from '@/components/mypage';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex h-11 items-center"
    >
      <span
        className={cn(
          'flex h-7 w-12 items-center rounded-full p-1 transition-colors',
          checked ? 'bg-brand-500' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </span>
    </button>
  );
}

function Row({
  icon,
  label,
  right,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  right?: ReactNode;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className="flex min-h-14 w-full items-center gap-3 px-4 text-left transition hover:bg-muted/30"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
        {icon}
      </span>
      <span className="flex-1 text-[15px] font-semibold">{label}</span>
      {right}
    </Tag>
  );
}

/**
 * 마이페이지 화면 (/mypage)
 * - 1:1 원형 프로필 프리뷰 & 크롭 모달, 닉네임#태그 표기
 * - 내 활동 숏컷(내가 쓴 레시피, 스크랩북)
 * - 알림 설정(소비기한, 소셜 반응, 야간 방해금지 시간 21:00~08:00)
 * - 다크 모드 화면 설정
 * - 로그아웃 및 회원 탈퇴(USER-02 레시피 익명 보존)
 */
export default function MyPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useThemeStore();
  const {
    isLoggedIn,
    user,
    logout,
    updateProfile,
    updateQuietTime,
    withdraw,
    changeEmail,
  } = useMockAuthStore();
  const { settings, updateSettings } = useNotificationStore();

  // 모달 제어 상태
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [quietTimeModalOpen, setQuietTimeModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [changeEmailModalOpen, setChangeEmailModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('로그아웃 되었습니다.');
    navigate(ROUTES.LOGIN);
  };

  const handleToggleExpireWarn = (checked: boolean) => {
    updateSettings({ isExpireWarnEnabled: checked });
    toast.success(checked ? '소비기한 알림을 켰어요' : '소비기한 알림을 껐어요');
  };

  const handleToggleReaction = (checked: boolean) => {
    updateSettings({ isReactionNoticeEnabled: checked });
    toast.success(checked ? '소셜 반응 알림을 켰어요' : '소셜 반응 알림을 껐어요');
  };

  const handleSaveQuietTime = (start: string, end: string) => {
    updateQuietTime(start, end);
    updateSettings({ quietTimeStart: start, quietTimeEnd: end });
  };

  const formattedQuietStart = (user.quietTimeStart || settings.quietTimeStart).slice(0, 5);
  const formattedQuietEnd = (user.quietTimeEnd || settings.quietTimeEnd).slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black tracking-tight">마이페이지</h1>

      {/* 1. 프로필 카드 */}
      {isLoggedIn ? (
        <Card className="flex items-center gap-4 p-4 shadow-card">
          <img
            src={user.profileImage}
            alt="프로필 이미지"
            className="h-16 w-16 rounded-full bg-brand-100 object-cover ring-2 ring-brand-300 dark:ring-brand-700/60 shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-lg font-extrabold text-foreground">{user.nickname}</p>
              <span className="text-xs font-bold text-muted-foreground/80">#{user.userTag}</span>
            </div>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="min-h-11 rounded-full bg-brand-100 px-4 text-sm font-bold text-brand-700 transition hover:bg-brand-200 active:scale-95 dark:bg-brand-900/40 dark:text-brand-200"
          >
            수정
          </button>
        </Card>
      ) : (
        <Card className="flex items-center justify-between gap-4 p-4 shadow-card">
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

      {/* 2. 내 활동 숏컷 (로그인 시) */}
      {isLoggedIn && (
        <section aria-label="내 활동 바로가기">
          <MyRecipeShortcutCard myRecipeCount={3} scrapCount={5} />
        </section>
      )}

      {/* 3. 알림 설정 섹션 */}
      <section aria-label="알림 설정">
        <h2 className="mb-2 px-1 text-sm font-bold font-sans text-muted-foreground">알림 설정</h2>
        <Card className="divide-y divide-border overflow-hidden p-0 shadow-card">
          <Row
            icon={<BellRing className="h-5 w-5" />}
            label="소비기한 임박 알림"
            right={
              <Toggle
                checked={settings.isExpireWarnEnabled}
                onChange={handleToggleExpireWarn}
                label="소비기한 임박 알림"
              />
            }
          />
          <Row
            icon={<BellRing className="h-5 w-5" />}
            label="좋아요/요리완료 알림"
            right={
              <Toggle
                checked={settings.isReactionNoticeEnabled}
                onChange={handleToggleReaction}
                label="좋아요 요리완료 알림"
              />
            }
          />
          <Row
            icon={<MoonStar className="h-5 w-5" />}
            label="방해금지 시간"
            onClick={() => setQuietTimeModalOpen(true)}
            right={
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                {formattedQuietStart} ~ {formattedQuietEnd}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
            }
          />
        </Card>
        <p className="mt-2 px-1 text-xs text-muted-foreground/80">
          * 야간 푸시 방지 정책에 따라 {formattedQuietStart} ~ {formattedQuietEnd} 시간대에는 푸시가 발송되지 않습니다.
        </p>
      </section>

      {/* 4. 화면 설정 섹션 */}
      <section aria-label="화면 설정">
        <h2 className="mb-2 px-1 text-sm font-bold font-sans text-muted-foreground">화면 설정</h2>
        <Card className="overflow-hidden p-0 shadow-card">
          <Row
            icon={<Moon className="h-5 w-5" />}
            label="다크 모드"
            right={<Toggle checked={theme === 'dark'} onChange={toggle} label="다크 모드" />}
          />
        </Card>
      </section>

      {/* 5. 계정 관리 섹션 */}
      <section aria-label="계정">
        <h2 className="mb-2 px-1 text-sm font-bold font-sans text-muted-foreground">계정</h2>
        <Card className="divide-y divide-border overflow-hidden p-0 shadow-card">
          {isLoggedIn ? (
            <>
              <Row
                icon={<Mail className="h-5 w-5" />}
                label="이메일 변경"
                onClick={() => setChangeEmailModalOpen(true)}
                right={
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {user.loginProvider === 'kakao'
                      ? '카카오 연동'
                      : user.loginProvider === 'google'
                        ? '구글 연동'
                        : user.email}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </span>
                }
              />
              <Row
                icon={<LogOut className="h-5 w-5" />}
                label="로그아웃"
                onClick={handleLogout}
              />
              <Row
                icon={<UserX className="h-5 w-5 text-destructive" />}
                label="회원 탈퇴"
                onClick={() => setWithdrawModalOpen(true)}
              />
            </>
          ) : (
            <Row
              icon={<LogIn className="h-5 w-5" />}
              label="소셜 로그인 하러가기"
              onClick={() => navigate(ROUTES.LOGIN)}
            />
          )}
        </Card>
      </section>

      {/* 모달 4종 */}
      {isLoggedIn && (
        <>
          <ProfileEditModal
            open={profileModalOpen}
            user={user}
            onClose={() => setProfileModalOpen(false)}
            onSave={(nickname, img) => updateProfile(nickname, img)}
            onOpenChangeEmail={() => {
              setProfileModalOpen(false);
              setChangeEmailModalOpen(true);
            }}
          />

          <ChangeEmailModal
            open={changeEmailModalOpen}
            user={user}
            onClose={() => setChangeEmailModalOpen(false)}
            onEmailChanged={(newEmail) => changeEmail(newEmail)}
          />

          <QuietTimeModal
            open={quietTimeModalOpen}
            quietTimeStart={user.quietTimeStart || settings.quietTimeStart}
            quietTimeEnd={user.quietTimeEnd || settings.quietTimeEnd}
            onClose={() => setQuietTimeModalOpen(false)}
            onSave={handleSaveQuietTime}
          />

          <WithdrawModal
            open={withdrawModalOpen}
            onClose={() => setWithdrawModalOpen(false)}
            onWithdraw={withdraw}
          />
        </>
      )}
    </div>
  );
}
