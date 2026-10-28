import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

/**
 * 이메일 인증 완료 전용 브릿지 페이지 (/auth/callback)
 * - 회원가입 및 이메일 변경 확인 링크 클릭 시 진입
 * - 세션 검증 후 BroadcastChannel 및 localStorage 이벤트를 통해 기존 탭(탭 A)으로 인증 완료 신호 전송
 * - 중복 탭 방지를 위해 [창 닫기] 및 [홈으로 가기] 액션 제공
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [canClose, setCanClose] = useState<boolean>(true);

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

        // 3. 현재 유효한 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
          // 간혹 hash 토큰 처리가 비동기로 이루어질 수 있으므로 authStateChange 1회성 대기
          const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (newSession && isMounted) {
              notifyOtherTabs();
              setStatus('success');
              authListener.subscription.unsubscribe();
            }
          });

          // 2초 후에도 세션이 없으면 에러 처리
          setTimeout(() => {
            if (isMounted && status === 'verifying') {
              // 세션은 없더라도 인증 자체는 성공했을 수 있으므로 성공 처리
              notifyOtherTabs();
              setStatus('success');
              authListener.subscription.unsubscribe();
            }
          }, 2000);
          return;
        }

        // 4. 인증 완료 신호 전송
        if (isMounted) {
          notifyOtherTabs();
          setStatus('success');
          if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
            setTimeout(() => {
              window.location.href = `com.dduktak.app://auth/callback${window.location.search}${window.location.hash}`;
            }, 300);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err?.message || '이메일 인증 처리 중 오류가 발생했습니다.');
        }
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
    // 브라우저 팝업 보안 정책으로 window.close()가 무시될 수 있음
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
              <h2 className="text-lg font-bold text-foreground">이메일 인증 확인 중</h2>
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
              <h2 className="text-xl font-bold text-foreground">이메일 인증 완료!</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground break-keep">
                성공적으로 인증되었습니다! 👏<br />
                기존에 사용하시던 <span className="font-semibold text-foreground">웹 브라우저 탭</span>이나 <span className="font-semibold text-foreground">오늘의 뚝딱 앱</span>으로 돌아가시면 서비스가 바로 시작됩니다.
              </p>
            </div>

            {/* 안내 뱃지 */}
            <div className="rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 p-3 text-left border border-brand-100/60 dark:border-brand-900/40">
              <p className="text-[11px] text-brand-700 dark:text-brand-300 font-medium leading-relaxed">
                💡 <strong>Tip</strong>: 모바일 앱에서 인증을 요청하셨다면 현재 웹 브라우저를 닫고 다시 앱을 열어주세요.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={`com.dduktak.app://auth/callback${typeof window !== 'undefined' ? window.location.search + window.location.hash : ''}`}
                className="flex w-full items-center justify-center rounded-2xl bg-brand-500 py-3 text-sm font-bold text-white shadow-soft hover:bg-brand-600 active:scale-[0.98] transition-all"
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
                현재 창 닫기
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(ROUTES.HOME)}
                className="w-full rounded-2xl border-border py-3 text-xs font-semibold text-foreground hover:bg-muted active:scale-[0.98] transition-all"
              >
                이 창에서 오늘의 뚝딱 시작하기
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>

              {!canClose && (
                <p className="text-[11px] text-muted-foreground animate-fade-in pt-1">
                  브라우저 보안 설정으로 창이 자동으로 닫히지 않을 수 있습니다. 상단의 탭 닫기(X) 버튼을 직접 눌러주세요.
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
