import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as homeApi from '@/services/homeApi';
import { apiClient } from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('homeApi 서비스 단위 테스트 (05_API_SPECIFICATION.md 3.6절)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getHomeBriefing은 GET /api/v1/home/briefing을 호출하고 메인 브리핑 데이터를 반환해야 한다', async () => {
    const mockBriefingData = {
      nickname: '뚝딱이',
      expiringIngredientsCount: 2,
      imminentIngredients: [
        { ingredientId: 10, name: '계란', dDay: 2 },
        { ingredientId: 11, name: '양파', dDay: 3 },
      ],
      topRecipe: {
        recipeId: 1,
        title: '계란볶음밥',
        thumbnailUrl: 'https://example.com/egg-rice.jpg',
        cookingTime: 15,
        difficulty: '쉬움',
        matchingRate: 90,
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: mockBriefingData,
        message: '메인 화면 종합 브리핑 조회가 완료되었습니다.',
      },
    });

    const result = await homeApi.getHomeBriefing();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/home/briefing');
    expect(result).toEqual(mockBriefingData);
    expect(result.expiringIngredientsCount).toBe(2);
    expect(result.imminentIngredients).toHaveLength(2);
    expect(result.topRecipe?.matchingRate).toBe(90);
  });
});
