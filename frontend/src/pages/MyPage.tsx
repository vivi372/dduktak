import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  ChevronRight,
  LogIn,
  LogOut,
  Moon,
  MoonStar,
  UserX,
  Mail,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { useThemeStore } from '@/store/themeStore';
import { useAuth } from '@/hooks/useAuth';
import { useRecipes } from '@/hooks/useRecipe';
import { useUpdateNotificationSettings } from '@/hooks/useNotification';
import { useNotificationStore } from '@/store/notificationStore';
import {
  ProfileEditModal,
  QuietTimeModal,
  WithdrawModal,
  MyRecipeShortcutCard,
  ChangeEmailModal,
} from '@/components/mypage';
import { TermsModal, type TermsTab } from '@/components/common/TermsModal';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

const DEFAULT_AVATAR = 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/profiles/Default%20Profile.png';

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
    user,
    isAuthenticated,
    logout,
    updateProfileWithAvatar,
    isUpdatingProfileWithAvatar,
    updateQuietTime,
    isUpdatingQuietTime,
    withdraw,
    isWithdrawing,
  } = useAuth();
  const { settings, updateSettings } = useNotificationStore();
  const updateNotificationSettingsMutation = useUpdateNotificationSettings();

  // 모달 제어 상태
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [quietTimeModalOpen, setQuietTimeModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [changeEmailModalOpen, setChangeEmailModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsTab, setTermsTab] = useState<TermsTab>('terms');

  const handleOpenTerms = (tab: TermsTab) => {
    setTermsTab(tab);
    setTermsModalOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('로그아웃 되었습니다.');
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const handleToggleExpireWarn = (checked: boolean) => {
    updateSettings({ isExpireWarnEnabled: checked });
    toast.success(checked ? '소비기한 알림을 켰어요' : '소비기한 알림을 껐어요');
    updateNotificationSettingsMutation.mutate(
      { isExpireWarnEnabled: checked },
      {
        onError: () => {
          updateSettings({ isExpireWarnEnabled: !checked });
          toast.error('알림 설정 저장에 실패했습니다.');
        },
      },
    );
  };

  const handleToggleReaction = (checked: boolean) => {
    updateSettings({ isReactionNoticeEnabled: checked });
    toast.success(checked ? '소셜 반응 알림을 켰어요' : '소셜 반응 알림을 껐어요');
    updateNotificationSettingsMutation.mutate(
      { isReactionNoticeEnabled: checked },
      {
        onError: () => {
          updateSettings({ isReactionNoticeEnabled: !checked });
          toast.error('알림 설정 저장에 실패했습니다.');
        },
      },
    );
  };


  const handleSaveQuietTime = async (start: string, end: string) => {
    await updateNotificationSettingsMutation.mutateAsync({ quietTimeStart: start, quietTimeEnd: end });
    await updateQuietTime({ quietTimeStart: start, quietTimeEnd: end });
    updateSettings({ quietTimeStart: start, quietTimeEnd: end });
  };


  const handleSaveProfile = async (nickname: string, newAvatar?: string) => {
    await updateProfileWithAvatar({
      nickname,
      avatarFileOrDataUrl: newAvatar,
    });
  };

  const handleWithdraw = async () => {
    await withdraw();
    setWithdrawModalOpen(false);
    navigate(ROUTES.LOGIN);
  };

  // 실제 로그인 유저 데이터 또는 기본 폴백
  const displayUser = {
    userId: user?.userId || '',
    email: user?.email || '',
    nickname: user?.nickname || '뚝딱이',
    userTag: user?.userTag || '0000',
    profileImage: user?.profileImage || DEFAULT_AVATAR,
    status: (user?.status || 'ACTIVE') as 'ACTIVE' | 'WITHDRAWN',
    quietTimeStart: user?.quietTimeStart || settings.quietTimeStart || '21:00:00',
    quietTimeEnd: user?.quietTimeEnd || settings.quietTimeEnd || '08:00:00',
    loginProvider: (user?.loginProvider || 'email') as 'email' | 'kakao' | 'google',
  };

  const formattedQuietStart = displayUser.quietTimeStart.slice(0, 5);
  const formattedQuietEnd = displayUser.quietTimeEnd.slice(0, 5);

  // 실제 내가 작성한 레시피 및 스크랩북 건수 조회 (로그인 시)
  const { data: myRecipesData } = useRecipes({ filter: 'MY', size: 1 }, { enabled: isAuthenticated });
  const { data: scrapRecipesData } = useRecipes({ filter: 'SCRAP', size: 1 }, { enabled: isAuthenticated });
  const myRecipeCount = myRecipesData?.totalElements ?? 0;
  const scrapCount = scrapRecipesData?.totalElements ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black tracking-tight">마이페이지</h1>

      {/* 1. 프로필 카드 */}
      {isAuthenticated ? (
        <Card className="flex items-center gap-4 p-4 shadow-card">
          <img
            src={displayUser.profileImage}
            alt="프로필 이미지"
            className="h-16 w-16 rounded-full bg-brand-100 object-cover ring-2 ring-brand-300 dark:ring-brand-700/60 shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-lg font-extrabold text-foreground">{displayUser.nickname}</p>
              <span className="text-xs font-bold text-muted-foreground/80">#{displayUser.userTag}</span>
            </div>
            <p className="truncate text-sm text-muted-foreground">{displayUser.email}</p>
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
      {isAuthenticated && (
        <section aria-label="내 활동 바로가기">
          <MyRecipeShortcutCard myRecipeCount={myRecipeCount} scrapCount={scrapCount} />
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
          {isAuthenticated ? (
            <>
              <Row
                icon={<Mail className="h-5 w-5" />}
                label="이메일 변경"
                onClick={() => setChangeEmailModalOpen(true)}
                right={
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {displayUser.email}
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

      {/* 6. 이용 안내 및 약관 섹션 (USER-PAGE-05 & USER-02) */}
      <section aria-label="이용 안내 및 약관">
        <h2 className="mb-2 px-1 text-sm font-bold font-sans text-muted-foreground">이용 안내 및 약관</h2>
        <Card className="divide-y divide-border overflow-hidden p-0 shadow-card">
          <Row
            icon={<FileText className="h-5 w-5" />}
            label="서비스 이용약관"
            onClick={() => handleOpenTerms('terms')}
            right={<ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />}
          />
          <Row
            icon={<ShieldCheck className="h-5 w-5" />}
            label="개인정보 처리방침"
            onClick={() => handleOpenTerms('privacy')}
            right={<ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />}
          />
        </Card>
      </section>

      {/* 약관 조회 모달 (로그인/비로그인 공통 상시 열람 가능) */}
      <TermsModal
        open={termsModalOpen}
        initialTab={termsTab}
        onClose={() => setTermsModalOpen(false)}
      />

      {/* 모달 4종 (로그인 전용) */}
      {isAuthenticated && (
        <>
          <ProfileEditModal
            open={profileModalOpen}
            user={displayUser}
            onClose={() => setProfileModalOpen(false)}
            onSave={handleSaveProfile}
            isSaving={isUpdatingProfileWithAvatar}
            onOpenChangeEmail={() => {
              setProfileModalOpen(false);
              setChangeEmailModalOpen(true);
            }}
          />

          <ChangeEmailModal
            open={changeEmailModalOpen}
            user={displayUser}
            onClose={() => setChangeEmailModalOpen(false)}
            onEmailChanged={() => {
              toast.success('이메일 변경 인증 메일이 발송되었습니다.');
            }}
          />

          <QuietTimeModal
            open={quietTimeModalOpen}
            quietTimeStart={displayUser.quietTimeStart}
            quietTimeEnd={displayUser.quietTimeEnd}
            onClose={() => setQuietTimeModalOpen(false)}
            onSave={handleSaveQuietTime}
            isSaving={isUpdatingQuietTime}
          />

          <WithdrawModal
            open={withdrawModalOpen}
            onClose={() => setWithdrawModalOpen(false)}
            onWithdraw={handleWithdraw}
            isWithdrawing={isWithdrawing}
          />
        </>
      )}
    </div>
  );
}
