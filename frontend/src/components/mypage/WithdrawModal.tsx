import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useBodyScrollLock } from '@/hooks';
import { ROUTES } from '@/constants/routes';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  onWithdraw: () => Promise<void> | void;
  isWithdrawing?: boolean;
}

/**
 * 회원 탈퇴 확인 모달 (USER-02 회원 탈퇴 및 데이터 처리 정책)
 * - 레시피 익명 전환 보존 필수 동의
 * - 개인 데이터 즉시 영구 삭제 고지
 */
export function WithdrawModal({
  open,
  onClose,
  onWithdraw,
  isWithdrawing = false,
}: WithdrawModalProps) {
  useBodyScrollLock(open);
  const [agree, setAgree] = useState(false);
  const navigate = useNavigate();

  const handleConfirmWithdraw = async () => {
    if (!agree || isWithdrawing) return;
    try {
      await onWithdraw();
      toast.success('회원 탈퇴가 완료되었습니다. 작성하신 레시피는 익명으로 안전하게 보존됩니다.');
      onClose();
      navigate(ROUTES.LOGIN);
    } catch {
      // 에러는 전역 처리
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* 배경 딤 */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 모달 창 */}
          <motion.div
            className="relative w-full max-w-[420px] rounded-3xl border border-border bg-card p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-lg font-bold">회원 탈퇴</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-auto my-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="text-center text-base font-bold text-foreground">
              정말 회원 탈퇴를 진행하시겠습니까?
            </h3>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs leading-relaxed text-destructive dark:border-destructive/30">
                <p className="font-bold">⚠️ 탈퇴 시 데이터 처리 안내</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>
                    <strong>개인 데이터 영구 삭제</strong>: 내 냉장고의 식재료, 알림함 목록, 스크랩북 및 좋아요 내역은 즉시 영구 삭제됩니다.
                  </li>
                  <li>
                    <strong>레시피 익명 보존</strong>: 회원님이 작성하신 레시피는 커뮤니티 생태계 보존을 위해 삭제되지 않고 <em>작성자가 '익명'으로 안전하게 전환되어 보존</em>됩니다.
                  </li>
                </ul>
              </div>

              {/* 필수 약관 동의 체크박스 */}
              <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-border p-3.5 transition hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-destructive"
                />
                <span className="text-xs font-semibold leading-snug">
                  안내 사항을 모두 확인하였으며, 레시피의 익명 전환 보존 정책에 동의합니다. (필수)
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-row justify-end gap-2 border-t border-border/60 pt-4">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isWithdrawing} className="rounded-full">
                취소
              </Button>
              <Button
                type="button"
                onClick={handleConfirmWithdraw}
                disabled={!agree || isWithdrawing}
                className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {isWithdrawing ? '탈퇴 처리 중...' : '탈퇴하기'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
