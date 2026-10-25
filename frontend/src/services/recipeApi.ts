/**
 * 뚝딱 레시피 커뮤니티(Recipe) 도메인 API 클라이언트 (05_API_SPECIFICATION.md 3.3절)
 *
 * 8대 카테고리 조회, 레시피 목록 페이징/검색/필터, 상세 조회, 등록, 수정, 삭제,
 * 그리고 좋아요 및 스크랩 토글 통신을 담당합니다.
 */

import { apiClient } from '@/services/apiClient';
import type { ApiResponseDto } from '@/types/auth';
import type {
  RecipeCategoryResponseDto,
  RecipeListQueryParams,
  RecipeListResponseDto,
  RecipeDetailResponseDto,
  RecipeCreateRequestDto,
  RecipeSimpleResponseDto,
  RecipeLikeResponseDto,
  RecipeScrapResponseDto,
} from '@/types/recipe';

/**
 * 레시피 8대 카테고리 목록 조회 (GET /api/v1/recipes/categories)
 *
 * @returns 8대 카테고리 목록
 */
export async function getRecipeCategories(): Promise<RecipeCategoryResponseDto[]> {
  const response = await apiClient.get<ApiResponseDto<RecipeCategoryResponseDto[]>>(
    '/api/v1/recipes/categories',
  );
  return response.data.data;
}

/**
 * 레시피 목록 페이징/검색/필터 조회 (GET /api/v1/recipes)
 *
 * @param params 검색어(query), 필터(filter: ALL, MY, SCRAP), 카테고리(recipeCategoryId), 정렬(sort: latest, like, cooked), page, size
 * @returns 레시피 목록 및 페이징 정보
 */
export async function getRecipes(
  params?: RecipeListQueryParams,
): Promise<RecipeListResponseDto> {
  const response = await apiClient.get<ApiResponseDto<RecipeListResponseDto>>(
    '/api/v1/recipes',
    { params },
  );
  return response.data.data;
}

/**
 * 레시피 상세 정보 조회 (GET /api/v1/recipes/:recipeId)
 *
 * @param recipeId 레시피 ID
 * @returns 레시피 상세 정보 (기본 정보, 작성자, 재료 목록, 조리 단계 등)
 */
export async function getRecipeDetail(
  recipeId: number,
): Promise<RecipeDetailResponseDto> {
  const response = await apiClient.get<ApiResponseDto<RecipeDetailResponseDto>>(
    `/api/v1/recipes/${recipeId}`,
  );
  return response.data.data;
}

/**
 * 레시피 신규 등록 (POST /api/v1/recipes)
 *
 * @param dto 레시피 등록 정보 (카테고리, 제목, 설명, 인분, 시간, 난이도, 썸네일, 재료 목록, 조리 단계)
 * @returns 등록된 레시피 간략 정보
 */
export async function createRecipe(
  dto: RecipeCreateRequestDto,
): Promise<RecipeSimpleResponseDto> {
  const response = await apiClient.post<ApiResponseDto<RecipeSimpleResponseDto>>(
    '/api/v1/recipes',
    dto,
  );
  return response.data.data;
}

/**
 * 본인 작성 레시피 수정 (PUT /api/v1/recipes/:recipeId)
 *
 * @param recipeId 레시피 ID
 * @param dto 레시피 수정 정보
 * @returns 수정된 레시피 간략 정보
 */
export async function updateRecipe(
  recipeId: number,
  dto: RecipeCreateRequestDto,
): Promise<RecipeSimpleResponseDto> {
  const response = await apiClient.put<ApiResponseDto<RecipeSimpleResponseDto>>(
    `/api/v1/recipes/${recipeId}`,
    dto,
  );
  return response.data.data;
}

/**
 * 본인 작성 레시피 삭제 (DELETE /api/v1/recipes/:recipeId)
 *
 * @param recipeId 레시피 ID
 */
export async function deleteRecipe(recipeId: number): Promise<void> {
  await apiClient.delete<ApiResponseDto<null>>(`/api/v1/recipes/${recipeId}`);
}

/**
 * 레시피 좋아요 Toggle (POST /api/v1/recipes/:recipeId/like)
 *
 * @param recipeId 레시피 ID
 * @returns 좋아요 상태 및 최신 likeCount
 */
export async function toggleRecipeLike(
  recipeId: number,
): Promise<RecipeLikeResponseDto> {
  const response = await apiClient.post<ApiResponseDto<RecipeLikeResponseDto>>(
    `/api/v1/recipes/${recipeId}/like`,
  );
  return response.data.data;
}

/**
 * 레시피 스크랩 Toggle (POST /api/v1/recipes/:recipeId/scrap)
 *
 * @param recipeId 레시피 ID
 * @returns 스크랩 상태 (scrapped: boolean)
 */
export async function toggleRecipeScrap(
  recipeId: number,
): Promise<RecipeScrapResponseDto> {
  const response = await apiClient.post<ApiResponseDto<RecipeScrapResponseDto>>(
    `/api/v1/recipes/${recipeId}/scrap`,
  );
  return response.data.data;
}
