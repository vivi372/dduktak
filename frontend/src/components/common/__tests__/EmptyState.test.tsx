import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

describe('EmptyState 컴포넌트 단위 테스트', () => {
  it('이모지와 제목을 올바르게 렌더링해야 한다', () => {
    render(<EmptyState emoji="🧊" title="냉장고가 텅 비었어요" />);
    expect(screen.getByText('🧊')).toBeInTheDocument();
    expect(screen.getByText('냉장고가 텅 비었어요')).toBeInTheDocument();
  });

  it('설명 문구가 주어졌을 때 설명을 렌더링해야 한다', () => {
    render(
      <EmptyState
        emoji="🍳"
        title="레시피가 없습니다"
        description="새로운 요리를 등록해보세요!"
      />,
    );
    expect(screen.getByText('새로운 요리를 등록해보세요!')).toBeInTheDocument();
  });

  it('children으로 전달된 액션 버튼을 렌더링해야 한다', () => {
    render(
      <EmptyState emoji="🥕" title="재료를 추가해보세요">
        <Button>재료 등록하기</Button>
      </EmptyState>,
    );
    expect(screen.getByRole('button', { name: '재료 등록하기' })).toBeInTheDocument();
  });
});
