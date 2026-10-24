/**
 * 회원 및 인증 도메인 API 서비스 (05_API_SPECIFICATION.md 3.1절)
 *
 * [역할 분담 원칙]:
 * 1. Supabase Auth SDK: 회원가입, 로그인, OAuth 연동, 비밀번호 재설정 및 토큰 수명주기
 * 2. 백엔드 Spring Boot REST API: public.profiles 지연 프로필 생성(POST /init), 프로필 조회/수정(GET, PATCH /me), 회원 탈퇴(DELETE /withdraw)
 */

import { supabase } from '@/services/supabaseClient';
import { apiClient } from '@/services/apiClient';
import type {
  ApiResponseDto,
  InitProfileResponseDto,
  UserProfileResponseDto,
  UpdateProfileRequestDto,
  UpdateProfileResponseDto,
  QuietTimeRequestDto,
  QuietTimeResponseDto,
  WithdrawRequestDto,
} from '@/types/auth';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// ==============================================================================
// 1. Supabase Auth Client SDK 함수
// ==============================================================================

/**
 * 이메일 / 비밀번호 로그인 (AUTH-01-2)
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * 이메일 회원가입 (AUTH-01-1)
 * 입력된 닉네임은 raw_user_meta_data에 저장되며, 첫 로그인 시 백엔드가 읽어 지연 생성합니다.
 */
export async function signUpWithEmail(email: string, password: string, nickname: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname: nickname.trim(),
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * 카카오 / 구글 소셜 간편 로그인 (AUTH-02-1)
 */
export async function signInWithOAuth(provider: 'kakao' | 'google') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
    },
  });
  if (error) throw error;
  return data;
}

/**
 * 비밀번호 재설정 이메일 발송 (USER-PAGE-01-2)
 */
export async function sendPasswordResetEmail(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
  });
  if (error) throw error;
  return data;
}

/**
 * 로그아웃 (세션 파기)
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * 현재 클라이언트 세션 조회
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Supabase Auth 인증 상태 변화 이벤트 구독
 */
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// ==============================================================================
// 2. 백엔드 Spring Boot REST API (/api/v1/auth) 연동 함수
// ==============================================================================

/**
 * 첫 로그인 시점 세션 동기화 및 지연 프로필 생성 (Lazy Profile JIT Sync)
 * POST /api/v1/auth/init
 */
export async function initProfile(): Promise<InitProfileResponseDto> {
  const response = await apiClient.post<ApiResponseDto<InitProfileResponseDto>>(
    '/api/v1/auth/init',
  );
  return response.data.data;
}

/**
 * 본인 프로필 정보 조회 (Read-Only 멱등 API)
 * GET /api/v1/auth/me
 */
export async function getMyProfile(): Promise<UserProfileResponseDto> {
  const response = await apiClient.get<ApiResponseDto<UserProfileResponseDto>>(
    '/api/v1/auth/me',
  );
  return response.data.data;
}

/**
 * 프로필 정보(닉네임, 프로필 이미지) 수정
 * PATCH /api/v1/auth/me
 */
export async function updateMyProfile(
  dto: UpdateProfileRequestDto,
): Promise<UpdateProfileResponseDto> {
  const response = await apiClient.patch<ApiResponseDto<UpdateProfileResponseDto>>(
    '/api/v1/auth/me',
    dto,
  );
  return response.data.data;
}

/**
 * 야간 방해금지 시간 설정
 * PATCH /api/v1/auth/me/quiet-time
 */
export async function updateQuietTime(
  dto: QuietTimeRequestDto,
): Promise<QuietTimeResponseDto> {
  const response = await apiClient.patch<ApiResponseDto<QuietTimeResponseDto>>(
    '/api/v1/auth/me/quiet-time',
    dto,
  );
  return response.data.data;
}

/**
 * 회원 탈퇴 (USER-02: 레시피 익명 보존 및 개인 데이터 Cascade 삭제)
 * DELETE /api/v1/auth/withdraw
 */
export async function withdraw(dto?: WithdrawRequestDto): Promise<void> {
  await apiClient.delete<ApiResponseDto<null>>('/api/v1/auth/withdraw', {
    data: dto,
  });
}
