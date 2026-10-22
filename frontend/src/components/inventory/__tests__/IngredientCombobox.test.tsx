import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IngredientCombobox } from '../IngredientCombobox';

describe('IngredientCombobox 표준 식재료 검색 컴포넌트 단위 테스트', () => {
  it('기본 상태에서는 플레이스홀더 텍스트를 렌더링해야 한다', () => {
    const handleChange = vi.fn();
    render(<IngredientCombobox onChange={handleChange} />);

    expect(screen.getByText('표준 식재료를 검색하여 선택하세요')).toBeInTheDocument();
  });

  it('트리거 버튼 클릭 시 검색창과 카테고리 탭, 식재료 목록이 열려야 한다', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<IngredientCombobox onChange={handleChange} />);

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    expect(screen.getByPlaceholderText(/재료명 검색/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '정육/계란' })).toBeInTheDocument();
  });

  it('검색어 입력 시 일치하는 마스터 재료만 필터링되어야 한다', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<IngredientCombobox onChange={handleChange} />);

    await user.click(screen.getByRole('combobox'));
    const searchInput = screen.getByPlaceholderText(/재료명 검색/);

    await user.type(searchInput, '계란');

    // '계란' 항목은 보여야 하고 '양파'는 목록에서 제외되어야 함
    expect(screen.getByText('계란')).toBeInTheDocument();
    expect(screen.queryByText('양파')).not.toBeInTheDocument();
  });

  it('식재료 항목 클릭 시 onChange 콜백으로 해당 마스터 객체를 전달해야 한다', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<IngredientCombobox onChange={handleChange} />);

    await user.click(screen.getByRole('combobox'));
    const itemBtn = screen.getByText('양파');
    await user.click(itemBtn);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '양파',
        categoryId: 1,
        defaultUnit: '개',
      }),
    );
  });
});
