/**
 * 내 재료 관리소(Inventory) 도메인 DTO 및 모델 타입 정의 (05_API_SPECIFICATION.md 3.2절)
 */

/** 보관 장소 (05_API_SPECIFICATION 3.2) */
export type StorageType = 'REFRIGERATED' | 'FROZEN' | 'ROOM_TEMP';

/** 내 냉장고 재료 (GET /api/v1/inventory) */
export interface InventoryItem {
  /** 식재료 고유 식별자 (PK) */
  ingredientId: number;
  /** 표준 식재료 마스터 ID */
  masterIngredientId: number;
  /** 식재료 카테고리 ID */
  categoryId: number;
  /** 식재료명 */
  name: string;
  /** 보관 장소 (REFRIGERATED, FROZEN, ROOM_TEMP) */
  storageType: StorageType;
  /** 보유 수량 */
  quantity: number;
  /** 수량 단위 (개, g, ml 등) */
  unit: string;
  /** 소비기한 (YYYY-MM-DD) */
  expireDate: string;
  /** 서버 SQL 실시간 연산 D-Day (음수면 기한 초과) */
  dDay: number;
  /** 표시용 메모/별칭 */
  memo?: string;
}

/** 74종 표준 마스터 식재료 (GET /api/v1/inventory/master-ingredients) */
export interface MasterIngredient {
  /** 표준 마스터 식재료 ID */
  masterIngredientId: number;
  /** 카테고리 ID */
  categoryId: number;
  /** 카테고리명 */
  categoryName: string;
  /** 표준 재료명 */
  name: string;
  /** 기본 수량 단위 */
  defaultUnit: string;
  /** 기본 권장 보관 일수 */
  defaultShelfDays: number;
  /** 기본 보관 장소 (클라이언트 편의용 기본값) */
  defaultStorageType?: StorageType;
}

/** 식재료 카테고리 정보 */
export interface IngredientCategory {
  categoryId: number;
  categoryName: string;
  defaultShelfLifeDays: number;
  isSauce: boolean;
}

/** 동일 표준 식재료 묶음 2-Tier 대표 카드 모델 */
export interface GroupedInventoryItem {
  masterIngredientId: number;
  name: string;
  categoryId: number;
  categoryName?: string;
  storageType: StorageType;
  totalQuantity: number;
  primaryUnit: string;
  mostUrgentDDay: number; // 가장 임박한 D-Day (정렬 및 대표 배지 기준)
  items: InventoryItem[]; // 개별 인스턴스 목록 (아코디언 전개 시 표시)
}

/** 식재료 수동 등록 요청 DTO (POST /api/v1/inventory) */
export interface IngredientCreateRequestDto {
  masterIngredientId: number;
  storageType: StorageType;
  quantity: number;
  unit?: string;
  expireDate?: string; // YYYY-MM-DD (미입력 시 마스터 권장일 자동 연산)
  memo?: string;
}

/** 식재료 수동 등록 응답 DTO */
export interface IngredientCreateResponseDto {
  ingredientId: number;
  name: string;
  memo?: string;
}

/** 식재료 정보 수정 요청 DTO (PUT /api/v1/inventory/{ingredientId}) */
export interface IngredientUpdateRequestDto {
  storageType: StorageType;
  quantity: number;
  unit: string;
  expireDate: string; // YYYY-MM-DD
  memo?: string;
}

/** 식재료 정보 수정 응답 DTO */
export interface IngredientUpdateResponseDto {
  ingredientId: number;
  quantity: number;
  memo?: string;
}

/** 식재료 수동 소비 차감 요청 DTO (PATCH /api/v1/inventory/{ingredientId}/consume) */
export interface IngredientConsumeRequestDto {
  /** 차감할 수량 (미입력 시 전체 수량 차감) */
  consumeQuantity?: number;
}

/** 식재료 수동 소비 차감 응답 DTO */
export interface IngredientConsumeResponseDto {
  ingredientId: number;
  remainingQuantity: number;
  status: 'ACTIVE' | 'CONSUMED';
}

/** 영수증 OCR 스캔 식재료 항목 응답 DTO (POST /api/v1/inventory/scan-ocr) */
export interface OcrIngredientResponseDto {
  masterIngredientId: number;
  name: string;
  quantity: number;
  unit: string;
  recommendedExpireDate: string; // YYYY-MM-DD
}

/** 영수증 Gemini OCR 스캔 수동 검수용 품목 모델 (클라이언트 상태) */
export interface OcrParsedItem {
  id: string; // 클라이언트 임시 식별자
  masterIngredientId: number;
  name: string;
  categoryId: number;
  quantity: number;
  unit: string;
  recommendedExpireDate: string; // YYYY-MM-DD
  dDay: number;
  selected: boolean; // 일괄 등록 체크 여부
}

/** 영수증 OCR 원문 및 신뢰도가 포함된 확장 품목 모델 */
export interface OcrParsedItemWithRaw extends OcrParsedItem {
  /** 영수증에 인쇄되었던 원본 텍스트 */
  rawText: string;
  /** OCR 인식 신뢰도 (0 ~ 1) */
  confidence: number;
  /** 매핑된 표준 카테고리명 */
  categoryName: string;
}

/** 내 냉장고 목록 조회 쿼리 파라미터 */
export interface InventoryQueryParams {
  query?: string;
  categoryId?: number;
  storageType?: string;
  status?: string;
}

/** 마스터 식재료 목록 조회 쿼리 파라미터 */
export interface MasterIngredientQueryParams {
  query?: string;
  categoryId?: number;
}
