/**
 * 스마트 매칭 엔진 및 요리완료(Matching) 도메인 React Query 커스텀 훅 (02_ARCHITECTURE_AND_CONVENTIONS.md 3.3절)
 *
 * 내 냉장고 기반 맞춤 추천 쿼리 및 뚝딱 요리완료(FIFO 자동 차감) 뮤테이션을 제공합니다.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMatchingRecommendations, cookRecipe } from '@/services/matchingApi';
import { RECIPE_QUERY_KEYS } from '@/hooks/useRecipe';
import type {
  MatchingQueryParams,
  MatchingRecommendationResponseDto,
  CookRequestDto,
  CookResponseDto,
} from '@/types/matching';

/** 매칭 쿼리 키 상수 */
export const MATCHING_QUERY_KEYS = {
  all: ['matching'] as const,
  recommendations: (params?: MatchingQueryParams) =>
    ['matching', 'recommendations', params] as const,
};

/**
 * 내 냉장고 기반 맞춤 레시피 추천 조회 훅 (GET /api/v1/matching/recommendations)
 *
 * @param params 카테고리(recipeCategoryId), page, size
 * @param options enabled 등 활성화 조건 (예: 매칭 토글 ON일 때만 실행)
 */
export function useMatchingRecommendations(
  params?: MatchingQueryParams,
  options?: { enabled?: boolean },
) {
  return useQuery<MatchingRecommendationResponseDto[]>({
    queryKey: MATCHING_QUERY_KEYS.recommendations(params),
    queryFn: async () => {
      return await getMatchingRecommendations(params);
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30, // 30초 캐싱 (냉장고 변동 반영)
  });
}

/**
 * 뚝딱 요리 완료 뮤테이션 훅 (POST /api/v1/matching/cook/:recipeId)
 *
 * 요리 완료 성공 시:
 * 1. 내 냉장고 식재료 캐시(['inventory']) 즉시 무효화 -> 차감된 잔여 수량 자동 동기화
 * 2. 레시피 캐시(['recipes']) 무효화 -> cookedCount 카운터 실시간 갱신
 * 3. 매칭 추천 캐시(['matching']) 무효화 -> 차감 후 변화된 매칭률 재연산
 */
export function useCookRecipe() {
  const queryClient = useQueryClient();

  return useMutation<
    CookResponseDto,
    Error,
    { recipeId: number; dto?: CookRequestDto }
  >({
    mutationFn: async ({ recipeId, dto }) => {
      return await cookRecipe(recipeId, dto);
    },
    onSuccess: (_, { recipeId }) => {
      // 1. 내 냉장고 재료 목록 즉시 동기화 (FIFO 차감 반영)
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      // 2. 레시피 상세 및 목록 캐시 동시 갱신 (요리완료수 cookedCount 증가)
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.detail(recipeId) });

      // 3. 스마트 매칭 추천 캐시 갱신
      queryClient.invalidateQueries({ queryKey: MATCHING_QUERY_KEYS.all });
    },
  });
}
