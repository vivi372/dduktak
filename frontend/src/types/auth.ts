/**
 * 회원 및 인증 도메인 DTO 규격 정의 (05_API_SPECIFICATION.md 3.1절)
 * Spring Boot 백엔드 응답 규격 및 Supabase Auth 연동 모델과 100% 매핑
 */

import type { Session, User } from '@supabase/supabase-js';

/** 로그인 프로바이더 (이메일 및 소셜) */
export type LoginProvider = 'email' | 'kakao' | 'google';

/** 백엔드 에러 코드 UX 태그 분류 (02_ARCHITECTURE_AND_CONVENTIONS.md 5.4절) */
export type ErrorUxTag =
  | '_FIELD_'
  | '_INFO_'
  | '_WARN_'
  | '_ERROR_'
  | '_ALERT_'
  | '_CONFIRM_'
  | '_FATAL_';

/** 공통 API 단일 필드 검증 에러 규격 */
export interface FieldError {
  field: string;
  message: string;
}

/** 공통 API 성공 응답 규격 (ApiResponseDto<T>) */
export interface ApiResponseDto<T> {
  success: boolean;
  data: T;
  message: string;
}

/** 공통 API 실패/에러 응답 규격 (ErrorResponseDto) */
export interface ErrorResponseDto {
  success: false;
  code: string;
  message: string;
  timestamp: string;
  fieldErrors?: FieldError[];
}

/**
 * 첫 로그인 시점 세션 동기화 및 지연 프로필 생성 응답 DTO
 * (POST /api/v1/auth/init - AUTH-01-2, AUTH-02-2)
 */
export interface InitProfileResponseDto {
  userId: string;
  nickname: string;
  userTag: string;
  profileImage: string;
  isNewUser?: boolean;
}

/**
 * 회원 프로필 본인 정보 조회 응답 DTO
 * (GET /api/v1/auth/me - Read-Only 멱등 API)
 */
export interface UserProfileResponseDto {
  userId: string;
  email: string;
  nickname: string;
  userTag: string;
  profileImage: string;
  status: 'ACTIVE' | 'WITHDRAWN';
  quietTimeStart: string; // HH:mm:ss 형식
  quietTimeEnd: string;   // HH:mm:ss 형식
  loginProvider?: LoginProvider | string;
}

/**
 * 본인 프로필 정보 수정 요청 DTO
 * (PATCH /api/v1/auth/me)
 */
export interface UpdateProfileRequestDto {
  nickname: string;
  profileImage?: string;
}

/**
 * 본인 프로필 정보 수정 응답 DTO
 * (PATCH /api/v1/auth/me)
 */
export interface UpdateProfileResponseDto {
  userId: string;
  nickname: string;
  profileImage?: string;
}

/**
 * 야간 방해금지 시간 설정 요청 DTO
 * (PATCH /api/v1/auth/me/quiet-time)
 */
export interface QuietTimeRequestDto {
  quietTimeStart: string;
  quietTimeEnd: string;
}

/**
 * 야간 방해금지 시간 설정 응답 DTO
 * (PATCH /api/v1/auth/me/quiet-time)
 */
export interface QuietTimeResponseDto {
  userId: string;
  quietTimeStart: string;
  quietTimeEnd: string;
}

/**
 * 회원 탈퇴 요청 DTO (USER-02)
 * (DELETE /api/v1/auth/withdraw)
 */
export interface WithdrawRequestDto {
  password?: string;
}

/** Supabase 세션 및 유저 타입 재수출 */
export type { Session as SupabaseSession, User as SupabaseUser };
