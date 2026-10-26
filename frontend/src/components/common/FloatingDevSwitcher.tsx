import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, Globe, LogIn, LogOut, Play, Refrigerator, Smartphone, Sparkles, Wrench, X } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/routes';
import { useMockAuthStore } from '@/store/mockAuthStore';
import { useAppSplashStore } from '@/store/useAppSplashStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { usePlatformStore, type PlatformMode } from '@/store/usePlatformStore';
import { cn } from '@/utils/cn';

/**
 * 개발자 검수용 플로팅 상태 스위처 (Floating Dev Switcher)
 * - 한 번의 클릭으로 [플랫폼 모드: 자동/App/Web], [정상 브리핑 vs 재료 0개 Empty State], [로그인 vs 비로그인], [온보딩 웰컴 모달]을 즉시 전환
 */
export function FloatingDevSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { replaySplash } = useAppSplashStore();
  const { resetOnboarding } = useOnboardingStore();
  const { mode, isApp, setMode } = usePlatformStore();
  const {
    isLoggedIn,
    hasIngredients,
    setHasIngredients,
    login,
    logout,
    openWelcomeModal,
  } = useMockAuthStore();

  const handlePlatformChange = (newMode: PlatformMode) => {
    setMode(newMode);
    toast.success(
      newMode === 'auto'
        ? '🤖 자동 감지 모드로 전환되었습니다.'
        : newMode === 'app'
        ? '📱 강제 모바일 앱(Webview) 모드로 전환되었습니다.'
        : '💻 강제 PC/모바일 웹 브라우저 모드로 전환되었습니다.',
    );
  };

  /** 재료 보유 상태 토글 */
  const handleToggleIngredients = (has: boolean) => {
    setHasIngredients(has);
    toast.success(has ? '🟢 정상 브리핑 상태 (임박 재료 보유)' : '⚪ 재료 0개 Empty State 상태');
  };

  /** 로그인/로그아웃 전환 */
  const handleToggleAuth = () => {
    if (isLoggedIn) {
      logout();
      navigate(ROUTES.LOGIN);
      toast.info('로그아웃 되었습니다. (로그인 화면으로 이동)');
    } else {
      login('kakao');
      navigate(ROUTES.HOME);
      toast.success('로그인 되었습니다! (온보딩 웰컴 모달 호출)');
    }
  };

  return (
    <>
      {/* 화면 우측 하단 플로팅 버튼 (하단 탭바 위에 안전하게 안착) */}
      <div className="fixed bottom-24 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="개발자 검수 스위처"
          aria-expanded={isOpen}
          className="flex h-10 items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md ring-2 ring-brand-300 transition-transform hover:scale-105 active:scale-95 dark:bg-slate-100 dark:text-slate-900"
        >
          <Wrench className="h-3.5 w-3.5 text-brand-400 dark:text-brand-600" />
          <span>DEV</span>
        </button>
      </div>

      {/* 개발자 컨트롤 패널 팝오버 */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
            {/* 오버레이 */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* 컨트롤러 카드 */}
            <motion.div
              className="relative z-10 w-full max-w-[360px] overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              {/* 패널 헤더 */}
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">
                    <Wrench className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">개발자 검수 스위처</h3>
                    <p className="text-[11px] text-muted-foreground">목 데이터 &amp; 화면 시나리오 제어</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 컨트롤 옵션 목록 */}
              <div className="space-y-3.5 text-xs">
                {/* 0. 플랫폼 환경 분기 (웹 / 앱 시뮬레이션) */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-bold text-muted-foreground flex items-center gap-1">
                      {isApp ? <Smartphone className="h-3.5 w-3.5 text-brand-500" /> : <Globe className="h-3.5 w-3.5 text-mint-500" />}
                      실행 플랫폼
                    </span>
                    <span className="font-semibold text-brand-600 dark:text-brand-300">
                      {isApp ? '📱 모바일 앱 모드' : '💻 웹 브라우저 모드'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => handlePlatformChange('auto')}
                      className={cn(
                        'min-h-8 rounded-lg font-bold text-[11px] transition-all',
                        mode === 'auto'
                          ? 'bg-foreground text-background shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      자동 (감지)
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlatformChange('web')}
                      className={cn(
                        'min-h-8 rounded-lg font-bold text-[11px] transition-all',
                        mode === 'web'
                          ? 'bg-mint-500 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      강제 Web
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlatformChange('app')}
                      className={cn(
                        'min-h-8 rounded-lg font-bold text-[11px] transition-all',
                        mode === 'app'
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      강제 App
                    </button>
                  </div>
                </div>

                {/* 1. 홈 브리핑 식재료 상태 */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-bold text-muted-foreground flex items-center gap-1">
                      <Refrigerator className="h-3.5 w-3.5" /> 홈 브리핑 상태
                    </span>
                    <span className="font-semibold text-brand-600 dark:text-brand-300">
                      {hasIngredients ? '정상 (재료 보유)' : 'Empty State (재료 0개)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => handleToggleIngredients(true)}
                      className={cn(
                        'min-h-8 rounded-lg font-bold transition-all',
                        hasIngredients
                          ? 'bg-brand-500 text-brand-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      재료 보유 (정상)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleIngredients(false)}
                      className={cn(
                        'min-h-8 rounded-lg font-bold transition-all',
                        !hasIngredients
                          ? 'bg-brand-500 text-brand-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      재료 0개 (Empty)
                    </button>
                  </div>
                </div>

                {/* 2. 로그인 세션 상태 */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-bold text-muted-foreground flex items-center gap-1">
                      {isLoggedIn ? <LogIn className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
                      인증 세션
                    </span>
                    <span className="font-semibold text-brand-600 dark:text-brand-300">
                      {isLoggedIn ? '로그인 상태' : '비로그인 상태'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAuth}
                    className="flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 font-bold text-foreground transition-all hover:bg-accent active:scale-[0.98]"
                  >
                    {isLoggedIn ? (
                      <>
                        <LogOut className="h-3.5 w-3.5 text-dday-urgent" />
                        <span>로그아웃 후 로그인 화면(/login) 이동</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="h-3.5 w-3.5 text-mint-600 dark:text-mint-400" />
                        <span>로그인 처리 후 홈(/) 이동</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 3. 온보딩 웰컴 모달 직접 호출 */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      openWelcomeModal();
                    }}
                    className="flex min-h-9 w-full items-center justify-center gap-2 rounded-xl bg-mint-500 px-3 font-bold text-mint-foreground shadow-soft transition-all hover:bg-mint-400 active:scale-[0.98]"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>온보딩 웰컴 모달 띄우기</span>
                  </button>
                </div>

                {/* 4. 최초 실행 가이드 온보딩(/onboarding) 다시보기 */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      resetOnboarding();
                      navigate(ROUTES.ONBOARDING);
                      toast.info('온보딩 이력이 초기화되어 가이드 화면으로 이동했습니다.');
                    }}
                    className="flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-3 font-bold text-brand-700 shadow-sm transition-all hover:bg-brand-100 active:scale-[0.98] dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-300"
                  >
                    <Compass className="h-3.5 w-3.5 text-brand-500" />
                    <span>앱 온보딩 가이드 다시보기</span>
                  </button>
                </div>

                {/* 5. 앱 실행 인트로 스플래시 애니메이션 다시보기 */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      replaySplash();
                      toast.info('앱 실행 인트로 스플래시 애니메이션을 재생합니다.');
                    }}
                    className="flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-3 font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-200 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Play className="h-3.5 w-3.5 text-brand-500" />
                    <span>스플래시 인트로 다시보기</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
