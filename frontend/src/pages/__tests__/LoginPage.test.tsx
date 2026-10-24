import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '@/pages/LoginPage';

// sonner toast 모킹
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function renderLoginPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage 통합 인증 화면 단위 테스트', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('기본 모드에서 브랜드 로고와 소셜 로그인 버튼 2종을 렌더링해야 한다', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { level: 1, name: '오늘의 뚝딱' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /카카오로 3초 만에 시작하기/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Google 계정으로 시작하기/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /이메일로 로그인 \/ 회원가입/ })).toBeInTheDocument();
  });

  it('이메일 버튼 클릭 시 이메일 로그인 폼으로 전환되어야 한다', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailModeBtn = screen.getByRole('button', { name: /이메일로 로그인 \/ 회원가입/ });
    await user.click(emailModeBtn);

    expect(screen.getByRole('button', { name: '로그인하기' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '간편 로그인으로' })).toBeInTheDocument();
  });

  it('회원가입 탭 클릭 시 닉네임 입력 필드가 포함된 회원가입 폼으로 전환되어야 한다', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // 이메일 모드로 전환
    await user.click(screen.getByRole('button', { name: /이메일로 로그인 \/ 회원가입/ }));

    // 회원가입 탭 클릭
    const signupTab = screen.getByRole('button', { name: '회원가입' });
    await user.click(signupTab);

    expect(screen.getByPlaceholderText('뚝딱셰프')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '회원가입 완료' })).toBeInTheDocument();
  });

  it('"간편 로그인으로" 버튼 클릭 시 다시 소셜 뷰로 돌아와야 한다', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: /이메일로 로그인 \/ 회원가입/ }));
    await user.click(screen.getByRole('button', { name: '간편 로그인으로' }));

    expect(screen.getByRole('button', { name: /카카오로 3초 만에 시작하기/ })).toBeInTheDocument();
  });

  it('"비밀번호를 잊으셨나요?" 클릭 시 비밀번호 입력 필드가 사라지고 비밀번호 찾기 폼이 나타나야 한다', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // 이메일 로그인 폼으로 진입
    await user.click(screen.getByRole('button', { name: /이메일로 로그인 \/ 회원가입/ }));

    // "비밀번호를 잊으셨나요?" 클릭
    const forgotBtn = screen.getByRole('button', { name: '비밀번호를 잊으셨나요?' });
    await user.click(forgotBtn);

    // 비밀번호 입력창(placeholder: ••••••••)이 DOM에서 완전히 사라져야 함
    expect(screen.queryByPlaceholderText('••••••••')).not.toBeInTheDocument();

    // 비밀번호 찾기 타이틀과 재설정 링크 발송 버튼 노출 확인
    expect(screen.getByRole('heading', { level: 2, name: '비밀번호 찾기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '재설정 링크 발송하기' })).toBeInTheDocument();

    // "로그인으로 돌아가기" 클릭 시 다시 로그인 폼으로 복귀
    await user.click(screen.getByRole('button', { name: '← 로그인으로 돌아가기' }));
    expect(screen.getByRole('button', { name: '로그인하기' })).toBeInTheDocument();
  });

  it('소셜 로그인 화면에 이용약관 안내가 노출되고, 회원가입 시 필수 약관 체크박스가 렌더링되어야 한다', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // 소셜 뷰에서 서비스 이용약관 텍스트 확인
    expect(screen.getByRole('button', { name: '서비스 이용약관' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '개인정보 처리방침' })).toBeInTheDocument();
    expect(
      screen.getByText(/회원 탈퇴 시 작성하신 레시피는 커뮤니티 생태계 보존을 위해 익명으로 전환되어 보존됩니다/),
    ).toBeInTheDocument();

    // 회원가입 모드로 이동
    await user.click(screen.getByRole('button', { name: /이메일로 로그인 \/ 회원가입/ }));
    await user.click(screen.getByRole('button', { name: '회원가입' }));

    // 필수 약관 체크박스 2종 노출 확인
    expect(
      screen.getByText(/\[필수\] 서비스 이용약관 및 개인정보 동의/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/\[필수\] 회원 탈퇴 시 레시피 익명 전환 보존 동의/),
    ).toBeInTheDocument();
  });
});
