import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, X, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBodyScrollLock } from '@/hooks';

interface ScanFailSafeModalProps {
  open: boolean;
  onClose: () => void;
  /** 수동 등록(Combobox) 화면으로 전환 */
  onManualSwitch: () => void;
  /** 스캔 시도한 바코드 번호 (선택) */
  barcodeNo?: string;
}

/**
 * 바코드 스캔 미등록(404 INV_WARN_BARCODE_NOT_FOUND) 시 Fail-Safe 예외 복구 팝업
 * - 미등록 바코드 감지 시 친절한 안내 및 표준 식재료 직접 등록 폼으로 부드러운 전환 지원
 */
export function ScanFailSafeModal({
  open,
  onClose,
  onManualSwitch,
  barcodeNo,
}: ScanFailSafeModalProps) {
  useBodyScrollLock(open);

  if (!open) return null;

  const handleSwitchToManual = () => {
    onClose();
    onManualSwitch();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fail-safe-title"
      >
        {/* 배경 백드롭 */}
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* 모달 창 */}
        <motion.div
          className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
        >
          {/* 우측 상단 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>

          {/* 중앙 경고 일러스트 & 문구 */}
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 shadow-soft">
              <AlertCircle className="h-8 w-8" />
            </span>

            <h2 id="fail-safe-title" className="mt-4 text-lg font-black text-foreground">
              등록되지 않은 바코드 상품이에요
            </h2>

            {barcodeNo && (
              <p className="mt-1 font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                바코드: {barcodeNo}
              </p>
            )}

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground break-keep">
              아직 데이터베이스에 등록되지 않은 상품입니다.
              <br />
              <strong className="text-foreground font-bold">표준 식재료 마스터</strong>를 선택하여
              간편하게 직접 등록해 보세요! ✍️
            </p>
          </div>

          {/* 하단 액션 버튼 */}
          <div className="mt-6 flex flex-col gap-2">
            <Button
              type="button"
              size="lg"
              onClick={handleSwitchToManual}
              className="w-full gap-2 text-sm font-bold shadow-soft"
            >
              <Edit3 className="h-4 w-4" />
              <span>직접 검색해서 등록하기</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-center text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            >
              다시 스캔하기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
