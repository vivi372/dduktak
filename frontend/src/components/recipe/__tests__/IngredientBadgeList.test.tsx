import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IngredientBadgeList } from '../IngredientBadgeList';
import type { IngredientMatchStatus } from '@/types/matching';

describe('IngredientBadgeList 컴포넌트 단위 테스트', () => {
  const mockStatuses: IngredientMatchStatus[] = [
    {
      masterIngredientId: 1,
      name: '돼지고기 (삼겹살/목살)',
      typeCode: 'MAIN',
      requiredQuantity: 200,
      ownedQuantity: 300,
      deficitQuantity: 0,
      unit: 'g',
      status: 'OWNED',
      hasAlternative: false,
      isOptional: false,
      altIngredientName: null,
    },
    {
      masterIngredientId: 2,
      name: '대파',
      typeCode: 'SUB',
      requiredQuantity: 1,
      ownedQuantity: 0,
      deficitQuantity: 1,
      unit: '대',
      status: 'DEFICIENT',
      hasAlternative: true,
      altIngredientName: '양파',
      isOptional: true,
    },
  ];

  it('주재료와 부재료 항목을 정상적으로 그룹화하여 렌더링해야 한다', () => {
    render(<IngredientBadgeList ingredientStatuses={mockStatuses} />);

    expect(screen.getByText('주재료')).toBeInTheDocument();
    expect(screen.getByText(/요리의 핵심 재료/)).toBeInTheDocument();
    expect(screen.getByText('돼지고기 (삼겹살/목살)')).toBeInTheDocument();

    expect(screen.getByText('부재료')).toBeInTheDocument();
    expect(screen.getByText(/풍미 및 부가 재료/)).toBeInTheDocument();
    expect(screen.getByText('대파')).toBeInTheDocument();
  });

  it('생략 가능한 재료에는 [생략 가능] 배지가 명확하게 표기되어야 한다', () => {
    render(<IngredientBadgeList ingredientStatuses={mockStatuses} />);

    expect(screen.getByText('생략 가능')).toBeInTheDocument();
  });

  it('대체 재료가 등록된 품목에는 [양파 대체 가능] 배지가 명확하게 표기되어야 한다', () => {
    render(<IngredientBadgeList ingredientStatuses={mockStatuses} />);

    expect(screen.getByText('양파 대체 가능')).toBeInTheDocument();
  });
});
