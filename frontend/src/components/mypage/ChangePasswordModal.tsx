import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Eye, EyeOff, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useBodyScrollLock } from '@/hooks';
import * as authApi from '@/services/authApi';
import { getFriendlyAuthErrorMessage } from '@/utils/authError';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 비밀번호 변경 모달 (USER-PAGE-01-2)
 * - 이메일 로그인 유저 전용 비밀번호 재설정
 * - 8자 이상, 영문/숫자/특수문자 조합 유효성 검증
 * - 비밀번호 확인 일치 여부 실시간 검증
 * - supabase.auth.updateUser({ password }) 연동
 */
export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  useBodyScrollLock(open);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setErrorMessage('');
      setIsLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      setErrorMessage('새 비밀번호를 입력해 주세요.');
      return;
    }

    // 8자 이상 영문/숫자/특수문자 포함 정규식 검증
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+~`\-={}[\]:;"'<>,.?/]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setErrorMessage('비밀번호는 8자 이상 영문, 숫자, 특수문자를 모두 포함해야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await authApi.updatePassword(newPassword);
      toast.success('비밀번호가 성공적으로 변경되었습니다.');
      onClose();
    } catch (err: unknown) {
      const msg = getFriendlyAuthErrorMessage(err);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="change-password-modal-container"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
        >
          {/* 배경 딤 (플리커 없는 안정적인 배경) */}
          <div
            className="fixed inset-0 bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* 모달 창 */}
          <motion.div
            className="relative w-full max-w-[420px] rounded-3xl border border-border bg-card p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <Lock className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold">비밀번호 변경</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* 새 비밀번호 입력 */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground">새 비밀번호</label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="8자 이상 영문, 숫자, 특수문자 조합"
                    className="min-h-12 w-full rounded-2xl border border-border bg-background px-4 pr-11 text-sm font-medium focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 새 비밀번호 확인 입력 */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground">새 비밀번호 확인</label>
                <div className="relative mt-1.5">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="새 비밀번호를 한 번 더 입력해 주세요"
                    className="min-h-12 w-full rounded-2xl border border-border bg-background px-4 pr-11 text-sm font-medium focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 에러 메시지 */}
              {errorMessage && (
                <p className="text-xs font-bold text-destructive animate-fade-in">{errorMessage}</p>
              )}

              {/* 하단 액션 버튼 */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 rounded-2xl py-3 text-sm font-bold"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-2xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 shadow-soft"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      변경 완료
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
