import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, AlertCircle } from 'lucide-react';

interface ReceiptScanningProgressProps {
  /** 분석 완료 시 호출 (isSuccess 여부 전달) */
  onComplete: (isSuccess: boolean) => void;
  /** 미리보기 영수증 이미지 URL (옵션) */
  previewUrl?: string | null;
}

/**
 * 2. 영수증 OCR 스캔 분석 로딩 UX
 * - 0% ~ 100% 점진적 프로그레스 바
 * - 텍스트 인식 ➔ 표준 식재료 매핑 ➔ 소비기한 연산 실시간 상태 캡션
 * - 4행 식재료 품목 Skeleton UI (Shimmer 애니메이션)
 * - Fail-Safe 테스트를 위한 미인식 시뮬레이션 버튼 지원
 */
export function ReceiptScanningProgress({
  onComplete,
}: ReceiptScanningProgressProps) {
  const [progress, setProgress] = useState(15);
  const [statusMessage, setStatusMessage] = useState('영수증 이미지를 분석하는 중...');

  useEffect(() => {
    // 0% -> 100% 프로그레스 인터벌
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStatusMessage('OCR 텍스트에서 식재료 항목을 추출하고 있어요 📝');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(80);
      setStatusMessage('식재료 목록 및 카테고리 분류 중 🔍');
    }, 900);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusMessage('권장 소비기한 D-Day 계산 완료! ✨');
    }, 1400);

    const finishTimer = setTimeout(() => {
      onComplete(true);
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  // 실패 케이스 강제 시뮬레이션
  const handleTriggerFail = () => {
    onComplete(false);
  };

  return (
    <div className="space-y-6 py-2">
      {/* 1. 상단 AI 분석 상태 애니메이션 헤더 */}
      <div className="text-center space-y-2">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
          <Bot className="h-8 w-8 animate-bounce" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-brand-500" />
          </span>
        </div>

        <h3 className="text-base font-extrabold text-foreground">
          영수증을 똑똑하게 분석하고 있어요
        </h3>
        <p className="text-xs text-muted-foreground font-medium transition-all duration-200">
          {statusMessage}
        </p>
      </div>

      {/* 2. 진행률 프로그레스 바 (0% ~ 100%) */}
      <div className="space-y-1.5 px-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
          <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400">
            <Sparkles className="h-3 w-3" />
            Gemini Flash OCR
          </span>
          <span className="tabular-nums font-mono">{progress}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600"
            initial={{ width: '10%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* 3. 식재료 품목 Skeleton UI (4행) */}
      <div className="space-y-2.5 rounded-2xl border bg-muted/20 p-3.5">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
          <div className="h-3.5 w-16 rounded bg-muted animate-pulse" />
        </div>

        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card p-3 shadow-xs"
          >
            {/* 체크박스 & 품목명 스켈레톤 */}
            <div className="flex items-center gap-2.5 flex-1">
              <div className="h-4 w-4 rounded bg-muted animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div
                  className="h-4 rounded bg-muted animate-pulse"
                  style={{ width: `${40 + idx * 12}%` }}
                />
                <div className="h-3 w-20 rounded bg-muted/60 animate-pulse" />
              </div>
            </div>

            {/* 수량 버튼 영역 스켈레톤 (44px) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
              <div className="h-4 w-8 rounded bg-muted animate-pulse" />
              <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* 4. 개발 검수/테스트용 실패 시뮬레이션 버튼 */}
      <div className="pt-1 text-center">
        <button
          type="button"
          onClick={handleTriggerFail}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-destructive hover:underline"
          title="인식 실패(0건) 예외 처리 흐름을 확인합니다"
        >
          <AlertCircle className="h-3 w-3" />
          <span>(테스트용) 미인식 실패 예외 화면으로 건너뛰기</span>
        </button>
      </div>
    </div>
  );
}
