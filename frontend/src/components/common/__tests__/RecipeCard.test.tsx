import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecipeCard } from '@/components/common/RecipeCard';
import type { RecipeSummary } from '@/types/recipe';

const mockRecipe: RecipeSummary = {
  recipeId: 101,
  recipeCategoryId: 1,
  categoryName: '한식',
  title: '뚝딱 김치볶음밥',
  thumbnailUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80',
  cookingTime: 15,
  difficulty: '쉬움',
  likeCount: 42,
  cookedCount: 18,
  authorNickname: '뚝딱요리사',
  authorTag: '1234',
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('RecipeCard 컴포넌트 단위 테스트', () => {
  it('레시피 제목과 카테고리를 렌더링해야 한다', () => {
    renderWithRouter(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('뚝딱 김치볶음밥')).toBeInTheDocument();
    expect(screen.getByText('한식')).toBeInTheDocument();
  });

  it('기본(list) 모드에서 작성자 닉네임과 태그가 표시되어야 한다', () => {
    renderWithRouter(<RecipeCard recipe={mockRecipe} variant="list" />);
    expect(screen.getByText('뚝딱요리사#1234')).toBeInTheDocument();
  });

  it('작성자가 null일 때 관리자로 표시되어야 한다', () => {
    const anonymousRecipe = { ...mockRecipe, authorNickname: null, authorTag: null };
    renderWithRouter(<RecipeCard recipe={anonymousRecipe} variant="list" />);
    expect(screen.getByText('관리자')).toBeInTheDocument();
  });

  it('조리 시간, 난이도, 좋아요/요리완료 수가 표시되어야 한다', () => {
    renderWithRouter(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText(/15분/)).toBeInTheDocument();
    expect(screen.getByText('쉬움')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('matchingRate prop이 전달되면 매칭률 배지를 노출해야 한다', () => {
    renderWithRouter(<RecipeCard recipe={mockRecipe} matchingRate={85} />);
    expect(screen.getByText(/85% 뚝딱 매칭/)).toBeInTheDocument();
  });

  it('matchingRate prop이 없으면 매칭률 배지를 노출하지 않아야 한다', () => {
    renderWithRouter(<RecipeCard recipe={mockRecipe} />);
    expect(screen.queryByText(/뚝딱 매칭/)).not.toBeInTheDocument();
  });

  it('variant="carousel" 모드에서도 제목과 매칭률이 올바르게 렌더링되어야 한다', () => {
    renderWithRouter(<RecipeCard recipe={mockRecipe} variant="carousel" matchingRate={100} />);
    expect(screen.getByText('뚝딱 김치볶음밥')).toBeInTheDocument();
    expect(screen.getByText(/100% 뚝딱 매칭/)).toBeInTheDocument();
  });
});
