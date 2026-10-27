import { useState, type FormEvent } from 'react';
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
 * 카카오 심볼 아이콘 SVG
 */
function KakaoIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.477 2 10.768c0 2.766 1.874 5.187 4.708 6.551-.208.777-.753 2.812-.862 3.245-.136.541.198.534.417.388.172-.114 2.723-1.854 3.829-2.607.625.088 1.267.135 1.908.135 5.523 0 10-3.477 10-7.768C22 6.477 17.523 3 12 3z" />
    </svg>
  );
}

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

type AuthMode = 'social' | 'login' | 'signup' | 'forgot-password';

/**
 * 모듈 1: 통합 인증 화면 (AUTH-01 이메일 가입/로그인 & AUTH-02 소셜 간편 로그인 & 비밀번호 찾기)
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const {
    loginWithEmail,
    signupWithEmail,
    loginWithOAuth,
    sendPasswordReset,
    isLoggingIn,
    isSigningUp,
    isSendingReset,
  } = useAuth();

  // 현재 인증 폼 모드: social (기본 소셜 뷰) / login (이메일 로그인) / signup (이메일 회원가입) / forgot-password (비밀번호 재설정)
  const [mode, setMode] = useState<AuthMode>('social');

  // 폼 입력 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 약관 동의 및 모달 제어 상태
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsTab, setTermsTab] = useState<TermsTab>('terms');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeRecipeAnonymize, setAgreeRecipeAnonymize] = useState(false);

  /** 폼 모드 전환 시 이전 폼 입력값 및 체크박스 초기화 */
  const switchMode = (nextMode: AuthMode) => {
    setEmail('');
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

  /** 소셜 간편 로그인 (AUTH-02-1) */
  const handleSocialLogin = async (provider: 'kakao' | 'google') => {
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
    if (password.length < 8) {
      toast.error('비밀번호는 최소 8자 이상이어야 합니다.');
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
      toast.error(getFriendlyAuthErrorMessage(err));
    }
  };

  /** 비밀번호 찾기 링크 발송 제출 핸들러 */
  const handleSendResetLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('비밀번호를 재설정할 이메일 주소를 입력해 주세요.');
      return;
    }
    try {
      await sendPasswordReset(email.trim());
      toast.success(`${email} 주소로 비밀번호 재설정 링크를 발송했습니다!`);
      switchMode('login');
    } catch (err: any) {
      toast.error(getFriendlyAuthErrorMessage(err));
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
              onClick={() => switchMode(mode === 'forgot-password' ? 'login' : 'social')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{mode === 'forgot-password' ? '로그인으로 돌아가기' : '간편 로그인으로'}</span>
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

            {/* 카카오 간편 로그인 */}
            <button
              type="button"
              onClick={() => handleSocialLogin('kakao')}
              className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FEE500] px-4 py-3 text-sm font-bold text-[#191919] shadow-sm transition-all hover:bg-[#FEE500]/90 active:scale-[0.98]"
            >
              <KakaoIcon />
              <span>카카오로 3초 만에 시작하기</span>
            </button>

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
            {/* 로그인 / 회원가입 탭 (Segmented Control - 비밀번호 찾기 모드가 아닐 때만 노출) */}
            {mode !== 'forgot-password' && (
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

            {mode === 'forgot-password' ? (
              /* ============================================================ */
              /* 비밀번호 재설정 폼 (비밀번호 입력창 없이 오직 이메일만 입력)   */
              /* ============================================================ */
              <form onSubmit={handleSendResetLink} className="space-y-4">
                <div className="text-left mb-2">
                  <h2 className="text-base font-extrabold text-foreground flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <span>비밀번호 찾기</span>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    가입하신 이메일 주소를 입력해 주시면 비밀번호를 다시 설정할 수 있는 링크를 보내드립니다.
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
                  {isSendingReset ? '발송 중...' : '재설정 링크 발송하기'}
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

      {/* 하단 둘러보기 링크 */}
      <div className="pt-4 text-center">
        <button
          type="button"
          onClick={() => navigate(ROUTES.HOME)}
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          로그인 없이 먼저 둘러볼래요 →
        </button>
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
