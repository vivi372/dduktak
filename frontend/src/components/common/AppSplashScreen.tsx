import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { Sparkles, Utensils } from 'lucide-react';
import { useAppSplashStore } from '@/store/useAppSplashStore';
import logoIcon from '@/assets/logo-icon.png';

interface AppSplashScreenProps {
  /** 스플래시 노출 유지 시간 (밀리초, 기본값 1600ms) */
  duration?: number;
}

/**
 * 앱 구동 오프닝 인트로 & 스플래시 애니메이션 (App Launch Splash Screen)
 * - 브랜드 공식 로고(logo-icon.png)와 테마 컬러(코랄 핑크 #FF8A7A, 민트 티얼 #4ECDC4)를 적용한 오프닝 모션
 * - Capacitor 네이티브 스플래시 스크린 자동 Hide 및 깜빡임 없는 크로스페이드(Fade-out) 연동
 */
export function AppSplashScreen({ duration = 1600 }: AppSplashScreenProps) {
  const { isVisible, hideSplash } = useAppSplashStore();

  useEffect(() => {
    // 1. 하이브리드 모바일 환경일 경우 네이티브 스플래시를 즉시 은폐하고 리액트 리치 애니메이션으로 바통 터치
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch(() => {
        // 웹 브라우저나 플러그인 미지원 환경 무시
      });
    }

    if (!isVisible) return;

    // 2. 지정된 duration 경과 시 부드러운 페이드아웃 종료
    const timer = setTimeout(() => {
      hideSplash();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, hideSplash]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="app-splash-screen"
          role="status"
          aria-label="앱 로딩 인트로 화면"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-brand-50/95 via-background to-mint-50/60 px-6 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
        >
          {/* 배경 감성 라이트 글로우 효과 */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-600/10" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-mint-300/30 blur-3xl dark:bg-mint-600/10" />

          {/* 상단 여백 (공간 균형) */}
          <div className="h-6 w-full" />

          {/* 중앙 메인 브랜딩 & 로고 애니메이션 컨테이너 */}
          <div className="flex flex-col items-center text-center">
            {/* 펄스 링 & 로고 아이콘 바운스 */}
            <div className="relative mb-6 flex items-center justify-center">
              {/* 외부 확산 펄스 링 (코랄 & 민트) */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.4, 1.6], opacity: [0.6, 0.25, 0] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="absolute h-36 w-36 rounded-full bg-gradient-to-tr from-brand-400 to-mint-400 blur-md"
              />

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.25, 1.4], opacity: [0.4, 0.2, 0] }}
                transition={{
                  duration: 1.8,
                  delay: 0.3,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="absolute h-32 w-32 rounded-full bg-brand-400/40 blur-sm"
              />

              {/* 로고 카드 본체 */}
              <motion.div
                initial={{ scale: 0.5, y: 20, opacity: 0 }}
                animate={{ scale: [0.5, 1.08, 1], y: 0, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 18,
                  duration: 0.8,
                }}
                className="relative flex h-28 w-28 items-center justify-center rounded-[32px] bg-card p-3 shadow-2xl ring-4 ring-brand-200/80 dark:ring-brand-800/60"
              >
                <img
                  src={logoIcon}
                  alt="오늘의 뚝딱 로고"
                  className="h-full w-full object-contain drop-shadow-md"
                />
              </motion.div>
            </div>

            {/* 브랜드 슬로건 뱃지 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/90 px-3.5 py-1 text-xs font-black text-brand-700 shadow-sm dark:bg-brand-950/60 dark:text-brand-300"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-500 animate-pulse" />
              <span>1인 가구 냉장고 파먹기 & 맞춤 요리</span>
            </motion.div>

            {/* 서비스 타이틀 */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl"
            >
              오늘의 <span className="text-brand-500 underline decoration-mint-400 decoration-wavy decoration-2 underline-offset-4">뚝딱</span>
            </motion.h1>

            {/* 감성 서브 카피 */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="mt-2 text-sm font-medium text-muted-foreground"
            >
              냉장고 속 재료로 완성하는 나만의 황금 식탁 🍳
            </motion.p>
          </div>

          {/* 하단 로딩 진행 게이지 & 상태 인디케이터 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex w-full max-w-[240px] flex-col items-center gap-2.5 pb-4"
          >
            {/* 프로그레스 바 */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: duration / 1000 - 0.2, ease: 'easeInOut' }}
                className="h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-mint-400"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/80">
              <Utensils className="h-3 w-3 animate-spin text-brand-500" />
              <span>냉장고 재료를 준비하고 있어요...</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
