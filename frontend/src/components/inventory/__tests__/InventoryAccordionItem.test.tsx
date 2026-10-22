import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryAccordionItem } from '../InventoryAccordionItem';
import type { GroupedInventoryItem } from '@/types/inventory';

describe('InventoryAccordionItem 2-Tier 아코디언 컴포넌트 단위 테스트', () => {
  const mockGroup: GroupedInventoryItem = {
    masterIngredientId: 18,
    name: '계란',
    categoryId: 2,
    categoryName: '정육/계란',
    storageType: 'REFRIGERATED',
    totalQuantity: 25,
    primaryUnit: '개',
    mostUrgentDDay: 2, // D-2 (가장 임박)
    items: [
      {
        ingredientId: 101,
        masterIngredientId: 18,
        categoryId: 2,
        name: '계란',
        storageType: 'REFRIGERATED',
        quantity: 10,
        unit: '개',
        expireDate: '2026-10-24',
        dDay: 2,
        memo: '편의점 1+1 행사',
      },
      {
        ingredientId: 102,
        masterIngredientId: 18,
        categoryId: 2,
        name: '계란',
        storageType: 'REFRIGERATED',
        quantity: 15,
        unit: '개',
        expireDate: '2026-11-09',
        dDay: 18,
      },
    ],
  };

  it('1차 대표 카드에서 재료명, 총 수량, 가장 임박한 D-Day 배지를 렌더링해야 한다', () => {
    render(
      <InventoryAccordionItem
        group={mockGroup}
        onConsume={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: '계란' })).toBeInTheDocument();
    expect(screen.getByText(/총 25 개/)).toBeInTheDocument();
    expect(screen.getByText('2개 보관 중')).toBeInTheDocument();
    // 가장 임박한 D-2 배지
    expect(screen.getByText('소비기한 2일 남음')).toBeInTheDocument();
  });

  it('대표 카드를 클릭하면 2-Tier 아코디언이 펼쳐져 개별 인스턴스와 메모가 노출되어야 한다', async () => {
    const user = userEvent.setup();
    render(
      <InventoryAccordionItem
        group={mockGroup}
        onConsume={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    // 기본 상태에서는 개별 인스턴스 정보가 보이지 않음
    expect(screen.queryByText(/편의점 1\+1 행사/)).not.toBeInTheDocument();

    // 대표 카드 클릭
    const toggleButton = screen.getByRole('button', { expanded: false });
    await user.click(toggleButton);

    // 아코디언 열림 확인
    expect(screen.getByText(/편의점 1\+1 행사/)).toBeInTheDocument();
    expect(screen.getByText(/1. 10 개/)).toBeInTheDocument();
    expect(screen.getByText(/2. 15 개/)).toBeInTheDocument();
  });

  it('아코디언 내부에서 소비 버튼 클릭 시 onConsume 콜백이 호출되어야 한다', async () => {
    const user = userEvent.setup();
    const handleConsume = vi.fn();

    render(
      <InventoryAccordionItem
        group={mockGroup}
        onConsume={handleConsume}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { expanded: false }));

    const consumeBtn = screen.getAllByRole('button', { name: '계란 소비' })[0];
    await user.click(consumeBtn);

    expect(handleConsume).toHaveBeenCalledWith(mockGroup.items[0]);
  });
});

