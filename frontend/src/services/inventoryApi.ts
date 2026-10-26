/**
 * 내 재료 관리소(Inventory) 도메인 API 클라이언트 (05_API_SPECIFICATION.md 3.2절)
 *
 * 표준 식재료 마스터 조회, 내 냉장고 CRUD, 수동 소비 차감, 바코드 조회 및 영수증 OCR 스캔 통신을 담당합니다.
 */

import { apiClient } from '@/services/apiClient';
import type { ApiResponseDto } from '@/types/auth';
import type {
  InventoryItem,
  MasterIngredient,
  IngredientCreateRequestDto,
  IngredientCreateResponseDto,
  IngredientUpdateRequestDto,
  IngredientUpdateResponseDto,
  IngredientConsumeRequestDto,
  IngredientConsumeResponseDto,
  BarcodeIngredientResponseDto,
  OcrIngredientResponseDto,
  InventoryQueryParams,
  MasterIngredientQueryParams,
} from '@/types/inventory';

/**
 * 74종 표준 식재료 마스터 목록 및 카테고리 검색 조회 (GET /api/v1/inventory/master-ingredients)
 *
 * @param params 검색어(query), 카테고리(categoryId) 필터
 * @returns 표준 식재료 마스터 목록
 */
export async function getMasterIngredients(
  params?: MasterIngredientQueryParams,
): Promise<MasterIngredient[]> {
  const response = await apiClient.get<ApiResponseDto<MasterIngredient[]>>(
    '/api/v1/inventory/master-ingredients',
    { params },
  );
  return response.data.data;
}

/**
 * 내 냉장고 식재료 목록 조회 (GET /api/v1/inventory)
 * SQL 레벨에서 실시간 D-Day 연산 및 소비기한 임박순 정렬이 적용된 목록을 반환합니다.
 *
 * @param params 검색어(query), 카테고리(categoryId), 보관장소(storageType), 상태(status)
 * @returns 내 냉장고 보유 식재료 목록
 */
export async function getMyIngredients(
  params?: InventoryQueryParams,
): Promise<InventoryItem[]> {
  const response = await apiClient.get<ApiResponseDto<InventoryItem[]>>(
    '/api/v1/inventory',
    { params },
  );
  return response.data.data;
}

/**
 * 내 냉장고 식재료 수동 직접 등록 (POST /api/v1/inventory)
 * 독립 레코드 원칙(INV-01-2)에 따라 기존 식재료와 수량을 합산하지 않고 새 레코드로 저장합니다.
 *
 * @param dto 식재료 등록 요청 DTO
 * @returns 등록 완료 DTO
 */
export async function createIngredient(
  dto: IngredientCreateRequestDto,
): Promise<IngredientCreateResponseDto> {
  const response = await apiClient.post<ApiResponseDto<IngredientCreateResponseDto>>(
    '/api/v1/inventory',
    dto,
  );
  return response.data.data;
}

/**
 * 내 냉장고 식재료 정보 개별 수정 (PUT /api/v1/inventory/{ingredientId})
 * 본인 소유의 식재료에 한해 보관장소, 수량, 단위, 소비기한, 메모를 수정합니다.
 *
 * @param ingredientId 식재료 ID
 * @param dto 수정 요청 DTO
 * @returns 수정 완료 DTO
 */
export async function updateIngredient(
  ingredientId: number,
  dto: IngredientUpdateRequestDto,
): Promise<IngredientUpdateResponseDto> {
  const response = await apiClient.put<ApiResponseDto<IngredientUpdateResponseDto>>(
    `/api/v1/inventory/${ingredientId}`,
    dto,
  );
  return response.data.data;
}

/**
 * 내 냉장고 식재료 소프트 삭제 (DELETE /api/v1/inventory/{ingredientId})
 * status='DELETED'로 소프트 삭제 처리합니다.
 *
 * @param ingredientId 식재료 ID
 */
export async function deleteIngredient(ingredientId: number): Promise<void> {
  await apiClient.delete<ApiResponseDto<null>>(`/api/v1/inventory/${ingredientId}`);
}

/**
 * 내 냉장고 식재료 수동 소비 처리 (PATCH /api/v1/inventory/{ingredientId}/consume)
 * 수량 차감 후 잔여 수량이 0이 되면 status='CONSUMED'로 자동 전이됩니다.
 *
 * @param ingredientId 식재료 ID
 * @param dto 소비 요청 DTO (수량 미입력 시 전량 소비)
 * @returns 소비 처리 결과 DTO
 */
export async function consumeIngredient(
  ingredientId: number,
  dto?: IngredientConsumeRequestDto,
): Promise<IngredientConsumeResponseDto> {
  const response = await apiClient.patch<ApiResponseDto<IngredientConsumeResponseDto>>(
    `/api/v1/inventory/${ingredientId}/consume`,
    dto,
  );
  return response.data.data;
}

/**
 * 바코드 번호 기반 표준 식재료 조회 (GET /api/v1/inventory/barcode/{barcodeNo})
 * 미등록 또는 매핑 실패 시 404 Not Found (INV_WARN_BARCODE_NOT_FOUND)를 반환합니다.
 *
 * @param barcodeNo EAN-13 / GTIN-14 바코드 번호
 * @returns 표준 식재료 정보 및 권장 소비기한 DTO
 */
export async function getIngredientByBarcode(
  barcodeNo: string,
): Promise<BarcodeIngredientResponseDto> {
  const response = await apiClient.get<ApiResponseDto<BarcodeIngredientResponseDto>>(
    `/api/v1/inventory/barcode/${encodeURIComponent(barcodeNo)}`,
  );
  return response.data.data;
}

/**
 * 영수증 OCR 이미지 스캔 및 식재료 일괄 파싱 (POST /api/v1/inventory/scan-ocr)
 * Gemini Flash REST API 프록시를 통해 영수증 이미지를 분석합니다.
 * 실패 또는 미인식 시 백엔드가 빈 배열(data: [])을 반환합니다.
 *
 * @param fileOrBlob 영수증 이미지 파일 또는 Blob 객체
 * @returns 표준 매핑된 식재료 항목 목록
 */
export async function scanReceiptOcr(
  fileOrBlob: File | Blob,
): Promise<OcrIngredientResponseDto[]> {
  const formData = new FormData();
  if (fileOrBlob instanceof File) {
    formData.append('image', fileOrBlob);
  } else {
    formData.append('image', fileOrBlob, 'receipt.jpg');
  }

  const response = await apiClient.post<ApiResponseDto<OcrIngredientResponseDto[]>>(
    '/api/v1/inventory/scan-ocr',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // Google AI Vision OCR 분석 전용 120초 타임아웃
    },
  );
  return response.data.data;
}
