import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ManualAddModal } from '../ManualAddModal';

// framer-motion 모킹
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe('ManualAddModal 단위 테스트 (EDGE-01: 폼 상태 오염 방어)', () => {
  it('모달을 닫았다가 다시 열었을 때 이전 입력값(수량, 메모 등)이 초기화되어야 한다', async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();
    const handleClose = vi.fn();

    // 1. 모달 처음 열림
    const { rerender } = renderWithClient(
      <ManualAddModal open={true} onClose={handleClose} onAdd={handleAdd} />,
    );

    // 메모 입력
    const memoInput = screen.getByPlaceholderText('예: 편의점 1+1, 엄마가 준 김치');
    await user.type(memoInput, '오염 테스트 메모');
    expect(memoInput).toHaveValue('오염 테스트 메모');

    // 2. 모달 닫힘 (open=false)
    rerender(
      <ManualAddModal open={false} onClose={handleClose} onAdd={handleAdd} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // 3. 모달 다시 열림 (open=true)
    rerender(
      <ManualAddModal open={true} onClose={handleClose} onAdd={handleAdd} />,
    );

    // 메모 필드가 빈 문자열로 초기화되었는지 검증 (EDGE-01 방어 확인)
    const resetMemoInput = screen.getByPlaceholderText('예: 편의점 1+1, 엄마가 준 김치');
    expect(resetMemoInput).toHaveValue('');
  });

  it('기본 수량은 1이어야 하며 + / - 버튼으로 조절할 수 있어야 한다', () => {
    renderWithClient(
      <ManualAddModal open={true} onClose={vi.fn()} onAdd={vi.fn()} />,
    );

    const quantityInput = screen.getByDisplayValue('1');
    expect(quantityInput).toBeInTheDocument();

    const plusBtn = screen.getByRole('button', { name: '1개 증가' });
    fireEvent.click(plusBtn);

    expect(screen.getByDisplayValue('2')).toBeInTheDocument();

    const minusBtn = screen.getByRole('button', { name: '1개 감소' });
    fireEvent.click(minusBtn);

    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });
});
