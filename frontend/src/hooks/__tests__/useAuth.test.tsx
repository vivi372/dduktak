import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import * as authApi from '@/services/authApi';

vi.mock('@/services/authApi', () => ({
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithOAuth: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  initProfile: vi.fn(),
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
  updateQuietTime: vi.fn(),
  withdraw: vi.fn(),
  onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
}));

describe('useAuth 커스텀 훅 단위 테스트 (02_ARCHITECTURE_AND_CONVENTIONS 3.3)', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    });
  });

  it('기본 비인증 상태일 때 isAuthenticated는 false이고 user는 null이어야 한다', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('loginWithEmail 호출 시 authApi.signInWithEmail을 호출해야 한다', async () => {
    vi.mocked(authApi.signInWithEmail).mockResolvedValue({
      user: { id: 'user-1' } as any,
      session: { access_token: 'token-1' } as any,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.loginWithEmail({ email: 'test@dduktak.com', password: 'password123!' });
    });

    expect(authApi.signInWithEmail).toHaveBeenCalledWith('test@dduktak.com', 'password123!');
  });

  it('updateProfile 호출 시 authApi.updateMyProfile을 호출해야 한다', async () => {
    const fakeUpdated = {
      userId: 'user-1',
      nickname: '새닉네임',
    };
    vi.mocked(authApi.updateMyProfile).mockResolvedValue(fakeUpdated);
    vi.mocked(authApi.getMyProfile).mockResolvedValue({
      userId: 'user-1',
      email: 'user@dduktak.com',
      nickname: '새닉네임',
      userTag: '1024',
      profileImage: '',
      status: 'ACTIVE',
      quietTimeStart: '21:00:00',
      quietTimeEnd: '08:00:00',
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.updateProfile({ nickname: '새닉네임' });
    });

    expect(authApi.updateMyProfile).toHaveBeenCalledWith({ nickname: '새닉네임' });
  });

  it('logout 호출 시 store의 logout을 실행하고 캐시를 초기화해야 한다', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { userId: 'user-1' } as any,
      session: { access_token: 'token' } as any,
    });

    vi.mocked(authApi.signOut).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
