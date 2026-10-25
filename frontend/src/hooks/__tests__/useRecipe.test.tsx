import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useRecipeCategories,
  useRecipes,
  useRecipeDetail,
  useCreateRecipe,
  useToggleRecipeLike,
} from '@/hooks/useRecipe';
import * as recipeApi from '@/services/recipeApi';

vi.mock('@/services/recipeApi', () => ({
  getRecipeCategories: vi.fn(),
  getRecipes: vi.fn(),
  getRecipeDetail: vi.fn(),
  createRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
  toggleRecipeLike: vi.fn(),
  toggleRecipeScrap: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useRecipe React Query 훅 단위 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useRecipeCategories는 카테고리 목록을 성공적으로 반환해야 한다', async () => {
    const mockCategories = [
      { recipeCategoryId: 1, categoryName: '국/찌개/탕', displayOrder: 1 },
    ];
    vi.mocked(recipeApi.getRecipeCategories).mockResolvedValueOnce(mockCategories);

    const { result } = renderHook(() => useRecipeCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockCategories);
    });
  });


  it('useRecipes는 레시피 목록 페이징 데이터를 정상 조회해야 한다', async () => {
    const mockList = {
      recipes: [
        {
          recipeId: 1,
          recipeCategoryId: 1,
          categoryName: '국/찌개/탕',
          title: '된장찌개',
          thumbnailUrl: 'https://example.com/soup.jpg',
          cookingTime: 20,
          difficulty: '쉬움' as const,
          likeCount: 10,
          cookedCount: 5,
          authorNickname: '요리왕',
          authorTag: '1234',
        },
      ],
      totalPages: 1,
      totalElements: 1,
      currentPage: 0,
    };
    vi.mocked(recipeApi.getRecipes).mockResolvedValueOnce(mockList);

    const { result } = renderHook(() => useRecipes({ page: 0, size: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.recipes).toHaveLength(1);
    expect(result.current.data?.recipes[0].title).toBe('된장찌개');
  });

  it('useRecipeDetail은 특정 레시피의 상세 정보를 정상 조회해야 한다', async () => {
    const mockDetail = {
      recipeId: 7,
      recipeCategoryId: 1,
      categoryName: '국/찌개/탕',
      title: '순두부찌개',
      servings: 1,
      cookingTime: 15,
      difficulty: '쉬움' as const,
      thumbnailUrl: '',
      likeCount: 3,
      cookedCount: 1,
      authorNickname: '찌개러버',
      authorTag: '9999',
      ingredients: [],
      steps: [],
    };
    vi.mocked(recipeApi.getRecipeDetail).mockResolvedValueOnce(mockDetail);

    const { result } = renderHook(() => useRecipeDetail(7), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.title).toBe('순두부찌개');
  });

  it('useCreateRecipe는 신규 레시피 등록 뮤테이션을 실행해야 한다', async () => {
    vi.mocked(recipeApi.createRecipe).mockResolvedValueOnce({
      recipeId: 99,
      title: '새로 등록한 요리',
    });

    const { result } = renderHook(() => useCreateRecipe(), {
      wrapper: createWrapper(),
    });

    const dto = {
      recipeCategoryId: 1,
      title: '새로 등록한 요리',
      servings: 1,
      cookingTime: 10,
      difficulty: '쉬움' as const,
      ingredients: [],
      steps: [],
    };

    result.current.mutate(dto);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(recipeApi.createRecipe).toHaveBeenCalledWith(dto);
  });

  it('useToggleRecipeLike는 좋아요 토글 뮤테이션을 실행해야 한다', async () => {
    vi.mocked(recipeApi.toggleRecipeLike).mockResolvedValueOnce({
      liked: true,
      likeCount: 20,
    });

    const { result } = renderHook(() => useToggleRecipeLike(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(recipeApi.toggleRecipeLike).toHaveBeenCalledWith(1);
  });
});
