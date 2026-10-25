import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as matchingApi from '@/services/matchingApi';
import { apiClient } from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('matchingApi 서비스 단위 테스트 (05_API_SPECIFICATION.md 3.4절)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMatchingRecommendations는 GET /api/v1/matching/recommendations를 호출하고 추천 레시피 목록을 반환해야 한다', async () => {
    const mockRecommendations = [
      {
        recipeId: 1,
        title: '계란볶음밥',
        thumbnailUrl: 'https://example.com/egg-rice.jpg',
        cookingTime: 15,
        difficulty: '쉬움',
        matchingRate: 85,
        matchIngredients: ['계란', '대파'],
        missingIngredients: ['찬밥'],
      },
    ];

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { success: true, data: mockRecommendations, message: '성공' },
    });

    const params = { recipeCategoryId: 4, page: 0, size: 10 };
    const result = await matchingApi.getMatchingRecommendations(params);

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/matching/recommendations', { params });
    expect(result).toHaveLength(1);
    expect(result[0].matchingRate).toBe(85);
    expect(result[0].matchIngredients).toContain('계란');
  });

  it('cookRecipe는 POST /api/v1/matching/cook/:id를 호출하고 요리완료 및 차감 결과를 반환해야 한다', async () => {
    const mockCookResponse = {
      recipeId: 1,
      isDeducted: true,
      cookedCount: 6,
      deductedIngredients: [
        {
          name: '계란',
          deductedQuantity: 2,
          remainingQuantity: 8,
        },
      ],
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { success: true, data: mockCookResponse, message: '성공' },
    });

    const reqDto = { deductInventory: true, servings: 2 };
    const result = await matchingApi.cookRecipe(1, reqDto);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/matching/cook/1', reqDto);
    expect(result.isDeducted).toBe(true);
    expect(result.cookedCount).toBe(6);
    expect(result.deductedIngredients[0].name).toBe('계란');
  });

  it('cookRecipe 호출 시 dto를 생략하면 기본값(deductInventory: true, servings: 1)으로 요청해야 한다', async () => {
    const mockCookResponse = {
      recipeId: 2,
      isDeducted: true,
      cookedCount: 1,
      deductedIngredients: [],
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { success: true, data: mockCookResponse, message: '성공' },
    });

    await matchingApi.cookRecipe(2);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/matching/cook/2', {
      deductInventory: true,
      servings: 1,
    });
  });
});
