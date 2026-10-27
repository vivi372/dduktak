import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyPage from '@/pages/MyPage';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/notificationStore';
import type { UserProfileResponseDto } from '@/types/auth';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/services/notificationApi', () => ({
  updateNotificationSettings: vi.fn().mockResolvedValue({}),
  getNotifications: vi.fn().mockResolvedValue({ items: [], unreadCount: 0 }),
}));

vi.mock('@/services/authApi', async () => {
  const actual = await vi.importActual('@/services/authApi');
  return {
    ...actual,
    updateUserEmail: vi.fn().mockResolvedValue({ user: {} }),
  };
});

const mockUser: UserProfileResponseDto = {
  userId: '3f7f754c-d561-4b93-b79b-9d73a4f29f2a',
  email: 'user@dduktak.com',
  nickname: '뚝딱이',
  userTag: '1024',
  profileImage: 'https://example.com/profile.png',
  status: 'ACTIVE',
  quietTimeStart: '21:00:00',
  quietTimeEnd: '08:00:00',
  loginProvider: 'email',
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MyPage 마이페이지 및 설정 단위 테스트', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { ...mockUser },
    });
    useNotificationStore.getState().resetNotifications();
    useNotificationStore.setState({
      settings: {
        isExpireWarnEnabled: true,
        isReactionNoticeEnabled: true,
        quietTimeStart: '',
        quietTimeEnd: ''
      },
    });
  });

  it('로그인 상태일 때 프로필(닉네임, #1024 유저태그)과 내 활동 숏컷을 렌더링해야 한다', () => {
    renderWithProviders(<MyPage />);

    expect(screen.getByText('뚝딱이')).toBeInTheDocument();
    expect(screen.getByText('#1024')).toBeInTheDocument();
    expect(screen.getAllByText('user@dduktak.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('내가 쓴 레시피')).toBeInTheDocument();
    expect(screen.getByText('스크랩북')).toBeInTheDocument();
  });

  it('프로필 수정 버튼 클릭 시 ProfileEditModal이 열려야 한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<MyPage />);

    const editButton = screen.getByRole('button', { name: '수정' });
    await user.click(editButton);

    expect(screen.getByRole('heading', { name: '프로필 수정' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('뚝딱이')).toBeInTheDocument();
  });

  it('방해금지 시간 행 클릭 시 QuietTimeModal이 열려야 한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<MyPage />);

    const quietTimeRow = screen.getByRole('button', { name: /방해금지 시간/ });
    await user.click(quietTimeRow);

    expect(screen.getByRole('heading', { name: '야간 방해금지 시간 설정' })).toBeInTheDocument();
    expect(screen.getAllByText(/야간 푸시 방지 정책에 따라/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: '설정 완료' })).toBeInTheDocument();
  });

  it('알림 토글 스위치 클릭 시 설정 상태가 전환되어야 한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<MyPage />);

    const expireToggle = screen.getByRole('switch', { name: '소비기한 임박 팝업 알림' });
    expect(expireToggle).toHaveAttribute('aria-checked', 'true');

    await user.click(expireToggle);
    expect(useNotificationStore.getState().settings.isExpireWarnEnabled).toBe(false);
  });

  it('회원 탈퇴 클릭 시 WithdrawModal이 열리고 필수 약관 체크 후 탈퇴 버튼이 활성화되어야 한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<MyPage />);

    const withdrawRow = screen.getByRole('button', { name: /회원 탈퇴/ });
    await user.click(withdrawRow);

    expect(
      screen.getByRole('heading', { name: '정말 회원 탈퇴를 진행하시겠습니까?' }),
    ).toBeInTheDocument();

    const withdrawBtn = screen.getByRole('button', { name: '탈퇴하기' });
    expect(withdrawBtn).toBeDisabled();

    // 필수 약관 체크박스 클릭
    const agreeCheckbox = screen.getByRole('checkbox');
    await user.click(agreeCheckbox);

    expect(withdrawBtn).toBeEnabled();
  });

  it('이메일 로그인 유저는 이메일 변경 모달에서 새 이메일을 입력하고 인증 링크를 발송할 수 있어야 한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<MyPage />);

    const changeEmailRow = screen.getByRole('button', { name: /이메일 변경/ });
    await user.click(changeEmailRow);

    expect(screen.getByRole('heading', { name: '계정 이메일 변경' })).toBeInTheDocument();

    const input = screen.getByPlaceholderText('example@dduktak.com');
    await user.type(input, 'new_user@dduktak.com');

    const submitBtn = screen.getByRole('button', { name: /인증 링크 발송/ });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('인증 링크가 발송되었습니다')).toBeInTheDocument();
    });
    expect(screen.getAllByText(/new_user@dduktak.com/).length).toBeGreaterThanOrEqual(1);
  });

  it('소셜 로그인 유저는 이메일/비밀번호 변경 대신 연동된 소셜 계정 정보가 노출되어야 한다', () => {
    useAuthStore.setState((prev) => ({
      ...prev,
      user: {
        ...prev.user!,
        loginProvider: 'kakao',
        email: 'kakao_user@kakao.com',
      },
    }));

    renderWithProviders(<MyPage />);

    expect(screen.queryByRole('button', { name: /이메일 변경/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /비밀번호 변경/ })).not.toBeInTheDocument();
    expect(screen.getByText('연동된 소셜 계정')).toBeInTheDocument();
    expect(screen.getByText('카카오 로그인')).toBeInTheDocument();
  });

  it('이메일 로그인 유저는 비밀번호 변경 모달을 열어 새 비밀번호를 설정할 수 있어야 한다', async () => {
    useAuthStore.setState((prev) => ({
      ...prev,
      user: {
        ...prev.user!,
        loginProvider: 'email',
        email: 'email_user@dduktak.com',
      },
    }));

    const user = userEvent.setup();

    renderWithProviders(<MyPage />);

    const changePasswordRow = screen.getByRole('button', { name: /비밀번호 변경/ });
    await user.click(changePasswordRow);

    expect(screen.getByRole('heading', { name: '비밀번호 변경' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/8자 이상 영문, 숫자, 특수문자 조합/)).toBeInTheDocument();
  });

  it('마이페이지에서 서비스 이용약관 및 개인정보 처리방침을 클릭하면 모달이 열려야 한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<MyPage />);

    // 서비스 이용약관 클릭
    const termsRow = screen.getByRole('button', { name: /서비스 이용약관/ });
    await user.click(termsRow);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '서비스 이용약관' })).toBeInTheDocument();
    expect(screen.getAllByText(/회원 탈퇴 시 작성하신 레시피는/).length).toBeGreaterThanOrEqual(1);

    // 닫기
    const closeBtn = screen.getByRole('button', { name: '확인 완료' });
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('로그아웃 클릭 시 logout() 호출 및 navigate(/login, { replace: true })로 뒤로가기가 차단되어야 한다 (EDGE-02)', async () => {
    mockNavigate.mockClear();
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState((prev) => ({
      ...prev,
      logout: mockLogout,
    }));

    const user = userEvent.setup();
    renderWithProviders(<MyPage />);

    const logoutRow = screen.getByRole('button', { name: /로그아웃/ });
    await user.click(logoutRow);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });
});
