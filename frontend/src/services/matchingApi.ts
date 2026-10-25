/**
 * 스마트 매칭 엔진 및 요리완료(Matching) 도메인 API 클라이언트 (05_API_SPECIFICATION.md 3.4절)
 *
 * 내 냉장고 기반 맞춤 레시피 추천 조회 및 뚝딱 요리완료(FIFO 자동 차감 / 2-Way) 통신을 담당합니다.
 */

import { apiClient } from '@/services/apiClient';
import type { ApiResponseDto } from '@/types/auth';
import type {
  MatchingQueryParams,
  MatchingRecommendationResponseDto,
  CookRequestDto,
  CookResponseDto,
} from '@/types/matching';

/**
 * 내 냉장고 기반 맞춤 레시피 추천 조회 (GET /api/v1/matching/recommendations)
 * 주재료 0개 미보유 레시피는 백엔드 하드게이트에 의해 추천 목록에서 완전 제외됩니다.
 *
 * @param params 카테고리(recipeCategoryId), page, size
 * @returns 매칭률 및 일치/부족 재료가 포함된 추천 레시피 목록
 */
export async function getMatchingRecommendations(
  params?: MatchingQueryParams,
): Promise<MatchingRecommendationResponseDto[]> {
  const response = await apiClient.get<ApiResponseDto<MatchingRecommendationResponseDto[]>>(
    '/api/v1/matching/recommendations',
    { params },
  );
  return response.data.data;
}

/**
 * 뚝딱 요리 완료 (POST /api/v1/matching/cook/:recipeId)
 * deductInventory: true 전달 시 No-Mixing FIFO 정책에 따라 내 냉장고 재료가 선입선출 자동 차감됩니다.
 * (양념/소스류는 상시 차감 제외)
 *
 * @param recipeId 레시피 ID
 * @param dto 차감 여부(deductInventory: boolean), 조리 인분 수(servings: number)
 * @returns 요리완료 응답 (isDeducted, cookedCount, deductedIngredients 목록)
 */
export async function cookRecipe(
  recipeId: number,
  dto?: CookRequestDto,
): Promise<CookResponseDto> {
  const response = await apiClient.post<ApiResponseDto<CookResponseDto>>(
    `/api/v1/matching/cook/${recipeId}`,
    dto ?? { deductInventory: true, servings: 1 },
  );
  return response.data.data;
}
