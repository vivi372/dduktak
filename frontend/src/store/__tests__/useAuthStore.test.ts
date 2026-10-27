import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { useAuthStore } from '@/store/useAuthStore';
import * as authApi from '@/services/authApi';

vi.mock('@/services/authApi', () => ({
  initProfile: vi.fn(),
  getMyProfile: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

describe('useAuthStore 세션 스토어 단위 테스트 (Zustand & Supabase Sync)', () => {
  let authChangeCallback: (event: string, session: any) => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,
    });

    vi.mocked(authApi.onAuthStateChange).mockImplementation((cb: any) => {
      authChangeCallback = cb;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      } as any;
    });
  });

  it('initialize 호출 시 onAuthStateChange를 구독하고 리스너 클린업 함수를 반환해야 한다', () => {
    const cleanup = useAuthStore.getState().initialize();

    expect(authApi.onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(typeof cleanup).toBe('function');
  });

  it('Supabase 세션 감지 시 initProfile 및 getMyProfile을 순서대로 호출하여 지연 프로필을 동기화해야 한다', async () => {
    useAuthStore.getState().initialize();

    const fakeSession = {
      access_token: 'fake-token-xyz',
      user: { id: 'user-uuid-1', email: 'user@dduktak.com' },
    };

    const fakeProfile = {
      userId: 'user-uuid-1',
      email: 'user@dduktak.com',
      nickname: '동기화뚝딱이',
      userTag: '1024',
      profileImage: 'https://example.com/p.png',
      status: 'ACTIVE' as const,
      quietTimeStart: '21:00:00',
      quietTimeEnd: '08:00:00',
    };

    vi.mocked(authApi.initProfile).mockResolvedValue({
      userId: 'user-uuid-1',
      nickname: '동기화뚝딱이',
      userTag: '1024',
      profileImage: 'https://example.com/p.png',
    });
    vi.mocked(authApi.getMyProfile).mockResolvedValue(fakeProfile);

    // Supabase 이벤트 발생 시뮬레이션
    await authChangeCallback('SIGNED_IN', fakeSession);

    expect(authApi.initProfile).toHaveBeenCalledTimes(1);
    expect(authApi.getMyProfile).toHaveBeenCalledTimes(1);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.user).toEqual({ ...fakeProfile, loginProvider: 'email' });
    expect(state.session).toEqual(fakeSession);
  });

  it('구글 소셜 세션인 경우 loginProvider가 google로 설정되어야 한다', async () => {
    const googleSession = {
      access_token: 'fake-token-google',
      user: {
        id: 'user-uuid-google',
        email: 'google_user@gmail.com',
        app_metadata: { provider: 'google', providers: ['google'] },
      },
    } as unknown as Session;

    vi.mocked(authApi.initProfile).mockResolvedValue({
      userId: 'user-uuid-google',
      isNewUser: false,
      nickname: '구글유저',
      userTag: '9999',
      profileImage: 'https://example.com/g.png',
    });
    vi.mocked(authApi.getMyProfile).mockResolvedValue({
      userId: 'user-uuid-google',
      email: 'google_user@gmail.com',
      nickname: '구글유저',
      userTag: '9999',
      profileImage: 'https://example.com/g.png',
      status: 'ACTIVE',
      quietTimeStart: '21:00:00',
      quietTimeEnd: '08:00:00',
    });

    useAuthStore.getState().initialize();
    await authChangeCallback('SIGNED_IN', googleSession);

    const state = useAuthStore.getState();
    expect(state.user?.loginProvider).toBe('google');
  });

  it('세션이 null인 경우 비인증 상태로 전환되어야 한다', async () => {
    useAuthStore.getState().initialize();

    await authChangeCallback('SIGNED_OUT', null);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });

  it('logout 호출 시 signOut을 실행하고 스토어를 초기화해야 한다', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { userId: '1' } as any,
      session: { access_token: 'token' } as any,
    });

    vi.mocked(authApi.signOut).mockResolvedValue(undefined as any);

    await useAuthStore.getState().logout();

    expect(authApi.signOut).toHaveBeenCalledTimes(1);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });

  it('handleUnauthorized 호출 시 즉시 인증 상태가 해제되어야 한다', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { userId: '1' } as any,
      session: { access_token: 'token' } as any,
    });

    useAuthStore.getState().handleUnauthorized();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });
});
