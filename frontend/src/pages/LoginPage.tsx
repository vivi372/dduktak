import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { TermsModal, type TermsTab } from '@/components/common/TermsModal';
import { getFriendlyAuthErrorMessage } from '@/utils/authError';
import logo from '@/assets/logo.png';

/**
 * 구글 심볼 아이콘 SVG
 */
function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.665-5.18 3.665-9.12z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.43l4.03-3.14z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.57 1.25 6.57l4.03 3.14c.95-2.83 3.6-4.96 6.72-4.96z"
      />
    </svg>
  );
}

type AuthMode = 'social' | 'login' | 'signup' | 'forgot-password' | 'verify-reset-otp' | 'awaiting-verification';

/**
 * 모듈 1: 통합 인증 화면 (AUTH-01 이메일 가입/로그인 & AUTH-02 소셜 간편 로그인 & 비밀번호 찾기)
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    loginWithEmail,
    signupWithEmail,
    loginWithOAuth,
    sendPasswordReset,
    verifyPasswordResetOtp,
    resendSignupEmail,
    isLoggingIn,
    isSigningUp,
    isSendingReset,
    isVerifyingResetOtp,
  } = useAuth();

  // 이미 인증된 상태(이메일 인증 완료, 다른 탭 인증 등)인 경우 메인 화면으로 즉시 이동
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 현재 인증 폼 모드: social (기본 소셜 뷰) / login (이메일 로그인) / signup (이메일 회원가입) / forgot-password (비밀번호 재설정) / verify-reset-otp (인증번호 입력) / awaiting-verification (이메일 링크 확인 대기)
  const [mode, setMode] = useState<AuthMode>('social');

  // 폼 입력 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // 약관 동의 및 모달 제어 상태
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsTab, setTermsTab] = useState<TermsTab>('terms');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeRecipeAnonymize, setAgreeRecipeAnonymize] = useState(false);

  /** 폼 모드 전환 시 이전 폼 입력값 및 체크박스 초기화 */
  const switchMode = (nextMode: AuthMode) => {
    if (nextMode !== 'verify-reset-otp' && nextMode !== 'awaiting-verification') {
      setEmail('');
      setPassword('');
    }
    setResetToken('');
    setNickname('');
    setShowPassword(false);
    setAgreeTerms(false);
    setAgreeRecipeAnonymize(false);
    setMode(nextMode);
  };

  const handleOpenTerms = (tab: TermsTab) => {
    setTermsTab(tab);
    setTermsModalOpen(true);
  };

  /** 구글 소셜 간편 로그인 (AUTH-02-1) */
  const handleSocialLogin = async (provider: 'google') => {
    try {
      await loginWithOAuth(provider);
    } catch (err: any) {
      toast.error(getFriendlyAuthErrorMessage(err));
    }
  };

  /** 이메일 로그인 제출 핸들러 (AUTH-01-2) */
  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }
    try {
      await loginWithEmail({ email: email.trim(), password });
      toast.success('로그인되었습니다. 환영합니다!');
      navigate(ROUTES.HOME);
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('email not confirmed') || msg.includes('not confirmed') || msg.includes('email_not_confirmed')) {
        toast.info('이메일 인증이 아직 완료되지 않았습니다. 인증 대기 화면으로 이동합니다.');
        setMode('awaiting-verification');
        return;
      }
      toast.error(getFriendlyAuthErrorMessage(err));
    }
  };

  /** 이메일 회원가입 제출 핸들러 (AUTH-01-1) */
  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !nickname.trim()) {
      toast.error('모든 필수 정보를 입력해 주세요.');
      return;
    }

    // 비밀번호 복잡도 클라이언트 사전 검증 (영문 대/소문자, 숫자, 특수문자 조합 8자 이상)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`\-={}[\]:;"'<>,.?/]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error('비밀번호는 8자 이상이며, 영문 대/소문자, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.');
      return;
    }

    if (!agreeTerms || !agreeRecipeAnonymize) {
      toast.error('서비스 이용 및 탈퇴 시 레시피 보존 정책 약관에 모두 동의해 주세요.');
      return;
    }
    try {
      const data = await signupWithEmail({
        email: email.trim(),
        password,
        nickname: nickname.trim(),
      });
      if (data?.session) {
        toast.success('회원가입이 완료되었습니다! 환영합니다.');
        navigate(ROUTES.HOME);
      } else {
        // 이메일 인증 대기 모드로 전환 (email/password 유지하여 자동 감지 수행)
        setMode('awaiting-verification');
        setResendCooldown(60);
        toast.success('인증 메일이 발송되었습니다! 메일함(받은편지함/스팸함)을 확인해 주세요.', {
          duration: 6000,
        });
      }
    } catch (err: any) {
      toast.error(getFriendlyAuthErrorMessage(err, 'signup'));
    }
  };

  // 이메일 인증 대기 상태: 2.5초마다 백그라운드 로그인 시도 (다른 브라우저 창이나 모바일에서 링크 클릭 시 자동 감지하여 홈 이동)
  useEffect(() => {
    if (mode !== 'awaiting-verification' || !email || !password) return;

    let isCancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await loginWithEmail({ email: email.trim(), password });
        if (res?.session && !isCancelled) {
          clearInterval(interval);
          toast.success('이메일 인증이 확인되었습니다! 환영합니다.');
          navigate(ROUTES.HOME);
        }
      } catch (err: any) {
        const msg = err?.message?.toLowerCase() || '';
        if (msg.includes('email not confirmed') || msg.includes('not confirmed') || msg.includes('email_not_confirmed')) {
          return;
        }
      }
    }, 2500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [mode, email, password, loginWithEmail, navigate]);

  // 인증 메일 재발송 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  /** 회원가입 인증 메일 재발송 핸들러 */
  const handleResendSignupEmail = async () => {
    if (resendCooldown > 0 || isResending) return;
    try {
      setIsResending(true);
      await resendSignupEmail(email.trim());
      setResendCooldown(60);
      toast.success(`${email} 주소로 인증 메일을 다시 보냈습니다! 메일함을 확인해 주세요.`);
    } catch (err: any) {
      toast.error(getFriendlyAuthErrorMessage(err, 'signup'));
    } finally {
      setIsResending(false);
    }
  };

  /** 비밀번호 찾기 OTP 인증코드 발송 제출 핸들러 */
  const handleSendResetOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      toast.error('비밀번호를 재설정할 이메일 주소를 입력해 주세요.');
      return;
    }
    try {
      await sendPasswordReset(email.trim());
      toast.success(`${email} 주소로 인증번호를 발송했습니다! 메일함을 확인해 주세요.`, {
        duration: 5000,
      });
      setMode('verify-reset-otp');
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err, 'reset-password');
      if (msg.includes('등록되지 않은')) {
        toast.success(`${email} 주소로 인증번호를 발송했습니다! 메일함을 확인해 주세요.`, {
          duration: 5000,
        });
        setMode('verify-reset-otp');
      } else {
        toast.error(msg);
      }
    }
  };

  /** 비밀번호 재설정 OTP 인증코드 검증 핸들러 */
  const handleVerifyResetOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim() || resetToken.trim().length < 6) {
      toast.error('전송받으신 인증번호를 정확히 입력해 주세요.');
      return;
    }
    try {
      await verifyPasswordResetOtp({ email: email.trim(), token: resetToken.trim() });
      toast.success('인증이 완료되었습니다! 새로운 비밀번호를 설정해 주세요.');
      navigate(ROUTES.RESET_PASSWORD);
    } catch (err: any) {
      toast.error(getFriendlyAuthErrorMessage(err, 'reset-password'));
    }
  };

  return (
    <div className="flex min-h-dvh flex-col justify-between px-6 py-8">
      {/* 상단: 브랜드 로고 및 타이틀 헤더 */}
      <div className="flex flex-col items-center text-center">
        {/* 뒤로가기 버튼 */}
        {mode !== 'social' && (
          <div className="w-full flex justify-start mb-2">
            <button
              type="button"
              onClick={() => {
                if (mode === 'verify-reset-otp') switchMode('forgot-password');
                else if (mode === 'forgot-password') switchMode('login');
                else if (mode === 'awaiting-verification') switchMode('login');
                else switchMode('social');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>
                {mode === 'verify-reset-otp'
                  ? '이메일 다시 입력하기'
                  : mode === 'forgot-password'
                  ? '뒤로가기'
                  : mode === 'awaiting-verification'
                  ? '로그인 화면으로'
                  : '간편 로그인으로'}
              </span>
            </button>
          </div>
        )}

        {/* 브랜드 공식 로고 */}
        <div className="relative mb-4 mt-2">
          <img
            src={logo}
            alt="오늘의 뚝딱"
            className="h-24 w-24 rounded-3xl object-cover shadow-soft ring-4 ring-white dark:ring-card"
          />
          <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-brand-foreground shadow-md">
            <ChefHat className="h-4 w-4" />
          </span>
        </div>

        {/* 타이틀 및 슬로건 */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>1인 가구를 위한 쉽고 빠른 요리</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          오늘의 뚝딱
        </h1>
        <p className="mt-1 text-xs text-muted-foreground max-w-[280px]">
          냉장고 속 재료로 남김없이 뚝딱!
        </p>
      </div>

      {/* 중앙: 동적 폼 영역 (소셜 모드 vs 이메일 폼 모드) */}
      <div className="my-auto w-full max-w-sm mx-auto">
        {mode === 'social' ? (
          /* ============================================================ */
          /* 1. 기본 소셜 간편 로그인 뷰                                  */
          /* ============================================================ */
          <div className="space-y-3">
            {/* Google 원클릭 소셜 로그인 */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200 font-bold shadow-sm dark:bg-card dark:text-foreground dark:border-border"
            >
              <GoogleIcon />
              <span>Google 계정으로 시작하기</span>
            </Button>

            {/* 구분선 */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-border" />
              <span className="absolute bg-background px-3 text-[11px] font-semibold text-muted-foreground uppercase">
                또는
              </span>
            </div>

            {/* 이메일로 로그인 / 가입 폼 진입 버튼 */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => switchMode('login')}
              className="w-full flex items-center justify-center gap-2 py-3.5 font-bold"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>이메일로 로그인 / 회원가입</span>
            </Button>

            <p className="text-center text-[11px] text-muted-foreground pt-3">
              로그인 시{' '}
              <button
                type="button"
                onClick={() => handleOpenTerms('terms')}
                className="underline underline-offset-2 hover:text-foreground font-semibold"
              >
                서비스 이용약관
              </button>{' '}
              및{' '}
              <button
                type="button"
                onClick={() => handleOpenTerms('privacy')}
                className="underline underline-offset-2 hover:text-foreground font-semibold"
              >
                개인정보 처리방침
              </button>
              에 동의하게 됩니다.
            </p>
            <p className="text-center text-[10px] text-muted-foreground/70">
              * 회원 탈퇴 시 작성하신 레시피는 커뮤니티 생태계 보존을 위해 익명으로 전환되어 보존됩니다.
            </p>
          </div>
        ) : (
          /* ============================================================ */
          /* 2. 일반 이메일 인증 뷰 (로그인 ↔ 회원가입 탭)                */
          /* ============================================================ */
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-card dark:border-white/10">
            {/* 로그인 / 회원가입 탭 (Segmented Control - 비밀번호 찾기, OTP 및 인증 대기 모드가 아닐 때만 노출) */}
            {mode !== 'forgot-password' && mode !== 'verify-reset-otp' && mode !== 'awaiting-verification' && (
              <div className="grid grid-cols-2 rounded-xl bg-muted p-1 mb-5">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`rounded-lg py-2 text-xs font-extrabold transition-all ${
                    mode === 'login'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`rounded-lg py-2 text-xs font-extrabold transition-all ${
                    mode === 'signup'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  회원가입
                </button>
              </div>
            )}

            {mode === 'awaiting-verification' ? (
              /* ============================================================ */
              /* 2-0. 이메일 인증 대기 및 크로스 인스턴스 자동 감지 폼         */
              /* ============================================================ */
              <div className="space-y-4 text-left">
                <div className="mb-2">
                  <h2 className="text-base font-extrabold text-foreground flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <span>인증 메일 확인 대기 중</span>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed break-keep">
                    <strong className="text-foreground">{email}</strong> 주소로 인증 메일을 보냈습니다.
                  </p>
                </div>

                {/* 다른 브라우저/스마트폰 인증 실시간 감지 안내 배너 */}
                <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4 text-xs space-y-2 dark:border-brand-900/60 dark:bg-brand-950/40">
                  <div className="flex items-center gap-2 font-bold text-brand-700 dark:text-brand-300">
                    <RefreshCw className="h-4 w-4 animate-spin text-brand-500" />
                    <span>이메일 인증 링크 확인 실시간 대기 중</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed break-keep">
                    받은편지함(또는 스팸함)에서 <strong>인증 링크</strong>를 클릭해 주세요.
                    <br />
                    링크를 확인하시면 <strong>이 화면이 자동으로 로그인되어 홈으로 이동</strong>합니다.
                  </p>
                </div>

                {/* 하단 보조 액션 */}
                <div className="flex items-center justify-between pt-2 text-xs border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-semibold text-muted-foreground hover:text-foreground"
                  >
                    로그인 화면으로
                  </button>
                  <button
                    type="button"
                    onClick={handleResendSignupEmail}
                    disabled={resendCooldown > 0 || isResending}
                    className="font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
                  >
                    {isResending
                      ? '발송 중...'
                      : resendCooldown > 0
                      ? `인증 메일 재발송 (${resendCooldown}초)`
                      : '인증 메일 다시 보내기'}
                  </button>
                </div>
              </div>
            ) : mode === 'verify-reset-otp' ? (
              /* ============================================================ */
              /* 비밀번호 재설정 OTP 인증코드 입력 폼                           */
              /* ============================================================ */
              <form onSubmit={handleVerifyResetOtp} className="space-y-4">
                <div className="text-left mb-2">
                  <h2 className="text-base font-extrabold text-foreground flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <span>인증번호 입력</span>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed break-keep">
                    <strong className="text-foreground">{email}</strong> 주소로 전송된 인증번호를 입력해 주세요.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">인증번호 (6~8자리)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="인증번호 입력"
                    className="w-full text-center tracking-[0.25em] font-mono text-xl font-bold rounded-xl border border-input bg-background py-3 px-4 text-foreground outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    required
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-soft"
                  disabled={isVerifyingResetOtp || resetToken.length < 6}
                >
                  {isVerifyingResetOtp ? '인증 확인 중...' : '인증 확인 및 새 비밀번호 설정'}
                </Button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot-password')}
                    className="font-semibold text-muted-foreground hover:text-foreground"
                  >
                    이메일 재입력
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendResetOtp()}
                    className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    disabled={isSendingReset}
                  >
                    {isSendingReset ? '재발송 중...' : '인증번호 재전송'}
                  </button>
                </div>
              </form>
            ) : mode === 'forgot-password' ? (
              /* ============================================================ */
              /* 비밀번호 재설정 이메일 입력 폼                                 */
              /* ============================================================ */
              <form onSubmit={handleSendResetOtp} className="space-y-4">
                <div className="text-left mb-2">
                  <h2 className="text-base font-extrabold text-foreground flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <span>비밀번호 찾기</span>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed break-keep">
                    가입하신 이메일 주소를 입력하시면 비밀번호를 재설정할 수 있는 인증번호를 발송해 드립니다.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">이메일 주소</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-soft"
                  disabled={isSendingReset}
                >
                  {isSendingReset ? '인증번호 발송 중...' : '인증번호 받기'}
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    ← 로그인으로 돌아가기
                  </button>
                </div>
              </form>
            ) : mode === 'login' ? (
              /* ============================================================ */
              /* 이메일 로그인 폼                                            */
              /* ============================================================ */
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">이메일</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-foreground">비밀번호</label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot-password')}
                      className="text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      비밀번호를 잊으셨나요?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm text-foreground outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      required
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

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-soft mt-2"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? '로그인 중...' : '로그인하기'}
                </Button>
              </form>
            ) : (
              /* ============================================================ */
              /* 이메일 회원가입 폼                                          */
              /* ============================================================ */
              <form onSubmit={handleEmailSignup} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">이메일</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    닉네임 <span className="text-[11px] font-normal text-muted-foreground">(2~10자, 중복 가능)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="뚝딱셰프"
                      maxLength={20}
                      className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    비밀번호{' '}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      (영문 대/소문자, 숫자, 특수문자 8자 이상)
                    </span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8자 이상 영문/숫자/특수문자"
                      className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm text-foreground outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      required
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

                {/* 필수 약관 동의 체크박스 영역 */}
                <div className="space-y-2.5 pt-2 border-t border-border/80">
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="h-4 w-4 rounded accent-brand-500"
                        required
                      />
                      <span className="font-semibold text-foreground">
                        [필수] 서비스 이용약관 및 개인정보 동의
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenTerms('terms')}
                      className="text-[11px] font-bold text-brand-600 hover:underline shrink-0 pl-1"
                    >
                      전문보기
                    </button>
                  </div>

                  <div className="flex items-start justify-between text-xs">
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreeRecipeAnonymize}
                        onChange={(e) => setAgreeRecipeAnonymize(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded accent-brand-500"
                        required
                      />
                      <span className="font-semibold text-foreground leading-snug">
                        [필수] 회원 탈퇴 시 레시피 익명 전환 보존 동의
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenTerms('terms')}
                      className="text-[11px] font-bold text-brand-600 hover:underline shrink-0 pl-1"
                    >
                      안내보기
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-soft mt-3"
                  disabled={isSigningUp}
                >
                  {isSigningUp ? '가입 처리 중...' : '회원가입 완료'}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 하단: 푸터 카피라이트 */}
      <div className="text-center text-[11px] text-muted-foreground/70">
        © 2026 오늘의 뚝딱. All rights reserved.
      </div>

      {/* 약관 전문 팝업 모달 */}
      <TermsModal
        open={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        initialTab={termsTab}
      />
    </div>
  );
}
