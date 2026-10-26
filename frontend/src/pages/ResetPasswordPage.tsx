import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/routes';
import { updatePassword } from '@/services/authApi';
import { getFriendlyAuthErrorMessage } from '@/utils/authError';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

/**
 * 비밀번호 재설정 페이지 (/reset-password)
 * - Supabase 비밀번호 재설정 이메일 링크를 통해 진입한 사용자의 새 비밀번호 등록 처리
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast.error('새 비밀번호를 입력해 주세요.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(newPassword);
      setIsComplete(true);
      toast.success('비밀번호가 성공적으로 변경되었습니다!');
    } catch (err: any) {
      toast.error(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col justify-between px-6 py-8">
      {/* 상단: 브랜드 로고 및 타이틀 헤더 */}
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-2">
          <img src={logo} alt="오늘의 뚝딱 로고" className="h-10 w-auto object-contain" />
          <span className="font-yanolja text-3xl font-bold tracking-wider text-brand-600 dark:text-brand-300">
            오늘의 뚝딱
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          새로운 비밀번호를 설정하고 안전하게 로그인하세요.
        </p>
      </div>

      {/* 중앙: 폼 영역 */}
      <div className="my-auto w-full max-w-sm mx-auto">
        {isComplete ? (
          <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-card space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-100 text-mint-600 dark:bg-mint-950/60 dark:text-mint-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">비밀번호 변경 완료</h2>
              <p className="mt-1 text-xs text-muted-foreground break-keep">
                새로운 비밀번호로 성공적으로 변경되었습니다. 변경된 비밀번호로 다시 로그인해 주세요.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-bold text-white shadow-soft hover:bg-brand-600 active:scale-[0.98]"
            >
              로그인 화면으로 이동
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-1 text-lg font-bold text-foreground">새 비밀번호 설정</h2>
            <p className="mb-5 text-xs text-muted-foreground">
              최소 8자 이상의 안전한 새 비밀번호를 입력해 주세요.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 새 비밀번호 입력 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">새 비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="최소 8자 이상"
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 비밀번호 확인 입력 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">비밀번호 확인</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="새 비밀번호 다시 입력"
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-bold text-white shadow-soft hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {isSubmitting ? '비밀번호 변경 중...' : '비밀번호 변경 완료'}
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* 하단 푸터 */}
      <div className="text-center text-[11px] text-muted-foreground">
        © 2026 오늘의 뚝딱. All rights reserved.
      </div>
    </div>
  );
}
