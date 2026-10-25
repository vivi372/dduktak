import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMatchingRecommendations, useCookRecipe } from '@/hooks/useMatching';
import * as matchingApi from '@/services/matchingApi';

vi.mock('@/services/matchingApi', () => ({
  getMatchingRecommendations: vi.fn(),
  cookRecipe: vi.fn(),
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

describe('useMatching React Query 훅 단위 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useMatchingRecommendations는 맞춤 추천 레시피 목록을 정상 반환해야 한다', async () => {
    const mockRecommendations = [
      {
        recipeId: 1,
        title: '계란볶음밥',
        thumbnailUrl: 'https://example.com/egg.jpg',
        cookingTime: 15,
        difficulty: '쉬움',
        matchingRate: 85,
        matchIngredients: ['계란'],
        missingIngredients: ['밥'],
      },
    ];
    vi.mocked(matchingApi.getMatchingRecommendations).mockResolvedValueOnce(mockRecommendations);

    const { result } = renderHook(() => useMatchingRecommendations({ recipeCategoryId: 4 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRecommendations);
    expect(result.current.data?.[0].matchingRate).toBe(85);
  });

  it('useCookRecipe는 요리완료 및 FIFO 차감 뮤테이션을 실행해야 한다', async () => {
    const mockCookResult = {
      recipeId: 1,
      isDeducted: true,
      cookedCount: 7,
      deductedIngredients: [
        {
          name: '계란',
          deductedQuantity: 2,
          remainingQuantity: 3,
        },
      ],
    };
    vi.mocked(matchingApi.cookRecipe).mockResolvedValueOnce(mockCookResult);

    const { result } = renderHook(() => useCookRecipe(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      recipeId: 1,
      dto: { deductInventory: true, servings: 2 },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(matchingApi.cookRecipe).toHaveBeenCalledWith(1, {
      deductInventory: true,
      servings: 2,
    });
    expect(result.current.data?.isDeducted).toBe(true);
    expect(result.current.data?.cookedCount).toBe(7);
  });
});
