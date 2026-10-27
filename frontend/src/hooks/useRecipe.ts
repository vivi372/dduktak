/**
 * 뚝딱 레시피 커뮤니티(Recipe) 도메인 React Query 커스텀 훅 (02_ARCHITECTURE_AND_CONVENTIONS.md 3.3절)
 *
 * 8대 카테고리 조회, 페이징 목록/검색/필터 조회, 상세 정보 조회,
 * 레시피 등록, 수정, 삭제, 좋아요 및 스크랩 토글 뮤테이션을 제공합니다.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getRecipeCategories,
  getRecipes,
  getRecipeDetail,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleRecipeLike,
  toggleRecipeScrap,
} from '@/services/recipeApi';
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

/** 레시피 쿼리 키 상수 */
export const RECIPE_QUERY_KEYS = {
  all: ['recipes'] as const,
  categories: () => ['recipes', 'categories'] as const,
  list: (params?: RecipeListQueryParams) => ['recipes', 'list', params] as const,
  detail: (id: number) => ['recipes', 'detail', id] as const,
};

/**
 * 8대 레시피 카테고리 목록 조회 훅 (GET /api/v1/recipes/categories)
 */
export function useRecipeCategories() {
  return useQuery<RecipeCategoryResponseDto[]>({
    queryKey: RECIPE_QUERY_KEYS.categories(),
    queryFn: getRecipeCategories,
    staleTime: 1000 * 60 * 30, // 30분 장기 캐싱 (변동이 거의 없는 마스터 카테고리)
  });
}

/**
 * 레시피 목록 페이징/검색/필터 조회 훅 (GET /api/v1/recipes)
 *
 * @param params 검색어(query), 필터(filter), 카테고리(recipeCategoryId), 정렬(sort), page, size
 * @param options enabled 등 추가 옵션
 */
export function useRecipes(
  params?: RecipeListQueryParams,
  options?: { enabled?: boolean },
) {
  return useQuery<RecipeListResponseDto>({
    queryKey: RECIPE_QUERY_KEYS.list(params),
    queryFn: async () => {
      return await getRecipes(params);
    },
    enabled: options?.enabled ?? true,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5분 캐싱 유지 (뒤로가기 시 깜빡임 없이 즉시 렌더링)
  });
}

/**
 * 레시피 상세 조회 훅 (GET /api/v1/recipes/:recipeId)
 *
 * @param recipeId 레시피 ID
 */
export function useRecipeDetail(recipeId: number) {
  return useQuery<RecipeDetailResponseDto>({
    queryKey: RECIPE_QUERY_KEYS.detail(recipeId),
    queryFn: async () => {
      return await getRecipeDetail(recipeId);
    },
    enabled: Boolean(recipeId && recipeId > 0),
    staleTime: 1000 * 60 * 5, // 5분 캐싱 (상세 재방문 시 즉시 렌더링)
  });
}

/**
 * 레시피 신규 등록 뮤테이션 훅 (POST /api/v1/recipes)
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation<RecipeSimpleResponseDto, Error, RecipeCreateRequestDto>({
    mutationFn: async (dto) => {
      return await createRecipe(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
    },
  });
}

/**
 * 본인 작성 레시피 수정 뮤테이션 훅 (PUT /api/v1/recipes/:recipeId)
 */
export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation<
    RecipeSimpleResponseDto,
    Error,
    { recipeId: number; dto: RecipeCreateRequestDto }
  >({
    mutationFn: async ({ recipeId, dto }) => {
      return await updateRecipe(recipeId, dto);
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.detail(recipeId) });
    },
  });
}

/**
 * 본인 작성 레시피 삭제 뮤테이션 훅 (DELETE /api/v1/recipes/:recipeId)
 */
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (recipeId) => {
      await deleteRecipe(recipeId);
    },
    onSuccess: (_, recipeId) => {
      // 1. 이미 삭제된 레시피 상세 쿼리는 즉시 캐시에서 완전 제거하여 언마운트 직전 재조회(404 원인) 원천 차단
      queryClient.removeQueries({ queryKey: RECIPE_QUERY_KEYS.detail(recipeId), exact: true });
      // 2. 레시피 목록 쿼리만 무효화하여 최신 목록으로 갱신
      queryClient.invalidateQueries({ queryKey: ['recipes', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

/**
 * 레시피 좋아요 Toggle 뮤테이션 훅 (POST /api/v1/recipes/:recipeId/like)
 */
export function useToggleRecipeLike() {
  const queryClient = useQueryClient();

  return useMutation<RecipeLikeResponseDto, Error, number>({
    mutationFn: async (recipeId) => {
      return await toggleRecipeLike(recipeId);
    },
    onSuccess: (_, recipeId) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.detail(recipeId) });
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
    },
  });
}

/**
 * 레시피 스크랩 Toggle 뮤테이션 훅 (POST /api/v1/recipes/:recipeId/scrap)
 */
export function useToggleRecipeScrap() {
  const queryClient = useQueryClient();

  return useMutation<RecipeScrapResponseDto, Error, number>({
    mutationFn: async (recipeId) => {
      return await toggleRecipeScrap(recipeId);
    },
    onSuccess: (_, recipeId) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.detail(recipeId) });
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
    },
  });
}
