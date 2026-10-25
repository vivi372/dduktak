import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as recipeApi from '@/services/recipeApi';
import { apiClient } from '@/services/apiClient';
import type { RecipeCreateRequestDto } from '@/types/recipe';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('recipeApi 서비스 단위 테스트 (05_API_SPECIFICATION.md 3.3절)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRecipeCategories는 GET /api/v1/recipes/categories를 호출하고 카테고리 목록을 반환해야 한다', async () => {
    const mockCategories = [
      { recipeCategoryId: 1, categoryName: '국/찌개/탕', displayOrder: 1 },
      { recipeCategoryId: 2, categoryName: '메인반찬', displayOrder: 2 },
    ];

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { success: true, data: mockCategories, message: '성공' },
    });

    const result = await recipeApi.getRecipeCategories();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/recipes/categories');
    expect(result).toEqual(mockCategories);
    expect(result).toHaveLength(2);
  });

  it('getRecipes는 파라미터와 함께 GET /api/v1/recipes를 호출해야 한다', async () => {
    const mockList = {
      recipes: [
        {
          recipeId: 1,
          recipeCategoryId: 1,
          categoryName: '국/찌개/탕',
          title: '김치찌개',
          thumbnailUrl: 'https://example.com/kimchi.jpg',
          cookingTime: 20,
          difficulty: '쉬움' as const,
          likeCount: 5,
          cookedCount: 3,
          authorNickname: '셰프',
          authorTag: '1004',
        },
      ],
      totalPages: 1,
      totalElements: 1,
      currentPage: 0,
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { success: true, data: mockList, message: '성공' },
    });

    const params = { query: '김치', sort: 'latest' as const, page: 0, size: 10 };
    const result = await recipeApi.getRecipes(params);

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/recipes', { params });
    expect(result.recipes).toHaveLength(1);
    expect(result.recipes[0].title).toBe('김치찌개');
  });

  it('getRecipeDetail은 GET /api/v1/recipes/:id를 호출하고 상세 정보를 반환해야 한다', async () => {
    const mockDetail = {
      recipeId: 10,
      recipeCategoryId: 2,
      categoryName: '메인반찬',
      title: '제육볶음',
      description: '매콤달콤 제육',
      servings: 1,
      cookingTime: 15,
      difficulty: '보통' as const,
      thumbnailUrl: 'https://example.com/pork.jpg',
      likeCount: 10,
      cookedCount: 7,
      authorNickname: '제육왕',
      authorTag: '7777',
      isLiked: true,
      isScrapped: false,
      ingredients: [],
      steps: [],
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { success: true, data: mockDetail, message: '성공' },
    });

    const result = await recipeApi.getRecipeDetail(10);

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/recipes/10');
    expect(result.title).toBe('제육볶음');
    expect(result.isLiked).toBe(true);
  });

  it('createRecipe는 POST /api/v1/recipes를 호출하고 생성된 레시피 정보를 반환해야 한다', async () => {
    const dto: RecipeCreateRequestDto = {
      recipeCategoryId: 1,
      title: '새 레시피',
      description: '설명',
      servings: 1,
      cookingTime: 10,
      difficulty: '쉬움',
      ingredients: [
        {
          masterIngredientId: 2,
          categoryId: 2,
          name: '계란',
          quantity: 2,
          unit: '개',
          typeCode: 'MAIN',
          isOptional: false,
        },
      ],
      steps: [{ stepNo: 1, description: '조리 순서' }],
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { success: true, data: { recipeId: 100, title: '새 레시피' }, message: '성공' },
    });

    const result = await recipeApi.createRecipe(dto);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/recipes', dto);
    expect(result.recipeId).toBe(100);
  });

  it('updateRecipe는 PUT /api/v1/recipes/:id를 호출해야 한다', async () => {
    const dto: RecipeCreateRequestDto = {
      recipeCategoryId: 1,
      title: '수정 레시피',
      servings: 1,
      cookingTime: 15,
      difficulty: '보통',
      ingredients: [
        {
          masterIngredientId: 2,
          categoryId: 2,
          name: '계란',
          quantity: 2,
          unit: '개',
          typeCode: 'MAIN',
          isOptional: false,
        },
      ],
      steps: [{ stepNo: 1, description: '수정 순서' }],
    };

    vi.mocked(apiClient.put).mockResolvedValueOnce({
      data: { success: true, data: { recipeId: 100, title: '수정 레시피' }, message: '성공' },
    });

    const result = await recipeApi.updateRecipe(100, dto);

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/recipes/100', dto);
    expect(result.title).toBe('수정 레시피');
  });

  it('deleteRecipe는 DELETE /api/v1/recipes/:id를 호출해야 한다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({
      data: { success: true, data: null, message: '성공' },
    });

    await recipeApi.deleteRecipe(55);

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/recipes/55');
  });

  it('toggleRecipeLike는 POST /api/v1/recipes/:id/like를 호출해야 한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { success: true, data: { liked: true, likeCount: 15 }, message: '성공' },
    });

    const result = await recipeApi.toggleRecipeLike(1);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/recipes/1/like');
    expect(result.liked).toBe(true);
    expect(result.likeCount).toBe(15);
  });

  it('toggleRecipeScrap은 POST /api/v1/recipes/:id/scrap을 호출해야 한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { success: true, data: { scrapped: true }, message: '성공' },
    });

    const result = await recipeApi.toggleRecipeScrap(1);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/recipes/1/scrap');
    expect(result.scrapped).toBe(true);
  });
});
