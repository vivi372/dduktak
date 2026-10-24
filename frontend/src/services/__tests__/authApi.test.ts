import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authApi from '@/services/authApi';
import { apiClient } from '@/services/apiClient';
import { supabase } from '@/services/supabaseClient';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/services/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

describe('authApi 서비스 단위 테스트 (05_API_SPECIFICATION.md 3.1절)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('백엔드 REST API (/api/v1/auth) 연동 테스트', () => {
    it('initProfile은 POST /api/v1/auth/init을 호출하고 프로필 초기화 응답을 반환해야 한다', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            userId: 'user-uuid-1234',
            nickname: '뚝딱이',
            userTag: '1024',
            profileImage: 'https://example.com/profile.png',
          },
          message: '프로필 세션 동기화 완료',
        },
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authApi.initProfile();

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/init');
      expect(result).toEqual(mockResponse.data.data);
    });

    it('getMyProfile은 GET /api/v1/auth/me를 호출하고 전체 프로필을 반환해야 한다', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            userId: 'user-uuid-1234',
            email: 'user@dduktak.com',
            nickname: '뚝딱이',
            userTag: '1024',
            profileImage: 'https://example.com/profile.png',
            status: 'ACTIVE',
            quietTimeStart: '21:00:00',
            quietTimeEnd: '08:00:00',
          },
          message: '성공',
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await authApi.getMyProfile();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/auth/me');
      expect(result).toEqual(mockResponse.data.data);
    });

    it('updateMyProfile은 PATCH /api/v1/auth/me를 DTO와 함께 호출해야 한다', async () => {
      const dto = { nickname: '새로운닉네임', profileImage: 'https://example.com/new.png' };
      const mockResponse = {
        data: {
          success: true,
          data: { userId: 'user-uuid-1234', nickname: '새로운닉네임', profileImage: 'https://example.com/new.png' },
          message: '수정 완료',
        },
      };
      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const result = await authApi.updateMyProfile(dto);

      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/auth/me', dto);
      expect(result.nickname).toBe('새로운닉네임');
    });

    it('updateQuietTime은 PATCH /api/v1/auth/me/quiet-time을 호출해야 한다', async () => {
      const dto = { quietTimeStart: '22:00:00', quietTimeEnd: '07:00:00' };
      const mockResponse = {
        data: {
          success: true,
          data: { userId: 'user-uuid-1234', quietTimeStart: '22:00:00', quietTimeEnd: '07:00:00' },
          message: '설정 완료',
        },
      };
      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const result = await authApi.updateQuietTime(dto);

      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/auth/me/quiet-time', dto);
      expect(result.quietTimeStart).toBe('22:00:00');
    });

    it('withdraw는 DELETE /api/v1/auth/withdraw를 호출해야 한다', async () => {
      const dto = { password: 'secretPassword123!' };
      vi.mocked(apiClient.delete).mockResolvedValue({ data: { success: true, data: null, message: '탈퇴 완료' } });

      await authApi.withdraw(dto);

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/auth/withdraw', { data: dto });
    });
  });

  describe('Supabase Auth Client SDK 함수 테스트', () => {
    it('signInWithEmail은 supabase.auth.signInWithPassword를 호출해야 한다', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: {} as any, session: {} as any },
        error: null,
      });

      await authApi.signInWithEmail('test@dduktak.com', 'password123!');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@dduktak.com',
        password: 'password123!',
      });
    });

    it('signUpWithEmail은 닉네임을 raw_user_meta_data에 담아 호출해야 한다', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: {} as any, session: null },
        error: null,
      });

      await authApi.signUpWithEmail('new@dduktak.com', 'password123!', '신규유저');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@dduktak.com',
        password: 'password123!',
        options: {
          data: {
            nickname: '신규유저',
          },
        },
      });
    });

    it('signInWithOAuth는 카카오 및 구글 프로바이더로 리다이렉트 옵션과 함께 호출해야 한다', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'kakao', url: 'https://auth.url' },
        error: null,
      });

      await authApi.signInWithOAuth('kakao');

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'kakao',
        }),
      );
    });

    it('signOut은 supabase.auth.signOut을 호출해야 한다', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      await authApi.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
