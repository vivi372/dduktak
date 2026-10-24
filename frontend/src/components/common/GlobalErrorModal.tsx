/**
 * 전역 에러 모달 컴포넌트 (02_ARCHITECTURE_AND_CONVENTIONS.md 5.4절)
 * 백엔드 에러 코드 내 UX 태그(_ALERT_, _CONFIRM_, _FATAL_) 발생 시
 * 중앙 대화상자를 띄우며, X-Trace-Id를 식별 코드로 노출합니다.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import { useErrorModalStore } from '@/store/useErrorModalStore';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { Button } from '@/components/ui/button';

export function GlobalErrorModal() {
  const {
    isOpen,
    type,
    title,
    message,
    traceId,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    onRetry,
    closeModal,
  } = useErrorModalStore();

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  // 모달 타입별 아이콘 및 테마 색상 분기
  const renderIcon = () => {
    switch (type) {
      case 'CONFIRM':
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
            <HelpCircle className="h-6 w-6" />
          </div>
        );
      case 'FATAL':
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
        );
      case 'ALERT':
      default:
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <AlertCircle className="h-6 w-6" />
          </div>
        );
    }
  };

  const handleConfirm = () => {
    if (type === 'FATAL') {
      onRetry?.();
    } else {
      onConfirm?.();
    }
    closeModal();
  };

  const handleCancel = () => {
    onCancel?.();
    closeModal();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="error-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-2xl"
        >
          <div className="flex flex-col items-center text-center">
            {renderIcon()}

            <h3
              id="error-modal-title"
              className="mt-4 font-heading text-xl font-bold tracking-tight text-foreground"
            >
              {title}
            </h3>

            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {message}
            </p>

            {/* 백엔드 트레이스 식별 헤더 (X-Trace-Id) 연동 */}
            {traceId && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
                <span>식별 코드:</span>
                <span className="font-semibold text-foreground">{traceId}</span>
              </div>
            )}

            {/* 액션 버튼 그룹 */}
            <div className="mt-6 flex w-full gap-2.5">
              {type === 'CONFIRM' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 rounded-2xl py-3 font-semibold"
                >
                  {cancelText}
                </Button>
              )}

              {type === 'FATAL' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1 rounded-2xl py-3 font-semibold"
                >
                  {cancelText}
                </Button>
              )}

              <Button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-2xl py-3 font-semibold shadow-md active:scale-95 transition-transform"
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
