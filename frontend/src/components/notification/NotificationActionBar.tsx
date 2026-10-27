import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCheck, Trash2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBodyScrollLock } from '@/hooks';

interface NotificationActionBarProps {
  totalCount: number;
  unreadCount: number;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
}

/**
 * 알림 센터 상단 액션 바 컴포넌트
 * (읽지 않은 개수 요약, 모두 읽음, 모두 삭제 확인 다이얼로그)
 */
export function NotificationActionBar({
  totalCount,
  unreadCount,
  onMarkAllRead,
  onDeleteAll,
}: NotificationActionBarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  useBodyScrollLock(showDeleteConfirm);

  const handleConfirmDeleteAll = () => {
    onDeleteAll();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-muted-foreground">
            전체 <span className="font-extrabold text-foreground">{totalCount}개</span>
          </p>
          {unreadCount > 0 && (
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              미읽음 {unreadCount}개
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className="h-9 gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <CheckCheck className="h-4 w-4 text-mint-600 dark:text-mint-400" />
            모두 읽음
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={totalCount === 0}
            className="h-9 gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            모두 삭제
          </Button>
        </div>
      </div>

      {/* 전체 삭제 2차 확인 모달 (framer-motion 애니메이션 & useBodyScrollLock) */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            key="delete-all-confirm-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-modal="true"
          >
            {/* 배경 딤 (backdrop-blur-sm 제거하여 브라우저/웹뷰 플리커 원천 차단) */}
            <div
              className="fixed inset-0 bg-black/60"
              onClick={() => setShowDeleteConfirm(false)}
              aria-hidden="true"
            />
            <motion.div
              className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-center text-lg font-bold">모든 알림을 삭제할까요?</h2>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                삭제된 알림은 다시 복구할 수 없습니다. 계속 진행하시겠습니까?
              </p>

              <div className="mt-6 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-full"
                >
                  <X className="mr-1 h-3.5 w-3.5" /> 취소
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDeleteAll}
                  className="flex-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  전체 삭제
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
