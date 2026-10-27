import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeDeleteModal } from '../RecipeDeleteModal';

describe('RecipeDeleteModal 레시피 삭제 전용 2차 확인 모달 단위 테스트', () => {
  it('isOpen이 false이면 모달이 렌더링되지 않아야 한다', () => {
    const { container } = render(
      <RecipeDeleteModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        recipeTitle="김치볶음밥"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('isOpen이 true이면 레시피 제목과 경고 문구가 정상적으로 표시되어야 한다', () => {
    render(
      <RecipeDeleteModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        recipeTitle="김치볶음밥"
      />,
    );

    expect(screen.getByText('레시피를 삭제하시겠어요?')).toBeInTheDocument();
    expect(screen.getByText(/'김치볶음밥'/)).toBeInTheDocument();
    expect(screen.getByText(/삭제된 레시피는 다시 복구할 수 없어요/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제하기' })).toBeInTheDocument();
  });

  it('취소 버튼을 클릭하면 onClose 콜백이 호출되어야 한다', () => {
    const handleClose = vi.fn();
    render(
      <RecipeDeleteModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        recipeTitle="김치볶음밥"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('삭제하기 버튼을 클릭하면 onConfirm 콜백이 호출되어야 한다', () => {
    const handleConfirm = vi.fn();
    render(
      <RecipeDeleteModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        recipeTitle="김치볶음밥"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '삭제하기' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('isDeleting이 true이면 삭제 중 텍스트와 비활성화 상태가 되어야 한다', () => {
    render(
      <RecipeDeleteModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isDeleting={true}
        recipeTitle="김치볶음밥"
      />,
    );

    expect(screen.getByText('삭제 중...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /삭제 중/ })).toBeDisabled();
  });
});
