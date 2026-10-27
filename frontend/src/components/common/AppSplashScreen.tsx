import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { RefreshCw, Sparkles, Utensils } from 'lucide-react';
import { useAppSplashStore } from '@/store/useAppSplashStore';
import { pingBackend } from '@/services/serverWarmupService';
import logoHd from '@/assets/logo-hd.png';

interface AppSplashScreenProps {
  /** 브랜드 로고 감상을 위한 최소 노출 시간 (밀리초, 기본값 1500ms) */
  minDuration?: number;
  /** 하위 호환용 duration props */
  duration?: number;
}

/**
 * 앱 구동 오프닝 인트로 & 스마트 서버 웜업 스플래시 (App Launch & Server Warmup Splash)
 * - Render 무료 티어 15분 슬립(Cold Start: 약 30~50초) 대응
 * - 완전 불투명(100% Opacity) 화면으로 뒤편의 로딩 스켈레톤이나 에러 화면 노출을 100% 원천 차단
 * - 웹과 모바일 모두 최초 진입 시 브랜드 오프닝 애니메이션과 함께 조용히 백엔드를 깨웁니다.
 */
export function AppSplashScreen({ minDuration, duration = 1500 }: AppSplashScreenProps) {
  const effectiveMinDuration = minDuration ?? duration;
  const { isVisible, hideSplash } = useAppSplashStore();

  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('냉장고 재료를 준비하고 있어요...');
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const isCompletedRef = useRef(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // 하이브리드 모바일 환경일 경우 네이티브 스플래시를 즉시 은폐하고 리액트 애니메이션으로 전환
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch(() => {});
    }

    if (!isVisible) return;

    startTimeRef.current = Date.now();
    isCompletedRef.current = false;
    setProgress(15);
    setIsWarmingUp(false);
    setIsTimedOut(false);
    setStatusText('냉장고 재료를 준비하고 있어요...');

    let isMounted = true;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let progressTimer: ReturnType<typeof setInterval> | null = null;

    // 1. 게이지 부드러운 전진 애니메이션 (0~1.5초 동안 약 75%까지 전진)
    progressTimer = setInterval(() => {
      if (!isMounted || isCompletedRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed < effectiveMinDuration) {
        // 0 ~ 1.5초 구간: 15% -> 75% 자연스러운 상승
        const target = Math.min(75, Math.floor(15 + (elapsed / effectiveMinDuration) * 60));
        setProgress(target);
      } else {
        // 1.5초 초과 (Cold Start 대기 중): 75% -> 90%까지 천천히 슬로우 전진
        setProgress((prev) => {
          if (prev < 90) return prev + 1;
          return prev;
        });

        // 2.5초 이상 경과 시 서버 재기동 친절 안내 문구로 전환
        if (elapsed > 2500 && elapsed <= 15000) {
          setIsWarmingUp(true);
          setStatusText('냉장고 서버를 깨우고 있어요! 잠시만 기다려주세요 🍳 (최대 30초 소요)');
        } else if (elapsed > 15000 && elapsed <= 45000) {
          setIsWarmingUp(true);
          setStatusText('서버가 기동 중입니다! 거의 다 준비되었어요 ✨');
        } else if (elapsed > 45000) {
          setIsTimedOut(true);
          setStatusText('서버 연결이 지연되고 있어요. 네트워크를 확인해 주세요.');
        }
      }
    }, 150);

    // 2. 백엔드 무음 헬스체크 및 웜업 폴링 함수
    const startWarmupCheck = async () => {
      if (!isMounted || isCompletedRef.current) return;

      const result = await pingBackend(5000);

      if (!isMounted) return;

      if (result.ok) {
        // 서버 기동 확인 완료!
        const elapsed = Date.now() - startTimeRef.current;
        const remainMinTime = Math.max(0, effectiveMinDuration - elapsed);

        // 최소 애니메이션 시간(1.5초)을 채운 뒤 100% 완료로 전환
        setTimeout(() => {
          if (!isMounted) return;
          isCompletedRef.current = true;
          setProgress(100);
          setStatusText('준비가 완료되었습니다! 뚝딱 시작합니다 🎉');

          // 로딩바가 100%에 도달한 후 부드러운 페이드아웃 종료
          setTimeout(() => {
            if (isMounted) hideSplash();
          }, 350);
        }, remainMinTime);
      } else {
        // 서버가 아직 슬립 상태거나 부팅 중: 2.5초 후 재시도
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed < 60000) {
          pollTimer = setTimeout(startWarmupCheck, 2500);
        } else {
          setIsTimedOut(true);
        }
      }
    };

    startWarmupCheck();

    return () => {
      isMounted = false;
      if (pollTimer) clearTimeout(pollTimer);
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [isVisible, effectiveMinDuration, hideSplash]);

  const handleForceEnter = () => {
    isCompletedRef.current = true;
    setProgress(100);
    setTimeout(() => {
      hideSplash();
    }, 200);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="app-splash-screen"
          role="status"
          aria-label="앱 로딩 인트로 화면"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.99, filter: 'blur(6px)' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#FFF5F2] via-background to-[#F0FAF7] px-6 py-12 dark:from-[#180E0C] dark:via-background dark:to-[#0D1816]"
        >
          {/* 배경 감성 라이트 글로우 효과 */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-600/10" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-mint-300/30 blur-3xl dark:bg-mint-600/10" />

          {/* 상단 여백 (공간 균형) */}
          <div className="h-6 w-full" />

          {/* 중앙 메인 브랜딩 & 공식 로고 애니메이션 컨테이너 */}
          <div className="flex flex-col items-center text-center">
            {/* 펄스 링 & 고해상도 공식 로고 카드 */}
            <div className="relative mb-5 flex items-center justify-center">
              {/* 외부 확산 펄스 링 (코랄 & 민트) */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.35, 1.55], opacity: [0.6, 0.25, 0] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="absolute h-56 w-56 rounded-full bg-gradient-to-tr from-brand-400 to-mint-400 blur-xl"
              />

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1.35], opacity: [0.4, 0.2, 0] }}
                transition={{
                  duration: 1.8,
                  delay: 0.3,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="absolute h-52 w-52 rounded-full bg-brand-400/35 blur-lg"
              />

              {/* 고해상도 화질개선 공식 로고 카드 */}
              <motion.div
                initial={{ scale: 0.7, y: 16, opacity: 0 }}
                animate={{ scale: [0.7, 1.03, 1], y: 0, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 240,
                  damping: 18,
                  duration: 0.8,
                }}
                className="relative flex h-52 w-52 sm:h-60 sm:w-60 items-center justify-center overflow-hidden rounded-[36px] bg-[#FFFDF7] shadow-2xl ring-4 ring-brand-200/80 dark:ring-brand-800/60"
              >
                <img
                  src={logoHd}
                  alt="오늘의 뚝딱 공식 로고"
                  className="h-full w-full object-cover rounded-[36px]"
                />
              </motion.div>
            </div>

            {/* 브랜드 슬로건 뱃지 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/90 px-3.5 py-1 text-xs font-black text-brand-700 shadow-sm dark:bg-brand-950/60 dark:text-brand-300"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-500 animate-pulse" />
              <span>1인 가구 냉장고 맞춤 요리 솔루션</span>
            </motion.div>

            {/* 감성 슬로건 */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-2.5 text-sm font-bold text-foreground"
            >
              냉장고 속 재료로 오늘의 요리를 <span className="text-brand-500 font-black">뚝딱!</span> 🍳
            </motion.p>
          </div>

          {/* 하단 로딩 진행 게이지 & 상태 인디케이터 (Cold Start 대응 인터랙티브 바) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="flex w-full max-w-[280px] flex-col items-center gap-2.5 pb-4"
          >
            {/* 프로그레스 게이지 바 */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 p-0.5 shadow-inner dark:bg-slate-800">
              <motion.div
                initial={{ width: '15%' }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.2 }}
                className="h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-mint-400"
              />
            </div>

            {/* 상태 텍스트 안내 */}
            <div className="flex min-h-[36px] items-center justify-center text-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/90">
                <Utensils className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-500" />
                <span className="leading-snug transition-all duration-300">{statusText}</span>
              </div>
            </div>

            {/* 서버 기동(Cold Start) 지연 시 안심 배지 노출 */}
            {isWarmingUp && !isTimedOut && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400"
              >
                <span>서버 안전 부팅 중...</span>
              </motion.div>
            )}

            {/* 45초 이상 지연 시 나타나는 비상 탈출 버튼 */}
            {isTimedOut && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-sm hover:bg-accent active:scale-95"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>새로고침</span>
                </button>
                <button
                  type="button"
                  onClick={handleForceEnter}
                  className="rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-bold text-white shadow-soft hover:bg-brand-600 active:scale-95"
                >
                  <span>앱 둘러보기</span>
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
