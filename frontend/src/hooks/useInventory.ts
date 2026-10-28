/**
 * 내 재료 관리소(Inventory) 도메인 React Query 커스텀 훅 (02_ARCHITECTURE_AND_CONVENTIONS.md 3.3절)
 *
 * 표준 식재료 마스터 조회, 내 냉장고 목록 조회, 수동 등록/수정/삭제/소비,
 * 그리고 영수증 OCR 스캔 뮤테이션을 제공합니다.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMasterIngredients,
  getMyIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  consumeIngredient,
  scanReceiptOcr,
} from '@/services/inventoryApi';
import { useAuth } from '@/hooks/useAuth';
import type {
  InventoryItem,
  MasterIngredient,
  IngredientCreateRequestDto,
  IngredientCreateResponseDto,
  IngredientUpdateRequestDto,
  IngredientUpdateResponseDto,
  IngredientConsumeRequestDto,
  IngredientConsumeResponseDto,
  OcrIngredientResponseDto,
  InventoryQueryParams,
  MasterIngredientQueryParams,
} from '@/types/inventory';

/** 쿼리 키 상수 */
export const INVENTORY_QUERY_KEYS = {
  all: ['inventory'] as const,
  master: (params?: MasterIngredientQueryParams) => ['inventory', 'master-ingredients', params] as const,
  list: (params?: InventoryQueryParams, userId?: string) => ['inventory', 'list', userId, params] as const,
};

/**
 * 74종 표준 마스터 식재료 목록 조회 훅 (GET /api/v1/inventory/master-ingredients)
 *
 * @param params 검색어(query), 카테고리(categoryId) 필터
 */
export function useMasterIngredients(params?: MasterIngredientQueryParams) {
  return useQuery<MasterIngredient[]>({
    queryKey: INVENTORY_QUERY_KEYS.master(params),
    queryFn: () => getMasterIngredients(params),
    staleTime: 1000 * 60 * 30, // 30분 장기 캐싱 (변동이 적은 마스터 데이터)
  });
}

/**
 * 내 냉장고 식재료 목록 조회 훅 (GET /api/v1/inventory)
 * SQL 기반 실시간 D-Day 연산 및 소비기한 임박순 정렬이 적용된 목록을 조회합니다.
 *
 * @param params 검색어, 카테고리, 보관장소, 상태 필터
 */
export function useInventoryList(params?: InventoryQueryParams) {
  const { isAuthenticated, user } = useAuth();

  return useQuery<InventoryItem[]>({
    queryKey: INVENTORY_QUERY_KEYS.list(params, user?.userId),
    queryFn: async () => {
      return await getMyIngredients(params);
    },
    enabled: isAuthenticated && Boolean(user?.userId),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5분 캐싱 (화면 전환 시 즉시 캐시 렌더링)
  });
}

/** 내 냉장고 식재료 목록 조회 별칭 훅 (useInventoryList와 동일) */
export const useMyIngredients = useInventoryList;


/**
 * 내 냉장고 식재료 수동 직접 등록 뮤테이션 훅 (POST /api/v1/inventory)
 * 독립 레코드 원칙(INV-01-2) 적용
 */
export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation<IngredientCreateResponseDto, Error, IngredientCreateRequestDto>({
    mutationFn: async (dto) => {
      return await createIngredient(dto);
    },
    onSuccess: () => {
      // 인벤토리 목록 및 메인 홈 브리핑 캐시 동시 갱신
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['home', 'briefing'] });
    },
  });
}

/**
 * 내 냉장고 식재료 개별 수정 뮤테이션 훅 (PUT /api/v1/inventory/{ingredientId})
 */
export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation<
    IngredientUpdateResponseDto,
    Error,
    { ingredientId: number; dto: IngredientUpdateRequestDto }
  >({
    mutationFn: async ({ ingredientId, dto }) => {
      return await updateIngredient(ingredientId, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['home', 'briefing'] });
    },
  });
}

/**
 * 내 냉장고 식재료 소프트 삭제 뮤테이션 훅 (DELETE /api/v1/inventory/{ingredientId})
 */
export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (ingredientId) => {
      await deleteIngredient(ingredientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['home', 'briefing'] });
    },
  });
}

/**
 * 내 냉장고 식재료 수동 소비 차감 뮤테이션 훅 (PATCH /api/v1/inventory/{ingredientId}/consume)
 */
export function useConsumeIngredient() {
  const queryClient = useQueryClient();

  return useMutation<
    IngredientConsumeResponseDto,
    Error,
    { ingredientId: number; dto?: IngredientConsumeRequestDto }
  >({
    mutationFn: async ({ ingredientId, dto }) => {
      return await consumeIngredient(ingredientId, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['home', 'briefing'] });
    },
  });
}

/**
 * 영수증 OCR 스캔 뮤테이션 훅 (POST /api/v1/inventory/scan-ocr)
 */
export function useScanReceiptOcr() {
  return useMutation<OcrIngredientResponseDto[], Error, File | Blob>({
    mutationFn: async (fileOrBlob) => {
      return await scanReceiptOcr(fileOrBlob);
    },
  });
}
