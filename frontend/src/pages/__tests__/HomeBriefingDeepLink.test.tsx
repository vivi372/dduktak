import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from '@/pages/HomePage';
import RecipeDetailPage from '@/pages/RecipeDetailPage';
import * as homeApi from '@/services/homeApi';
import * as recipeApi from '@/services/recipeApi';
import * as inventoryApi from '@/services/inventoryApi';
import { useAuthStore } from '@/store/useAuthStore';

vi.mock('@/services/homeApi', () => ({
  getHomeBriefing: vi.fn(),
}));

vi.mock('@/services/recipeApi', () => ({
  getRecipeDetail: vi.fn(),
  toggleRecipeLike: vi.fn(),
  toggleRecipeScrap: vi.fn(),
  deleteRecipe: vi.fn(),
}));

vi.mock('@/services/inventoryApi', () => ({
  getMyIngredients: vi.fn(),
}));

function createWrapper(initialEntries = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const mockBriefing = {
  nickname: '자취마스터',
  expiringIngredientsCount: 2,
  imminentIngredients: [
    { ingredientId: 101, name: '대파', dDay: 1 },
    { ingredientId: 102, name: '계란', dDay: 2 },
  ],
  topRecipe: {
    recipeId: 42,
    title: '초간단 파기름 계란볶음밥',
    thumbnailUrl: 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_1.png',
    cookingTime: 15,
    difficulty: '쉬움' as const,
    matchingRate: 95,
  },
};

const mockRecipeDetail = {
  recipeId: 42,
  recipeCategoryId: 1,
  categoryName: '한그릇/밥',
  title: '초간단 파기름 계란볶음밥',
  description: '파기름 향이 솔솔 나는 1인 가구 최애 볶음밥입니다.',
  servings: 1,
  cookingTime: 15,
  difficulty: '쉬움' as const,
  thumbnailUrl: 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_1.png',
  likeCount: 25,
  cookedCount: 10,
  authorNickname: '요리연구가',
  authorTag: '0042',
  isLiked: false,
  isScrapped: false,
  ingredients: [
    {
      recipeIngId: 1,
      masterIngredientId: 2,
      categoryId: 1,
      name: '계란',
      quantity: 2,
      unit: '개',
      typeCode: 'MAIN' as const,
      isOptional: false,
    },
    {
      recipeIngId: 2,
      masterIngredientId: 3,
      categoryId: 1,
      name: '대파',
      quantity: 1,
      unit: '대',
      typeCode: 'MAIN' as const,
      isOptional: false,
    },
  ],
  steps: [
    {
      stepNo: 1,
      description: '대파를 송송 썰어 기름에 볶아 파기름을 냅니다.',
    },
  ],
};

describe('홈 브리핑 - 레시피 상세 딥링크 연계 정합성 단위 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        userId: 'test-user',
        email: 'test@dduktak.com',
        nickname: '자취마스터',
        userTag: '0001',
        profileImage: '',
        status: 'ACTIVE',
        quietTimeStart: '21:00:00',
        quietTimeEnd: '08:00:00',
      },
    });
    vi.mocked(homeApi.getHomeBriefing).mockResolvedValue(mockBriefing);
    vi.mocked(recipeApi.getRecipeDetail).mockResolvedValue(mockRecipeDetail);
    vi.mocked(inventoryApi.getMyIngredients).mockResolvedValue([]);
  });



  it('홈 브리핑 1위 추천 레시피 카드가 정상 렌더링되고 올바른 딥링크 경로(/recipes/:id)를 가져야 한다', async () => {
    render(<HomePage />, { wrapper: createWrapper(['/']) });

    await waitFor(() => {
      expect(screen.getByText('초간단 파기름 계란볶음밥')).toBeInTheDocument();
    });

    // 추천 레시피 카드의 링크 태그 탐색
    const recipeLinks = screen.getAllByRole('link', { name: /초간단 파기름 계란볶음밥/i });
    expect(recipeLinks.length).toBeGreaterThan(0);
    expect(recipeLinks[0]).toHaveAttribute('href', '/recipes/42');
  });

  it('홈 화면에서 1위 추천 레시피 카드 클릭 시 /recipes/42 경로로 딥링크 이동하고 상세 데이터를 정상 렌더링해야 한다', async () => {
    const user = userEvent.setup();

    render(
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
      </Routes>,
      { wrapper: createWrapper(['/']) },
    );

    // 1. 홈 화면 브리핑 1위 추천 레시피 로딩 확인
    await waitFor(() => {
      expect(screen.getByText('초간단 파기름 계란볶음밥')).toBeInTheDocument();
    });

    // 2. 추천 레시피 카드 클릭
    const recipeCardLink = screen.getAllByRole('link', { name: /초간단 파기름 계란볶음밥/i })[0];
    await user.click(recipeCardLink);

    // 3. /recipes/42 레시피 상세 화면 진입 및 데이터 정합성 검증
    await waitFor(() => {
      expect(screen.getByText('파기름 향이 솔솔 나는 1인 가구 최애 볶음밥입니다.')).toBeInTheDocument();
      expect(screen.getByText('대파를 송송 썰어 기름에 볶아 파기름을 냅니다.')).toBeInTheDocument();
    });

    expect(recipeApi.getRecipeDetail).toHaveBeenCalledWith(42);
  });
});
