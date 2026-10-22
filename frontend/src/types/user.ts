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
}
