/**
 * 전역 Axios API Client (02_ARCHITECTURE_AND_CONVENTIONS.md 4.1절 & 5.4절)
 *
 * 1. Request Interceptor:
 *    - Supabase Auth SDK 세션에서 Access Token(JWT)을 획득하여 Authorization: Bearer [Token] 헤더 자동 주입
 * 2. Response Interceptor:
 *    - 백엔드 TraceIdFilter가 주입한 X-Trace-Id 헤더 수신 및 콘솔 디버깅 연동
 *    - 에러 코드 UX 태그(_FIELD_, _INFO_, _WARN_, _ERROR_, _ALERT_, _CONFIRM_, _FATAL_) 기반 자동 분기:
 *      * _FIELD_: 입력 폼 자체 바인딩을 위해 전역 토스트/모달 스킵
 *      * _INFO_ / _WARN_ / _ERROR_: Sonner Toast 3초간 노출 (X-Trace-Id 뱃지 포함)
 *      * _ALERT_: 확인 1버튼 안내 모달 노출 (GlobalErrorModal)
 *      * _CONFIRM_: 확인/취소 2버튼 Confirm 모달 노출
 *      * _FATAL_: 재시도 버튼을 포함한 치명적 시스템 에러 모달 노출
 *    - 401 Unauthorized 발생 시: 세션 정리 및 로그인 유도
 */

import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { supabase } from '@/services/supabaseClient';
import { useErrorModalStore } from '@/store/useErrorModalStore';
import type { ErrorResponseDto } from '@/types/auth';

/**
 * X-Trace-Id 헤더 추출 헬퍼 (대소문자 무관)
 */
export function extractTraceId(headers?: Record<string, unknown>): string | undefined {
  if (!headers) return undefined;
  const traceId =
    headers['x-trace-id'] ||
    headers['X-Trace-Id'] ||
    headers['x-trace-ID'] ||
    headers['X-TRACE-ID'];
  return typeof traceId === 'string' ? traceId : undefined;
}

/**
 * 백엔드 에러 코드 UX 태그 기반 전역 예외 처리 헬퍼
 */
export function handleUxTaggedError(errorData: ErrorResponseDto, traceId?: string): void {
  const { code, message } = errorData;

  // 1. _FIELD_: 폼 개별 필드 에러 바인딩용이므로 전역 알림 스킵
  if (code.includes('_FIELD_')) {
    return;
  }

  const description = traceId ? `식별 코드: ${traceId}` : undefined;

  // 2. _INFO_: 파란색/기본 토스트 3초 노출
  if (code.includes('_INFO_')) {
    toast.info(message, { duration: 3000, description });
    return;
  }

  // 3. _WARN_: 노란색 경고 토스트 3초 노출
  if (code.includes('_WARN_')) {
    toast.warning(message, { duration: 3000, description });
    return;
  }

  // 4. _ERROR_: 빨간색 에러 토스트 3초 노출
  if (code.includes('_ERROR_')) {
    toast.error(message, { duration: 3000, description });
    return;
  }

  // 5. _ALERT_: 확인 1버튼 안내 모달
  if (code.includes('_ALERT_')) {
    useErrorModalStore.getState().openAlert({
      title: '안내',
      message,
      traceId,
    });
    return;
  }

  // 6. _CONFIRM_: 확인/취소 2버튼 확인 모달
  if (code.includes('_CONFIRM_')) {
    useErrorModalStore.getState().openConfirm({
      title: '확인',
      message,
      traceId,
    });
    return;
  }

  // 7. _FATAL_: 재시도 안내 시스템 에러 모달
  if (code.includes('_FATAL_')) {
    useErrorModalStore.getState().openFatal({
      title: '시스템 오류',
      message,
      traceId,
      onRetry: () => window.location.reload(),
    });
    return;
  }

  // 태그가 지정되지 않은 기본 에러 폴백
  toast.error(message || '요청 처리 중 오류가 발생했습니다.', { duration: 3000, description });
}

/**
 * Axios 인스턴스 생성
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * [Request Interceptor]
 * Supabase SDK 세션에서 Access Token을 추출하여 Authorization 헤더에 Bearer 토큰 주입
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } catch {
      // Supabase 세션 조회 실패 시 무인증 요청으로 폴백 진행
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 401 세션 만료 알림 및 이벤트 중복 난사 방지 타이머 (EDGE-05)
let unauthorizedNoticeTimer: ReturnType<typeof setTimeout> | null = null;

export function _resetUnauthorizedNoticeTimer(): void {
  if (unauthorizedNoticeTimer) {
    clearTimeout(unauthorizedNoticeTimer);
    unauthorizedNoticeTimer = null;
  }
}

function notifyUnauthorizedOnce(traceId?: string) {
  if (unauthorizedNoticeTimer) return;

  // 이미 로그인 관련 화면에 있거나 세션이 없는 상태에서는 불필요한 만료 토스트 노출 방어
  const isAuthPage =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/login') ||
      window.location.pathname.startsWith('/reset-password') ||
      window.location.pathname.startsWith('/onboarding'));

  if (!isAuthPage) {
    toast.error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.', {
      id: 'dduktak-session-expired',
      duration: 3000,
      description: traceId ? `식별 코드: ${traceId}` : undefined,
    });
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dduktak:unauthorized'));
  }

  unauthorizedNoticeTimer = setTimeout(() => {
    unauthorizedNoticeTimer = null;
  }, 2000);
}

/**
 * [Response Interceptor]
 * X-Trace-Id 추출 및 백엔드 ErrorResponseDto UX 태그 전역 분기
 */
apiClient.interceptors.response.use(
  (response) => {
    // 응답 성공 시 X-Trace-Id 헤더 추출 및 디버그 로깅
    const traceId = extractTraceId(response.headers as Record<string, unknown>);
    if (traceId && import.meta.env.DEV) {
      // 개발 환경 콘솔 디버깅
      // eslint-disable-next-line no-console
      console.debug(`[API 200 OK] [TraceID: ${traceId}] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError<ErrorResponseDto>) => {
    const traceId = extractTraceId(error.response?.headers as Record<string, unknown>);
    const status = error.response?.status;
    const errorData = error.response?.data;

    // 401 Unauthorized 처리 (세션 만료 또는 무효 토큰, EDGE-05)
    if (status === 401) {
      notifyUnauthorizedOnce(traceId);
      return Promise.reject(error);
    }

    // 백엔드 ErrorResponseDto 규격 에러인 경우 UX 태그 자동 분기
    if (errorData && typeof errorData.code === 'string') {
      handleUxTaggedError(errorData, traceId);
    } else if (error.message) {
      // 네트워크 단절 등 서버 응답 자체가 없는 경우
      toast.error('서버와 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.', {
        duration: 3000,
      });
    }

    return Promise.reject(error);
  },
);

export default apiClient;
