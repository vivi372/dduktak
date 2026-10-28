import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { Button } from '@/components/ui/button';

interface RecipeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  recipeTitle?: string;
}

/**
 * 레시피 삭제 전용 2차 확인 모달 (브라우저 confirm 대체)
 * - 파괴적 액션(Destructive) 명확한 시각적 경고 제공
 * - WAI-ARIA 접근성 및 모바일 바디 스크롤 락 지원
 */
export function RecipeDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  recipeTitle,
}: RecipeDeleteModalProps) {
  useBodyScrollLock(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="recipe-delete-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="recipe-delete-title"
        >
          {/* 배경 딤 (backdrop-blur-sm 제거) */}
          <div
            className="fixed inset-0 bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-2xl dark:border-white/10"
          >
          <div className="flex flex-col items-center text-center">
            {/* 위험 경고 아이콘 */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Trash2 className="h-7 w-7" />
            </div>

            <h3
              id="recipe-delete-title"
              className="mt-4 text-lg font-black tracking-tight text-foreground"
            >
              레시피를 삭제하시겠어요?
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {recipeTitle ? (
                <>
                  <span className="font-bold text-foreground">'{recipeTitle}'</span>
                  {'\n'}레시피를 정말 삭제하시겠습니까?
                </>
              ) : (
                '이 레시피를 정말 삭제하시겠습니까?'
              )}
              {'\n'}삭제된 레시피는 다시 복구할 수 없어요.
            </p>

            {/* 주의 안내 배너 */}
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>작성자 본인만 삭제할 수 있습니다.</span>
            </div>

            {/* 액션 버튼 그룹 */}
            <div className="mt-6 flex w-full gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={onClose}
                className="flex-1 rounded-2xl py-3 font-bold border-border/80 hover:bg-accent"
              >
                취소
              </Button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  if (!isDeleting) {
                    onConfirm();
                  }
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-rose-600 py-3 text-sm font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>삭제 중...</span>
                  </>
                ) : (
                  <span>삭제하기</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
}
