import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, AlertCircle, Check, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useBodyScrollLock } from '@/hooks';
import { updateUserEmail } from '@/services/authApi';
import { getFriendlyAuthErrorMessage } from '@/utils/authError';
import type { UserProfile } from '@/types/user';

interface ChangeEmailModalProps {
  open: boolean;
  user: UserProfile;
  onClose: () => void;
  onEmailChanged: (newEmail: string) => void;
}

/**
 * 계정 이메일(아이디) 변경 모달 (USER-PAGE-01-1)
 * - 이메일 로그인 유저: 새 이메일 입력 ➔ Supabase Auth updateUser 연동으로 실제 확인 링크 발송
 * - 소셜 로그인 유저: 앱 내 직접 수정 불가 안내 노출
 */
export function ChangeEmailModal({
  open,
  user,
  onClose,
  onEmailChanged,
}: ChangeEmailModalProps) {
  useBodyScrollLock(open);

  const isSocialUser = user.loginProvider === 'google';
  const [newEmail, setNewEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNewEmail('');
      setErrorMessage('');
      setIsSent(false);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEmail.trim();

    // 이메일 정규식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed) {
      setErrorMessage('변경할 이메일 주소를 입력해 주세요.');
      return;
    }
    if (!emailRegex.test(trimmed)) {
      setErrorMessage('올바른 이메일 주소 형식을 입력해 주세요.');
      return;
    }
    if (trimmed.toLowerCase() === user.email.toLowerCase()) {
      setErrorMessage('현재 사용 중인 이메일과 동일합니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      // 실제 Supabase Auth를 통해 이메일 변경 확인 메일 발송
      await updateUserEmail(trimmed);
      setIsSent(true);
      onEmailChanged(trimmed);
      toast.success('인증 확인 메일이 발송되었습니다! 메일함을 확인해 주세요. ✉️');
    } catch (err: unknown) {
      const errorMsg = getFriendlyAuthErrorMessage(err, 'change-email');
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="change-email-modal-container"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
        >
          {/* 배경 딤 */}
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
                  <Mail className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold">계정 이메일 변경</h2>
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

            {/* A. 소셜 로그인 유저 (변경 불가 안내 분기) */}
            {isSocialUser ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-4 text-xs leading-relaxed text-brand-900 dark:border-brand-800/60 dark:bg-brand-900/20 dark:text-brand-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-300" />
                    <div>
                      <p className="font-bold text-sm">소셜 연동 계정 안내</p>
                      <p className="mt-1 text-muted-foreground">
                        소셜 로그인은 해당 플랫폼(구글)에서 이메일을 변경해 주세요.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-xs text-muted-foreground">현재 연동된 소셜 이메일</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{user.email}</p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="button" onClick={onClose} className="rounded-full bg-brand-500 text-white hover:bg-brand-600">
                    확인
                  </Button>
                </div>
              </div>
            ) : isSent ? (
              /* B-2. 인증 링크 발송 완료 화면 */
              <div className="mt-4 space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint-100 text-mint-700 dark:bg-mint-900/40 dark:text-mint-300">
                  <Check className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">인증 링크가 발송되었습니다</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground break-keep">
                    새로운 이메일(<strong>{newEmail}</strong>)로 인증 확인 링크가 전송되었습니다. 해당 메일함에서 링크를 클릭하시면 이메일 변경이 최종 완료됩니다.
                  </p>
                </div>
                <div className="pt-2">
                  <Button type="button" onClick={onClose} className="w-full rounded-full bg-brand-500 text-white hover:bg-brand-600">
                    확인 완료
                  </Button>
                </div>
              </div>
            ) : (
              /* B-1. 이메일 로그인 유저 변경 폼 */
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground">
                    현재 이메일
                  </label>
                  <p className="mt-1.5 rounded-2xl bg-muted/60 px-4 py-3 text-sm font-semibold text-muted-foreground">
                    {user.email}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="new-email-input"
                    className="block text-xs font-bold text-muted-foreground"
                  >
                    새로운 이메일 주소
                  </label>
                  <input
                    id="new-email-input"
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="example@dduktak.com"
                    disabled={isSubmitting}
                    className="mt-1.5 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-semibold transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
                  />
                  {errorMessage ? (
                    <p className="mt-1 text-xs font-semibold text-destructive">{errorMessage}</p>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                      * 입력하신 새로운 이메일 주소로 인증 확인 링크가 발송됩니다.
                    </p>
                  )}
                </div>

                <div className="mt-6 flex flex-row justify-end gap-2 border-t border-border/60 pt-4">
                  <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="rounded-full">
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-full bg-brand-500 text-white hover:bg-brand-600"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> 발송 중...
                      </>
                    ) : (
                      <>
                        <Send className="mr-1 h-3.5 w-3.5" /> 인증 링크 발송
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
