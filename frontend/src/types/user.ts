/** 로그인 제공자 (이메일 vs 소셜) */
export type LoginProvider = 'email' | 'google';

/** 회원 프로필 (05_API_SPECIFICATION 3.1 GET /api/v1/auth/me) */
export interface UserProfile {
  userId: string;
  email: string;
  nickname: string;
  userTag: string;
  profileImage: string;
  status: 'ACTIVE' | 'WITHDRAWN';
  quietTimeStart: string; // HH:mm:ss
  quietTimeEnd: string;
  isExpireWarnEnabled?: boolean;
  isReactionNoticeEnabled?: boolean;
  loginProvider?: LoginProvider;
}

/** 프로필 정보 수정 요청 (PATCH /api/v1/auth/me) */
export interface ProfileUpdateRequest {
  nickname: string;
  profileImage?: string;
}

/** 회원 탈퇴 요청 (DELETE /api/v1/auth/withdraw) */
export interface WithdrawRequest {
  password?: string;
  agreeAnonymization: boolean; // 레시피 익명 보존 필수 동의
}
