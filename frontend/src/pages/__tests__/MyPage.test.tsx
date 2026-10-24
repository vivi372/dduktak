import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MyPage from '@/pages/MyPage';
import { useMockAuthStore } from '@/store/mockAuthStore';
import { useNotificationStore } from '@/store/notificationStore';

describe('MyPage 마이페이지 및 설정 단위 테스트', () => {
  beforeEach(() => {
    useMockAuthStore.setState({
      isLoggedIn: true,
      user: {
        userId: '3f7f754c-d561-4b93-b79b-9d73a4f29f2a',
        email: 'user@dduktak.com',
        nickname: '뚝딱이',
        userTag: '1024',
        profileImage: 'https://example.com/profile.png',
        status: 'ACTIVE',
        quietTimeStart: '21:00:00',
        quietTimeEnd: '08:00:00',
      },
    });
    useNotificationStore.getState().resetNotifications();
  });

  it('로그인 상태일 때 프로필(닉네임, #1024 유저태그)과 내 활동 숏컷을 렌더링해야 한다', () => {
    render(
      <MemoryRouter>
        <MyPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('뚝딱이')).toBeInTheDocument();
    expect(screen.getByText('#1024')).toBeInTheDocument();
    expect(screen.getAllByText('user@dduktak.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('내가 쓴 레시피')).toBeInTheDocument();
    expect(screen.getByText('스크랩북')).toBeInTheDocument();
  });

  it('프로필 수정 버튼 클릭 시 ProfileEditModal이 열려야 한다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MyPage />
      </MemoryRouter>,
    );

    const editButton = screen.getByRole('button', { name: '수정' });
    await user.click(editButton);

    expect(screen.getByRole('heading', { name: '프로필 수정' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('뚝딱이')).toBeInTheDocument();
  });

  it('방해금지 시간 행 클릭 시 QuietTimeModal이 열려야 한다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MyPage />
      </MemoryRouter>,
    );

    const quietTimeRow = screen.getByRole('button', { name: /방해금지 시간/ });
    await user.click(quietTimeRow);

    expect(screen.getByRole('heading', { name: '야간 방해금지 시간 설정' })).toBeInTheDocument();
    expect(screen.getAllByText(/야간 푸시 방지 정책에 따라/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: '설정 완료' })).toBeInTheDocument();
  });

  it('알림 토글 스위치 클릭 시 설정 상태가 전환되어야 한다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MyPage />
      </MemoryRouter>,
    );

    const expireToggle = screen.getByRole('switch', { name: '소비기한 임박 알림' });
    expect(expireToggle).toHaveAttribute('aria-checked', 'true');

    await user.click(expireToggle);
    expect(useNotificationStore.getState().settings.isExpireWarnEnabled).toBe(false);
  });

  it('회원 탈퇴 클릭 시 WithdrawModal이 열리고 필수 약관 체크 후 탈퇴 버튼이 활성화되어야 한다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MyPage />
      </MemoryRouter>,
    );

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

    render(
      <MemoryRouter>
        <MyPage />
      </MemoryRouter>,
    );

    const changeEmailRow = screen.getByRole('button', { name: /이메일 변경/ });
    await user.click(changeEmailRow);

    expect(screen.getByRole('heading', { name: '계정 이메일 변경' })).toBeInTheDocument();

    const input = screen.getByPlaceholderText('example@dduktak.com');
    await user.type(input, 'new_user@dduktak.com');

    const submitBtn = screen.getByRole('button', { name: /인증 링크 발송/ });
    await user.click(submitBtn);

    expect(screen.getByText('인증 링크가 발송되었습니다')).toBeInTheDocument();
    expect(screen.getAllByText(/new_user@dduktak.com/).length).toBeGreaterThanOrEqual(1);
  });

  it('소셜 로그인 유저는 이메일 변경 클릭 시 소셜 플랫폼 변경 안내가 노출되어야 한다', async () => {
    useMockAuthStore.setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        loginProvider: 'kakao',
        email: 'kakao_user@kakao.com',
      },
    }));

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MyPage />
      </MemoryRouter>,
    );

    const changeEmailRow = screen.getByRole('button', { name: /이메일 변경/ });
    await user.click(changeEmailRow);

    expect(screen.getByText(/소셜 로그인은 해당 플랫폼/)).toBeInTheDocument();
  });
});
