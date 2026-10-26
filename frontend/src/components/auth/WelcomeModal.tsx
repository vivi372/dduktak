import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * 첫 로그인 온보딩 웰컴 모달 (06_UI_UX_GUIDELINES.md 4.5절 및 module_01_user.md 2.3절 준수)
 * - 기본 캐릭터 아바타 안내 툴팁 및 프로필 설정 유도
 */
export function WelcomeModal() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, showWelcomeModal: authShowWelcomeModal, closeWelcomeModal } = useAuthStore();

  const isExcludedPage =
    pathname === ROUTES.LOGIN ||
    pathname === ROUTES.ONBOARDING ||
    pathname === ROUTES.RESET_PASSWORD;

  const showWelcomeModal = !isExcludedPage && authShowWelcomeModal;

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!showWelcomeModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWelcomeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showWelcomeModal, closeWelcomeModal]);

  /** [프로필 설정하기] 클릭 시 마이페이지로 이동 */
  const handleGoProfile = () => {
    closeWelcomeModal();
    navigate(ROUTES.MYPAGE);
  };

  /** [나중에 하기] 클릭 시 홈으로 바로 이동 */
  const handleLater = () => {
    closeWelcomeModal();
    navigate(ROUTES.HOME);
  };

  if (!user) return null;


  return (
    <AnimatePresence>
      {showWelcomeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="온보딩 환영 안내"
        >
          {/* 어두운 배경 오버레이 */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWelcomeModal}
          />

          {/* 모달 본문 카드 */}
          <motion.div
            className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-[28px] border border-brand-200/60 bg-card p-6 shadow-2xl dark:border-brand-800/40"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* 상단 닫기 버튼 */}
            <button
              type="button"
              onClick={closeWelcomeModal}
              aria-label="닫기"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>

            {/* 프로필 아바타 영역 (원형 프레임) */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4 mt-2">
                <div className="h-24 w-24 overflow-hidden rounded-full bg-brand-100 ring-4 ring-brand-300/60 shadow-soft dark:bg-brand-900/30 dark:ring-brand-700/60">
                  <img
                    src={user.profileImage}
                    alt="기본 캐릭터 프로필"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-brand-foreground shadow-md ring-2 ring-card">
                  <Camera className="h-4 w-4" />
                </span>
              </div>

              {/* 환영 헤드라인 */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>가입을 환영해요!</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-foreground">
                반가워요, {user.nickname}님! 🍳
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                나만의 프로필 사진으로 꾸며볼까요?
              </p>

              {/* 친절한 온보딩 툴팁 안내 박스 */}
              <div className="mt-4 rounded-2xl bg-cream-100/90 border border-brand-200/60 p-3.5 text-left text-xs leading-relaxed text-brand-900 dark:bg-brand-950/40 dark:border-brand-800/60 dark:text-brand-100">
                <span className="font-bold text-brand-700 dark:text-brand-300">💬 기본 캐릭터로 먼저 시작돼요!</span>
                <p className="mt-1 text-muted-foreground dark:text-brand-200/80">
                  마이페이지에서 언제든 나만의 사진으로 프로필을 변경할 수 있어요.
                </p>
              </div>

              {/* 하단 액션 버튼 트레이 (Thumb Zone 고려) */}
              <div className="mt-6 flex w-full flex-col gap-2.5">
                <Button
                  size="lg"
                  className="w-full text-base font-bold shadow-soft"
                  onClick={handleGoProfile}
                >
                  프로필 설정하기
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleLater}
                >
                  나중에 하기
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
