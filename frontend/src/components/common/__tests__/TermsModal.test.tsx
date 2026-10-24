import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TermsModal } from '@/components/common/TermsModal';

describe('TermsModal 컴포넌트 단위 테스트 (USER-PAGE-05 & USER-02)', () => {
  it('open=true일 때 모달이 렌더링되고 서비스 이용약관 전문 및 레시피 익명 전환 보존 정책이 표시되어야 한다', () => {
    render(<TermsModal open={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '서비스 이용약관' })).toBeInTheDocument();
    expect(screen.getAllByText(/회원 탈퇴 시 작성하신 레시피는/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/양념 및 소스류 카테고리 식재료는 차감 연산 대상에서 자동 제외/)).toBeInTheDocument();
  });

  it('탭 클릭 시 개인정보 처리방침으로 전환되어야 한다', async () => {
    const user = userEvent.setup();
    render(<TermsModal open={true} onClose={vi.fn()} />);

    const privacyTab = screen.getByRole('button', { name: /개인정보 처리방침/ });
    await user.click(privacyTab);

    expect(screen.getByRole('heading', { name: '개인정보 처리방침' })).toBeInTheDocument();
    expect(screen.getByText(/수집하는 개인정보 항목/)).toBeInTheDocument();
  });

  it('확인 완료 버튼 클릭 시 onClose 콜백이 호출되어야 한다', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(<TermsModal open={true} onClose={handleClose} />);

    const confirmBtn = screen.getByRole('button', { name: '확인 완료' });
    await user.click(confirmBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
