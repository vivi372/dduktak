import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeSortDropdown } from '../RecipeSortDropdown';

describe('RecipeSortDropdown 컴포넌트 단위 테스트', () => {
  it('현재 선택된 정렬 라벨을 정상적으로 렌더링해야 한다', () => {
    render(<RecipeSortDropdown value="latest" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /레시피 정렬 순서 선택/ })).toBeInTheDocument();
    expect(screen.getByText('최신순')).toBeInTheDocument();
  });

  it('트리거 버튼 클릭 시 팝오버 메뉴가 열리고 정렬 옵션 목록이 노출되어야 한다', () => {
    render(<RecipeSortDropdown value="latest" onChange={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /레시피 정렬 순서 선택/ });
    fireEvent.click(trigger);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('매칭률순')).toBeInTheDocument();
    expect(screen.getByText('인기순 (좋아요)')).toBeInTheDocument();
    expect(screen.getByText('요리완료순')).toBeInTheDocument();
    expect(screen.getByText('조리시간 단축순')).toBeInTheDocument();
  });

  it('옵션 클릭 시 onChange 콜백이 해당 정렬 옵션으로 호출되어야 한다', () => {
    const handleChange = vi.fn();
    render(<RecipeSortDropdown value="latest" onChange={handleChange} />);

    fireEvent.click(screen.getByRole('button', { name: /레시피 정렬 순서 선택/ }));
    fireEvent.click(screen.getByText('매칭률순'));

    expect(handleChange).toHaveBeenCalledWith('matching');
  });

  it('ESC 키를 누르면 열린 드롭다운이 닫혀야 한다', () => {
    render(<RecipeSortDropdown value="latest" onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /레시피 정렬 순서 선택/ }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
