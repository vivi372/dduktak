import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalErrorModal } from '@/components/common/GlobalErrorModal';
import { useErrorModalStore } from '@/store/useErrorModalStore';

describe('GlobalErrorModal 전역 에러 모달 단위 테스트 (02_ARCHITECTURE_AND_CONVENTIONS 5.4)', () => {
  beforeEach(() => {
    act(() => {
      useErrorModalStore.getState().closeModal();
    });
  });

  it('isOpen이 false일 때는 아무것도 렌더링하지 않아야 한다', () => {
    const { container } = render(<GlobalErrorModal />);
    expect(container.firstChild).toBeNull();
  });

  it('ALERT 모달 오픈 시 안내 타이틀, 메시지, X-Trace-Id 식별 코드를 표시하고 확인 버튼 1개만 렌더링해야 한다', async () => {
    const user = userEvent.setup();
    const onConfirmSpy = vi.fn();

    render(<GlobalErrorModal />);

    act(() => {
      useErrorModalStore.getState().openAlert({
        title: '주의 안내',
        message: '일시적인 네트워크 지연입니다.',
        traceId: 'e4a3f1',
        onConfirm: onConfirmSpy,
      });
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('주의 안내')).toBeInTheDocument();
    expect(screen.getByText('일시적인 네트워크 지연입니다.')).toBeInTheDocument();
    expect(screen.getByText('e4a3f1')).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: '확인' });
    expect(confirmButton).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument();

    await user.click(confirmButton);
    expect(onConfirmSpy).toHaveBeenCalledTimes(1);
    expect(useErrorModalStore.getState().isOpen).toBe(false);
  });

  it('CONFIRM 모달 오픈 시 확인과 취소 버튼 2개를 렌더링하고 취소 클릭 시 모달이 닫혀야 한다', async () => {
    const user = userEvent.setup();
    const onCancelSpy = vi.fn();

    render(<GlobalErrorModal />);

    act(() => {
      useErrorModalStore.getState().openConfirm({
        title: '삭제 확인',
        message: '재료를 삭제하시겠습니까?',
        traceId: 'trace-del-1',
        onCancel: onCancelSpy,
      });
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    const cancelButton = screen.getByRole('button', { name: '취소' });
    expect(cancelButton).toBeInTheDocument();

    await user.click(cancelButton);
    expect(onCancelSpy).toHaveBeenCalledTimes(1);
    expect(useErrorModalStore.getState().isOpen).toBe(false);
  });

  it('FATAL 모달 오픈 시 다시 시도 버튼을 누르면 onRetry가 실행되어야 한다', async () => {
    const user = userEvent.setup();
    const onRetrySpy = vi.fn();

    render(<GlobalErrorModal />);

    act(() => {
      useErrorModalStore.getState().openFatal({
        title: '시스템 장애',
        message: '서버와 연결할 수 없습니다.',
        traceId: 'fatal-999',
        onRetry: onRetrySpy,
      });
    });

    const retryButton = screen.getByRole('button', { name: '다시 시도' });
    expect(retryButton).toBeInTheDocument();

    await user.click(retryButton);
    expect(onRetrySpy).toHaveBeenCalledTimes(1);
    expect(useErrorModalStore.getState().isOpen).toBe(false);
  });
});
