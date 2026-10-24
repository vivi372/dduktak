import type { UserProfile } from '@/types/user';

/** 목 데이터: 로그인 유저 프로필 (기본 프로필 이미지는 Supabase Storage 공개 URL) */
export const mockUser: UserProfile = {
  userId: '3f7f754c-d561-4b93-b79b-9d73a4f29f2a',
  email: 'user@dduktak.com',
  nickname: '뚝딱이',
  userTag: '1024',
  profileImage:
    'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/profiles/Default%20Profile.png',
  status: 'ACTIVE',
  quietTimeStart: '21:00:00',
  quietTimeEnd: '08:00:00',
  loginProvider: 'email',
};
