import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QuickAddTray } from '../QuickAddTray';

// framer-motion 애니메이션 모킹
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('QuickAddTray 바텀시트 단위 테스트 (EDGE-04)', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  it('open이 true일 때 바텀시트가 렌더링되고 document.body.style.overflow가 hidden이어야 한다', () => {
    const { unmount } = render(
      <BrowserRouter>
        <QuickAddTray open={true} onClose={vi.fn()} />
      </BrowserRouter>,
    );

    expect(screen.getByRole('dialog', { name: '재료 추가 방법 선택' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('open이 false일 때 바텀시트가 렌더링되지 않아야 한다', () => {
    render(
      <BrowserRouter>
        <QuickAddTray open={false} onClose={vi.fn()} />
      </BrowserRouter>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('액션 항목을 클릭하면 onSelectAction이 호출되고 닫혀야 한다', () => {
    const handleClose = vi.fn();
    const handleSelectAction = vi.fn();

    render(
      <BrowserRouter>
        <QuickAddTray open={true} onClose={handleClose} onSelectAction={handleSelectAction} />
      </BrowserRouter>,
    );

    const manualButton = screen.getByText('직접 입력').closest('button');
    expect(manualButton).toBeInTheDocument();

    fireEvent.click(manualButton!);
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleSelectAction).toHaveBeenCalledWith('manual');
  });
});
