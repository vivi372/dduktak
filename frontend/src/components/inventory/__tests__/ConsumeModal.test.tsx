import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsumeModal } from '../ConsumeModal';
import type { InventoryItem } from '@/types/inventory';

describe('ConsumeModal 수동 소비 차감 팝업 단위 테스트', () => {
  const mockItem: InventoryItem = {
    ingredientId: 101,
    masterIngredientId: 18,
    categoryId: 2,
    name: '계란',
    storageType: 'REFRIGERATED',
    quantity: 5,
    unit: '개',
    expireDate: '2026-10-24',
    dDay: 2,
  };

  it('대상 식재료명과 현재 보유 수량을 정확히 표시해야 한다', () => {
    render(<ConsumeModal item={mockItem} onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole('heading', { name: '재료 소비 완료' })).toBeInTheDocument();
    expect(screen.getByText('현재 보유 수량')).toBeInTheDocument();
    expect(screen.getByText('5 개')).toBeInTheDocument();
  });

  it('보유 수량(5개)을 초과하는 숫자(6개) 입력 시 경고 메시지가 노출되고 제출 버튼이 비활성화되어야 한다', async () => {
    const user = userEvent.setup();
    render(<ConsumeModal item={mockItem} onClose={vi.fn()} onConfirm={vi.fn()} />);

    const input = screen.getByLabelText(/소비할 수량을 입력하세요/);
    await user.clear(input);
    await user.type(input, '6');

    // 경고 문구 확인 (06_UI_UX_GUIDELINES 4.7절)
    expect(screen.getByText('현재 보유 수량(5 개) 이하로 입력해 주세요.')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: '소비 완료' });
    expect(submitBtn).toBeDisabled();
  });

  it('정상 수량(3개) 입력 후 제출 시 onConfirm 콜백으로 차감 수량이 전달되어야 한다', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(<ConsumeModal item={mockItem} onClose={handleClose} onConfirm={handleConfirm} />);

    const input = screen.getByLabelText(/소비할 수량을 입력하세요/);
    await user.clear(input);
    await user.type(input, '3');

    const submitBtn = screen.getByRole('button', { name: '소비 완료' });
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);

    expect(handleConfirm).toHaveBeenCalledWith(mockItem, 3);
    expect(handleClose).toHaveBeenCalled();
  });
});
