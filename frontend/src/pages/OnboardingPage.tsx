import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Receipt,
  Refrigerator,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useAuthStore } from '@/store/useAuthStore';

/** 온보딩 슬라이드 데이터 인터페이스 */
interface OnboardingSlide {
  id: number;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  visualComponent: React.ReactNode;
}

/**
 * 앱 최초 실행 사용자 가이드 온보딩 (First-Run Walkthrough)
 * - 3단계 인터랙티브 감성 일러스트 비주얼 슬라이드 (냉장고 관리, 영수증 OCR 스캔, 레시피 매칭)
 * - 스와이프 제스처 및 인디케이터 닷
 * - 필수 권한(카메라, 푸시 알림) 친화적 사전 안내 다이얼로그
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { markOnboardingAsSeen } = useOnboardingStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  /** 온보딩 완료 및 서비스 진입 */
  const handleFinishOnboarding = () => {
    markOnboardingAsSeen();
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      navigate(ROUTES.HOME, { replace: true });
    } else {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  /** 건너뛰기 클릭 */
  const handleSkip = () => {
    handleFinishOnboarding();
  };

  /** 다음 슬라이드 */
  const handleNext = () => {
    if (currentIndex < 2) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowPermissionDialog(true);
    }
  };

  /** 이전 슬라이드 */
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const slides: OnboardingSlide[] = [
    {
      id: 1,
      badge: 'D-Day 신호등 스마트 관리',
      badgeColor: 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300',
      title: '버려지는 재료 없이\n똑똑하게 지키는 내 냉장고',
      description:
        '소비기한 D-Day 신호등으로 남은 날짜를 한눈에 파악해요.\n냉장·냉동·실온 보관 위치별로 깔끔하게 정리해 드려요.',
      visualComponent: (
        <div className="relative flex h-56 w-full items-center justify-center">
          {/* 중앙 미니 냉장고 컨테이너 */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative flex h-48 w-40 flex-col items-center justify-between rounded-3xl border-2 border-brand-200/80 bg-gradient-to-b from-card to-brand-50/50 p-3.5 shadow-xl dark:border-brand-900/60 dark:from-slate-900 dark:to-slate-800"
          >
            {/* 상단 냉동실 */}
            <div className="flex h-16 w-full items-center justify-between rounded-2xl bg-brand-100/60 p-2.5 dark:bg-brand-900/30">
              <span className="text-[11px] font-bold text-brand-600 dark:text-brand-300">❄️ 냉동실</span>
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                D-28
              </span>
            </div>

            {/* 하단 냉장실 */}
            <div className="flex h-24 w-full flex-col justify-around rounded-2xl bg-card/80 p-2.5 shadow-sm border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">🥚 신선 달걀</span>
                <span className="rounded-full bg-dday-urgent/20 px-2 py-0.5 text-[10px] font-extrabold text-dday-urgent animate-pulse">
                  D-1
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">🥛 저지방 우유</span>
                <span className="rounded-full bg-dday-warning/20 px-2 py-0.5 text-[10px] font-extrabold text-dday-warning">
                  D-3
                </span>
              </div>
            </div>
          </motion.div>

          {/* 좌측 플로팅 신호등 뱃지 */}
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-6 top-8 flex items-center gap-1.5 rounded-2xl border border-brand-200 bg-card px-3 py-1.5 shadow-lg dark:border-brand-800"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-dday-urgent animate-ping" />
            <span className="text-xs font-black text-dday-urgent">소비기한 임박!</span>
          </motion.div>

          {/* 우측 플로팅 안심 뱃지 */}
          <motion.div
            animate={{ y: [4, -4, 4] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute right-6 bottom-6 flex items-center gap-1.5 rounded-2xl border border-mint-200 bg-card px-3 py-1.5 shadow-lg dark:border-mint-800"
          >
            <Refrigerator className="h-4 w-4 text-mint-500" />
            <span className="text-xs font-bold text-foreground">1인 1냉장고 안심</span>
          </motion.div>
        </div>
      ),
    },
    {
      id: 2,
      badge: '1초 만에 쏙! AI 간편 스캔',
      badgeColor: 'bg-mint-100 text-mint-700 dark:bg-mint-950/60 dark:text-mint-300',
      title: '장보고 온 영수증 한 장,\n영수증 스캔으로 1초 등록',
      description:
        '영수증 사진 한 장만 찰칵 찍으면,\nAI 엔진이 식재료를 자동으로 분석해 채워줘요.',
      visualComponent: (
        <div className="relative flex h-56 w-full items-center justify-center">
          {/* 영수증 스캐너 프레임 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative flex h-48 w-56 flex-col items-center justify-center rounded-3xl border-2 border-mint-300/80 bg-card/90 p-4 shadow-xl backdrop-blur-sm dark:border-mint-700/60"
          >
            {/* 코너 가이드라인 */}
            <div className="absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2 border-mint-500" />
            <div className="absolute top-2 right-2 h-4 w-4 border-t-2 border-r-2 border-mint-500" />
            <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-mint-500" />
            <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-mint-500" />

            {/* 레이저 스캔 라인 애니메이션 */}
            <motion.div
              animate={{ y: [-40, 40, -40] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute h-0.5 w-44 rounded-full bg-gradient-to-r from-transparent via-mint-500 to-transparent shadow-[0_0_8px_#4ECDC4]"
            />

            {/* 영수증 및 AI 시각 요소 */}
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-50 text-mint-600 shadow-soft dark:bg-mint-950/60 dark:text-mint-400">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-soft dark:bg-brand-950/60 dark:text-brand-400">
                <Receipt className="h-8 w-8" />
              </div>
            </div>

            <p className="mt-3 text-xs font-bold text-mint-600 dark:text-mint-400">
              ⚡ 자동 식재료 분석 완료!
            </p>
          </motion.div>

          {/* 상단 플로팅 태그 */}
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 rounded-full bg-gradient-to-r from-mint-500 to-teal-500 px-3.5 py-1 text-[11px] font-black text-white shadow-md"
          >
            Google ML Kit & Gemini Flash AI
          </motion.div>
        </div>
      ),
    },
    {
      id: 3,
      badge: '1인 가구 황금 레시피 매칭',
      badgeColor: 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300',
      title: '오늘 뭐 먹지? 고민 끝!\n남은 재료 맞춤 뚝딱 요리',
      description:
        '소비기한 임박 재료를 1순위로 활용하는 스마트 매칭!\n요리 후 냉장고 속 재료가 자동으로 차감돼요.',
      visualComponent: (
        <div className="relative flex h-56 w-full items-center justify-center">
          {/* 매칭 레시피 카드 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative flex h-48 w-56 flex-col justify-between rounded-3xl border-2 border-brand-300/80 bg-gradient-to-br from-card to-cream-50 p-4 shadow-xl dark:border-brand-800 dark:from-slate-900 dark:to-slate-800"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-0.5 text-[11px] font-black text-white shadow-sm">
                <Flame className="h-3 w-3" />
                매칭률 95%
              </span>
              <span className="text-xl">🍳</span>
            </div>

            <div>
              <h4 className="text-sm font-black text-foreground">토마토 달걀 볶음</h4>
              <p className="mt-1 text-[11px] text-muted-foreground">보유 재료: 방울토마토, 달걀, 대파</p>
            </div>

            {/* 자동 차감 완료 뱃지 */}
            <div className="flex items-center gap-1.5 rounded-xl bg-mint-500/15 p-2 text-[11px] font-bold text-mint-700 dark:text-mint-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-mint-500" />
              <span>요리완료 시 재료 자동 차감</span>
            </div>
          </motion.div>

          {/* 우측 상단 플로팅 장식 */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -right-1 top-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg"
          >
            <UtensilsCrossed className="h-5 w-5" />
          </motion.div>
        </div>
      ),
    },
  ];

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative flex min-h-dvh w-full flex-col justify-between overflow-hidden bg-gradient-to-b from-brand-50/70 via-background to-mint-50/50 p-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* 배경 장식 원형 블러 */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl dark:bg-brand-600/10" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-mint-300/20 blur-3xl dark:bg-mint-600/10" />

      {/* 상단 헤더: 건너뛰기 액션 */}
      <div className="relative z-10 flex h-12 w-full items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <span className="text-xs font-black tracking-wide text-brand-600 dark:text-brand-400">
            오늘의 뚝딱 시작 가이드
          </span>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-full px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5 active:scale-95"
        >
          건너뛰기
        </button>
      </div>

      {/* 중앙 메인 슬라이드 콘텐츠 (애니메이션 전환) */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center my-4 min-h-[460px] w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex w-full max-w-[360px] flex-col items-center text-center"
          >
            {/* 비주얼 일러스트 프레임 */}
            <div className="w-full">{currentSlide.visualComponent}</div>

            {/* 슬라이드 뱃지 */}
            <div className="mt-4">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black shadow-sm ${currentSlide.badgeColor}`}
              >
                {currentSlide.badge}
              </span>
            </div>

            {/* 타이틀 */}
            <h2 className="mt-3 whitespace-pre-line text-2xl font-black tracking-tight text-foreground leading-snug">
              {currentSlide.title}
            </h2>

            {/* 상세 설명 */}
            <p className="mt-2.5 whitespace-pre-line text-xs font-medium leading-relaxed text-muted-foreground">
              {currentSlide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단 네비게이션 & 인디케이터 바 */}
      <div className="relative z-10 flex w-full flex-col items-center gap-5 pb-2">
        {/* 3단계 인디케이터 닷 */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`${idx + 1}번째 슬라이드로 이동`}
              onClick={() => setCurrentIndex(idx)}
              className="p-1 focus:outline-none"
            >
              <motion.div
                animate={{
                  width: currentIndex === idx ? 28 : 8,
                  backgroundColor:
                    currentIndex === idx
                      ? '#FF8A7A'
                      : 'rgba(156, 163, 175, 0.4)',
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full"
              />
            </button>
          ))}
        </div>

        {/* 액션 버튼 트레이 */}
        <div className="flex w-full items-center gap-3">
          {currentIndex > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handlePrev}
              className="h-12 w-14 shrink-0 rounded-2xl border-border font-bold active:scale-95"
              aria-label="이전 슬라이드"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-0" />
          )}

          <Button
            type="button"
            size="lg"
            onClick={handleNext}
            className="flex-1 h-12 rounded-2xl text-base font-black shadow-soft transition-transform active:scale-[0.98]"
          >
            {currentIndex === 2 ? (
              <span className="flex items-center gap-1.5">
                <span>오늘의 뚝딱 시작하기</span>
                <span>🍳</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span>다음</span>
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* 권한 사전 안내 다이얼로그 (시작하기 클릭 시 노출) */}
      <AnimatePresence>
        {showPermissionDialog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="앱 필수 권한 사전 안내"
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPermissionDialog(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="relative z-10 w-full max-w-[360px] overflow-hidden rounded-[28px] border border-brand-200/60 bg-card p-6 shadow-2xl dark:border-brand-800/40"
            >
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 shadow-soft dark:bg-brand-900/40 dark:text-brand-300">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="mt-3.5 text-lg font-black text-foreground">
                  더 편리한 요리 생활을 위한 권한 안내
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  권한을 허용하지 않아도 기본 기능은 이용할 수 있어요.
                </p>
              </div>

              {/* 권한 목록 */}
              <div className="mt-5 flex flex-col gap-3">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/60 border border-border">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint-500/15 text-mint-600 dark:text-mint-400">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">카메라 (선택)</h5>
                    <p className="text-[11px] text-muted-foreground">
                      식재료 영수증 사진 촬영에 사용돼요.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/60 border border-border">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">알림 (선택)</h5>
                    <p className="text-[11px] text-muted-foreground">
                      소비기한 D-Day 임박 소식 및 맞춤 요리 알림을 받아요.
                    </p>
                  </div>
                </div>
              </div>

              {/* 하단 최종 진입 버튼 */}
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full text-base font-black shadow-soft"
                  onClick={handleFinishOnboarding}
                >
                  확인하고 뚝딱 시작하기
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
