import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

interface ReceiptScanningProgressProps {
  /** 미리보기 영수증 이미지 URL (옵션) */
  previewUrl?: string | null;
}

/**
 * 2. 영수증 OCR 스캔 분석 로딩 UX
 * - Gemini Flash AI Vision 분석 대기 중 실시간 상태 캡션 및 점진적 프로그레스
 * - 4행 식재료 품목 Skeleton UI (Shimmer 애니메이션)
 */
export function ReceiptScanningProgress({
  previewUrl: _previewUrl,
}: ReceiptScanningProgressProps) {
  const [progress, setProgress] = useState(25);
  const [statusMessage, setStatusMessage] = useState('영수증 이미지를 분석하는 중...');

  useEffect(() => {
    if (import.meta.env.MODE === 'test') {
      return;
    }

    const timer1 = setTimeout(() => {
      setProgress(45);
      setStatusMessage('Gemini AI가 영수증 텍스트를 읽고 있어요 📝');
    }, 1500);

    const timer2 = setTimeout(() => {
      setProgress(70);
      setStatusMessage('식재료 항목을 추출하고 표준 마스터 이름과 매핑 중 🔍');
    }, 4000);

    const timer3 = setTimeout(() => {
      setProgress(88);
      setStatusMessage('권장 소비기한 D-Day를 계산하고 있어요 ✨');
    }, 10000);

    const timer4 = setTimeout(() => {
      setProgress(95);
      setStatusMessage('거의 다 되었어요! 잠시만 기다려주세요 ⏳');
    }, 25000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

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


    </div>
  );
}
