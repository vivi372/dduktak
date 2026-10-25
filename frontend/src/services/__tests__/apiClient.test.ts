import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { apiClient, extractTraceId, handleUxTaggedError, _resetUnauthorizedNoticeTimer } from '@/services/apiClient';
import { supabase } from '@/services/supabaseClient';
import { useErrorModalStore } from '@/store/useErrorModalStore';
import type { ErrorResponseDto } from '@/types/auth';

// 모킹 설정
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe('apiClient 및 Interceptor 단위 테스트 (02_ARCHITECTURE_AND_CONVENTIONS.md 4.1 & 5.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetUnauthorizedNoticeTimer();
    useErrorModalStore.getState().closeModal();
  });

  describe('extractTraceId 헬퍼 테스트', () => {
    it('다양한 대소문자 형태의 X-Trace-Id 헤더를 정확히 추출해야 한다', () => {
      expect(extractTraceId({ 'x-trace-id': 'e4a3f1' })).toBe('e4a3f1');
      expect(extractTraceId({ 'X-Trace-Id': 'b7c2d9' })).toBe('b7c2d9');
      expect(extractTraceId({ 'X-TRACE-ID': '99ff01' })).toBe('99ff01');
      expect(extractTraceId({})).toBeUndefined();
      expect(extractTraceId(undefined)).toBeUndefined();
    });
  });

  describe('UX 태그별 에러 분기 (handleUxTaggedError) 테스트', () => {
    it('_FIELD_ 태그는 개별 폼 바인딩용이므로 전역 알림이나 모달을 호출하지 않아야 한다', () => {
      const fieldError: ErrorResponseDto = {
        success: false,
        code: 'USER_FIELD_INVALID_NICKNAME',
        message: '닉네임 형식이 올바르지 않습니다.',
        timestamp: '2026-10-24T12:00:00',
      };

      handleUxTaggedError(fieldError, 'trace123');

      expect(toast.info).not.toHaveBeenCalled();
      expect(toast.warning).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
      expect(useErrorModalStore.getState().isOpen).toBe(false);
    });

    it('_INFO_ 태그는 toast.info를 호출해야 한다', () => {
      const infoError: ErrorResponseDto = {
        success: false,
        code: 'RECIPE_INFO_ALREADY_SCRAPPED',
        message: '이미 스크랩된 레시피입니다.',
        timestamp: '2026-10-24T12:00:00',
      };

      handleUxTaggedError(infoError, 'trace123');

      expect(toast.info).toHaveBeenCalledWith(
        '이미 스크랩된 레시피입니다.',
        expect.objectContaining({
          duration: 3000,
          description: '식별 코드: trace123',
        }),
      );
    });

    it('_WARN_ 태그는 toast.warning을 호출해야 한다', () => {
      const warnError: ErrorResponseDto = {
        success: false,
        code: 'INV_WARN_IMMINENT_EXPIRATION',
        message: '소비기한이 3일 이내인 재료가 있습니다.',
        timestamp: '2026-10-24T12:00:00',
      };

      handleUxTaggedError(warnError, 'trace456');

      expect(toast.warning).toHaveBeenCalledWith(
        '소비기한이 3일 이내인 재료가 있습니다.',
        expect.objectContaining({
          duration: 3000,
          description: '식별 코드: trace456',
        }),
      );
    });

    it('_ERROR_ 태그는 toast.error를 호출해야 한다', () => {
      const errError: ErrorResponseDto = {
        success: false,
        code: 'MATCHING_ERROR_FAILED',
        message: '매칭 연산 중 오류가 발생했습니다.',
        timestamp: '2026-10-24T12:00:00',
      };

      handleUxTaggedError(errError, 'trace789');

      expect(toast.error).toHaveBeenCalledWith(
        '매칭 연산 중 오류가 발생했습니다.',
        expect.objectContaining({
          duration: 3000,
          description: '식별 코드: trace789',
        }),
      );
    });

    it('_ALERT_ 태그는 GlobalErrorModal을 ALERT 모드로 열어야 한다', () => {
      const alertError: ErrorResponseDto = {
        success: false,
        code: 'AUTH_ALERT_ACCOUNT_LOCKED',
        message: '보안 정책에 따라 계정이 일시 잠금되었습니다.',
        timestamp: '2026-10-24T12:00:00',
      };

      handleUxTaggedError(alertError, 'alertTrace');

      const modalState = useErrorModalStore.getState();
      expect(modalState.isOpen).toBe(true);
      expect(modalState.type).toBe('ALERT');
      expect(modalState.message).toBe('보안 정책에 따라 계정이 일시 잠금되었습니다.');
      expect(modalState.traceId).toBe('alertTrace');
    });

    it('_CONFIRM_ 태그는 GlobalErrorModal을 CONFIRM 모드로 열어야 한다', () => {
      const confirmError: ErrorResponseDto = {
        success: false,
        code: 'RECIPE_CONFIRM_DELETE_CONFIRMATION',
        message: '정말 이 레시피를 삭제하시겠습니까?',
        timestamp: '2026-10-24T12:00:00',
      };

      handleUxTaggedError(confirmError, 'confirmTrace');

      const modalState = useErrorModalStore.getState();
      expect(modalState.isOpen).toBe(true);
      expect(modalState.type).toBe('CONFIRM');
      expect(modalState.message).toBe('정말 이 레시피를 삭제하시겠습니까?');
      expect(modalState.traceId).toBe('confirmTrace');
    });

    it('_FATAL_ 태그는 GlobalErrorModal을 FATAL 모드로 열어야 한다', () => {
      const fatalError: ErrorResponseDto = {
        success: false,
        code: 'SYS_FATAL_INTERNAL_SERVER_ERROR',
        message: '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: '2026-10-24T12:00:00',
      };

      handleUxTaggedError(fatalError, 'fatalTrace');

      const modalState = useErrorModalStore.getState();
      expect(modalState.isOpen).toBe(true);
      expect(modalState.type).toBe('FATAL');
      expect(modalState.message).toContain('서버 내부 오류');
      expect(modalState.traceId).toBe('fatalTrace');
    });
  });

  describe('Axios Request Interceptor 테스트', () => {
    it('Supabase 세션에 토큰이 존재할 경우 Authorization 헤더에 Bearer 토큰을 주입해야 한다', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'fake-jwt-token-12345',
          } as any,
        },
        error: null,
      });

      // interceptors.request 핸들러 직접 추출 및 검증
      const requestInterceptor = (apiClient.interceptors.request as any).handlers[0];
      const config = await requestInterceptor.fulfilled({
        headers: new Map(),
      });

      expect(config.headers.get('Authorization')).toBe('Bearer fake-jwt-token-12345');
    });

    it('Supabase 세션이 없을 경우 Authorization 헤더를 주입하지 않아야 한다', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const requestInterceptor = (apiClient.interceptors.request as any).handlers[0];
      const config = await requestInterceptor.fulfilled({
        headers: new Map(),
      });

      expect(config.headers.get('Authorization')).toBeUndefined();
    });
  });

  describe('Axios Response Interceptor 테스트', () => {
    it('401 Unauthorized 수신 시 토스트를 띄우고 dduktak:unauthorized 이벤트를 디스패치해야 한다', async () => {
      const responseInterceptor = (apiClient.interceptors.response as any).handlers[0];
      const eventSpy = vi.fn();
      window.addEventListener('dduktak:unauthorized', eventSpy);

      const error = {
        response: {
          status: 401,
          headers: { 'x-trace-id': 'unauth123' },
          data: {
            code: 'AUTH_ERROR_UNAUTHORIZED',
            message: '인증 토큰이 유효하지 않습니다.',
          },
        },
      };

      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);

      expect(toast.error).toHaveBeenCalledWith(
        '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.',
        expect.objectContaining({
          description: '식별 코드: unauth123',
        }),
      );
      expect(eventSpy).toHaveBeenCalledTimes(1);

      window.removeEventListener('dduktak:unauthorized', eventSpy);
    });

    it('연속/동시 다중 401 Unauthorized 수신 시 토스트와 이벤트가 중복 난사되지 않고 1회만 발화되어야 한다 (EDGE-05)', async () => {
      const responseInterceptor = (apiClient.interceptors.response as any).handlers[0];
      const eventSpy = vi.fn();
      window.addEventListener('dduktak:unauthorized', eventSpy);
      vi.clearAllMocks();

      const error = {
        response: {
          status: 401,
          headers: { 'x-trace-id': 'unauth_multi' },
          data: { code: 'AUTH_ERROR_UNAUTHORIZED' },
        },
      };

      // 동시 3건의 401 응답 발생
      await Promise.allSettled([
        responseInterceptor.rejected(error),
        responseInterceptor.rejected(error),
        responseInterceptor.rejected(error),
      ]);

      // 디바운스 및 고유 ID로 1회만 노출/발행 검증 (EDGE-05)
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(eventSpy).toHaveBeenCalledTimes(1);

      window.removeEventListener('dduktak:unauthorized', eventSpy);
    });
  });
});
