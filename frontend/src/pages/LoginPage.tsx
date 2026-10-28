import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
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

type AuthMode = 'social' | 'login' | 'signup' | 'forgot-password' | 'verify-reset-otp';

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

  // 현재 인증 폼 모드: social (기본 소셜 뷰) / login (이메일 로그인) / signup (이메일 회원가입) / forgot-password (비밀번호 재설정) / verify-reset-otp (인증번호 입력)
  const [mode, setMode] = useState<AuthMode>('social');

  // 폼 입력 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 약관 동의 및 모달 제어 상태
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsTab, setTermsTab] = useState<TermsTab>('terms');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeRecipeAnonymize, setAgreeRecipeAnonymize] = useState(false);

  /** 폼 모드 전환 시 이전 폼 입력값 및 체크박스 초기화 */
  const switchMode = (nextMode: AuthMode) => {
    if (nextMode !== 'verify-reset-otp') {
      setEmail('');
    }
    setResetToken('');
    setPassword('');
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
        toast.success('인증 메일이 발송되었습니다! 메일함(받은편지함/스팸함)을 확인해 주세요.', {
          duration: 6000,
        });
        switchMode('login');
      }
    } catch (err: any) {
      toast.error(getFriendlyAuthErrorMessage(err, 'signup'));
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
      // 보안상 등록되지 않은 계정이라도 외부에서 유저 가입 여부를 열거/추측할 수 없도록 성공과 동일 처리
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
                else switchMode('social');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>
                {mode === 'verify-reset-otp'
                  ? '이메일 다시 입력하기'
                  : mode === 'forgot-password'
                  ? '로그인으로 돌아가기'
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

      {/* 중앙/하단 인터랙션 영역: mode에 따른 조건부 렌더링 */}
      <div className="my-auto w-full max-w-[360px] mx-auto pt-6">
        {mode === 'social' ? (
          /* ============================================================ */
          /* 1. 기본 뷰: 소셜 간편 로그인 & 이메일 시작 버튼               */
          /* ============================================================ */
          <div className="space-y-3.5">
            {/* 핵심 가치 카드 뱃지 */}
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              <div className="rounded-2xl border border-border/80 bg-card p-3 text-left shadow-card">
                <p className="text-lg">🧊</p>
                <p className="mt-1 text-xs font-bold">소비기한 알림</p>
                <p className="text-[11px] text-muted-foreground">버리는 재료 없이 알뜰하게</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card p-3 text-left shadow-card">
                <p className="text-lg">🍳</p>
                <p className="mt-1 text-xs font-bold">스마트 레시피</p>
                <p className="text-[11px] text-muted-foreground">가진 재료로 1초 맞춤 추천</p>
              </div>
            </div>


            {/* 구글 간편 로그인 */}
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-accent active:scale-[0.98] dark:border-white/10"
            >
              <GoogleIcon />
              <span>Google 계정으로 시작하기</span>
            </button>

            {/* 구분선 */}
            <div className="relative py-2 text-center text-xs text-muted-foreground">
              <span className="relative z-10 bg-background px-3 font-medium">또는</span>
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-border/80 dark:border-white/10" />
              </div>
            </div>

            {/* 이메일로 로그인 / 가입 전환 버튼 */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => switchMode('login')}
              className="w-full font-bold border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-950/40"
            >
              <Mail className="h-4 w-4" />
              <span>이메일로 로그인 / 회원가입</span>
            </Button>

            {/* 소셜 로그인 시 약관 고지 및 필수 정책 안내 */}
            <div className="pt-2 text-center text-[11px] text-muted-foreground leading-relaxed">
              <p>
                시작 시 오늘의 뚝딱의{' '}
                <button
                  type="button"
                  onClick={() => handleOpenTerms('terms')}
                  className="font-bold text-foreground underline underline-offset-2 hover:text-brand-600"
                >
                  서비스 이용약관
                </button>
                과{' '}
                <button
                  type="button"
                  onClick={() => handleOpenTerms('privacy')}
                  className="font-bold text-foreground underline underline-offset-2 hover:text-brand-600"
                >
                  개인정보 처리방침
                </button>
                에 동의하게 됩니다.
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/80">
                💬 회원 탈퇴 시 작성하신 레시피는 커뮤니티 생태계 보존을 위해 익명으로 전환되어 보존됩니다.
              </p>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* 2. 일반 이메일 인증 뷰 (로그인 ↔ 회원가입 탭)                */
          /* ============================================================ */
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-card dark:border-white/10">
            {/* 로그인 / 회원가입 탭 (Segmented Control - 비밀번호 찾기 및 인증 모드가 아닐 때만 노출) */}
            {mode !== 'forgot-password' && mode !== 'verify-reset-otp' && (
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

            {mode === 'verify-reset-otp' ? (
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
              /* 비밀번호 재설정 이메일 입력 폼                                */
              /* ============================================================ */
              <form onSubmit={handleSendResetOtp} className="space-y-4">
                <div className="text-left mb-2">
                  <h2 className="text-base font-extrabold text-foreground flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <span>비밀번호 찾기</span>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed break-keep">
                    가입하신 이메일 주소를 입력해 주시면 비밀번호를 다시 설정할 수 있는 인증번호를 보내드립니다.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">가입한 이메일</label>
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

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-soft"
                  disabled={isSendingReset}
                >
                  {isSendingReset ? '발송 중...' : '인증번호 받기'}
                </Button>

                <div className="pt-1 text-center">
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
              /* 이메일 로그인 폼 */
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
                  <label className="block text-xs font-bold text-foreground mb-1.5">비밀번호</label>
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

                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot-password')}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-brand-600 hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-soft"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? '로그인 중...' : '로그인하기'}
                </Button>
              </form>
            ) : (
              /* 이메일 회원가입 폼 (AUTH-01-1) */
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
                      maxLength={10}
                      className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    비밀번호 <span className="text-[11px] font-normal text-muted-foreground">(8자 이상)</span>
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

      {/* 이용약관 및 개인정보 처리방침 조회 모달 */}
      <TermsModal
        open={termsModalOpen}
        initialTab={termsTab}
        onClose={() => setTermsModalOpen(false)}
      />
    </div>
  );
}
