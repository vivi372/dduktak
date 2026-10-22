/** 보관 장소 (05_API_SPECIFICATION 3.2) */
export type StorageType = 'REFRIGERATED' | 'FROZEN' | 'ROOM_TEMP';

/** 내 냉장고 재료 (GET /api/v1/inventory) */
export interface InventoryItem {
  ingredientId: number;
  masterIngredientId: number;
  categoryId: number;
  name: string;
  storageType: StorageType;
  quantity: number;
  unit: string;
  expireDate: string; // YYYY-MM-DD
  dDay: number; // 서버 SQL 연산 결과 (음수면 기한 초과)
  memo?: string;
}

/** 74종 표준 마스터 식재료 (GET /api/v1/inventory/master-ingredients) */
export interface MasterIngredient {
  masterIngredientId: number;
  categoryId: number;
  categoryName: string;
  name: string;
  defaultUnit: string;
  defaultShelfDays: number;
  defaultStorageType: StorageType;
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

/** 영수증 Gemini OCR 스캔 수동 검수용 품목 모델 */
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

/** 바코드 스캔 조회 결과 모델 */
export interface BarcodeLookupResult {
  barcodeNo: string;
  masterIngredientId: number;
  name: string;
  categoryId: number;
  categoryName: string;
  recommendedUnit: string;
  recommendedExpireDate: string;
  defaultStorageType: StorageType;
}

