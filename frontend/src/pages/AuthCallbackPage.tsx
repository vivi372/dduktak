import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

/**
 * 이메일 및 구글 소셜 로그인 인증 완료 전용 브릿지 페이지 (/auth/callback)
 * - 구글 OAuth 및 이메일 확인 링크 클릭 시 브라우저로 진입
 * - PKCE code 교환 또는 세션 검증 후 토큰(access_token, refresh_token) 확보
 * - 모바일 환경(Android) 감지 시 Android Intent URL 및 커스텀 스킴을 통해 '오늘의 뚝딱' 앱으로 100% 자동 복귀
 * - 중복 탭 방지를 위해 [앱으로 돌아가기], [창 닫기], [웹에서 계속하기] 액션 제공
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [canClose, setCanClose] = useState<boolean>(true);
  const [appReturnUrl, setAppReturnUrl] = useState<string>('com.dduktak.app://auth/callback');

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        // 1. URL 쿼리 파라미터 에러 체크
        const error = searchParams.get('error');
        const errorDesc = searchParams.get('error_description');
        if (error || errorDesc) {
          throw new Error(errorDesc || '인증 링크가 만료되었거나 올바르지 않습니다.');
        }

        // 2. PKCE 코드 교환 (code 파라미터가 있는 경우)
        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        // 3. 현재 유효한 세션 확인 및 토큰 추출
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
          // 비동기 hash 토큰 처리 대기 (1회성 authStateChange)
          const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (newSession && isMounted) {
              completeAuthentication(newSession);
              authListener.subscription.unsubscribe();
            }
          });

          // 2초 타임아웃
          setTimeout(() => {
            if (isMounted && status === 'verifying') {
              notifyOtherTabs();
              setStatus('success');
              authListener.subscription.unsubscribe();
            }
          }, 2000);
          return;
        }

        // 4. 인증 완료 처리 및 앱 복귀 트리거
        if (isMounted) {
          completeAuthentication(session);
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err?.message || '인증 처리 중 오류가 발생했습니다.');
        }
      }
    }

    /** 세션 토큰을 바탕으로 다른 탭 브로드캐스트 및 모바일 앱 복귀 인텐트 실행 */
    function completeAuthentication(activeSession: any) {
      notifyOtherTabs();
      setStatus('success');

      const accessToken = activeSession?.access_token || '';
      const refreshToken = activeSession?.refresh_token || '';
      const tokenHash = `access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;

      // 안드로이드 Chrome 표준 Intent URL 규격
      const intentUrl = `intent://auth/callback#${tokenHash}#Intent;scheme=com.dduktak.app;package=com.dduktak.app;end;`;
      const fallbackSchemeUrl = `com.dduktak.app://auth/callback#${tokenHash}`;

      setAppReturnUrl(intentUrl);

      // 모바일 기기(Android / iOS) 감지 시 앱으로 자동 복귀 시도
      if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        // 1차: 안드로이드 크롬 공식 Intent scheme 실행
        setTimeout(() => {
          window.location.href = intentUrl;
        }, 150);

        // 2차 Fallback: 커스텀 스킴 실행
        setTimeout(() => {
          window.location.href = fallbackSchemeUrl;
        }, 1200);
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  /** 기존 탭(탭 A) 및 앱에 인증 완료 상태 브로드캐스트 */
  const notifyOtherTabs = () => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('dduktak_auth_channel');
        channel.postMessage({ type: 'AUTH_VERIFIED', timestamp: Date.now() });
        channel.close();
      }
    } catch {
      // BroadcastChannel 미지원 환경 무시
    }

    try {
      localStorage.setItem('dduktak_auth_event', String(Date.now()));
    } catch {
      // 스토리지 에러 무시
    }
  };

  /** 현재 창 닫기 시도 */
  const handleCloseWindow = () => {
    window.close();
    setTimeout(() => {
      setCanClose(false);
    }, 400);
  };

  return (
    <div className="flex min-h-dvh flex-col justify-between px-6 py-8">
      {/* 상단: 브랜드 로고 헤더 */}
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-2">
          <img src={logo} alt="오늘의 뚝딱 로고" className="h-10 w-auto object-contain" />
          <span className="font-yanolja text-3xl font-bold tracking-wider text-brand-600 dark:text-brand-300">
            오늘의 뚝딱
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          1인 가구를 위한 맞춤 요리 솔루션
        </p>
      </div>

      {/* 중앙: 상태별 결과 카드 */}
      <div className="my-auto w-full max-w-sm mx-auto">
        {status === 'verifying' && (
          <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-card space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-950/60 dark:text-brand-400">
              <RefreshCw className="h-7 w-7 animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">인증 정보 확인 중</h2>
              <p className="mt-1 text-xs text-muted-foreground break-keep">
                인증 정보를 안전하게 검증하고 있습니다. 잠시만 기다려 주세요...
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-card space-y-5 animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mint-100 text-mint-600 dark:bg-mint-950/60 dark:text-mint-400 shadow-soft">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">로그인 인증 완료!</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground break-keep">
                성공적으로 인증되었습니다! 👏<br />
                잠시 후 <span className="font-semibold text-foreground">오늘의 뚝딱 앱</span>으로 자동 복귀합니다.
              </p>
            </div>

            {/* 안내 뱃지 */}
            <div className="rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 p-3 text-left border border-brand-100/60 dark:border-brand-900/40">
              <p className="text-[11px] text-brand-700 dark:text-brand-300 font-medium leading-relaxed">
                💡 <strong>안내</strong>: 앱이 자동으로 열리지 않으면 아래 <strong>[오늘의 뚝딱 앱으로 돌아가기]</strong> 버튼을 직접 눌러주세요.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={appReturnUrl}
                className="flex w-full items-center justify-center rounded-2xl bg-brand-500 py-3.5 text-sm font-bold text-white shadow-soft hover:bg-brand-600 active:scale-[0.98] transition-all"
              >
                오늘의 뚝딱 앱으로 돌아가기
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </a>

              <Button
                type="button"
                onClick={handleCloseWindow}
                variant="outline"
                className="w-full rounded-2xl border-border py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted active:scale-[0.98] transition-all"
              >
                <X className="mr-1.5 h-4 w-4" />
                현재 브라우저 창 닫기
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(ROUTES.HOME)}
                className="w-full rounded-2xl border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted active:scale-[0.98] transition-all"
              >
                웹 브라우저에서 서비스 계속하기
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>

              {!canClose && (
                <p className="text-[11px] text-muted-foreground animate-fade-in pt-1">
                  브라우저 보안 설정으로 창이 자동으로 닫히지 않을 수 있습니다. 상단의 탭 닫기(X)를 눌러주세요.
                </p>
              )}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-3xl border border-destructive/20 bg-card p-6 text-center shadow-card space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">인증에 실패했습니다</h2>
              <p className="mt-1 text-xs text-muted-foreground break-keep">
                {errorMessage || '인증 링크가 만료되었거나 이미 사용된 링크입니다.'}
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
        )}
      </div>

      {/* 하단 여백 및 카피라이트 */}
      <div className="text-center text-[11px] text-muted-foreground/60">
        © 2026 오늘의 뚝딱. All rights reserved.
      </div>
    </div>
  );
}
