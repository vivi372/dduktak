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
