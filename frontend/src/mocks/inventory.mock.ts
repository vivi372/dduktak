import type { InventoryItem } from '@/types/inventory';

/** 목 데이터: 내 냉장고 재료 (D-Day 신호등 4색을 모두 확인할 수 있도록 구성) */
export const mockInventory: InventoryItem[] = [
  { ingredientId: 10, masterIngredientId: 2, categoryId: 2, name: '계란', storageType: 'REFRIGERATED', quantity: 10, unit: '개', expireDate: '2026-10-24', dDay: 2, memo: '' },
  { ingredientId: 11, masterIngredientId: 31, categoryId: 3, name: '대파', storageType: 'REFRIGERATED', quantity: 2, unit: '대', expireDate: '2026-10-25', dDay: 3 },
  { ingredientId: 12, masterIngredientId: 45, categoryId: 5, name: '우유', storageType: 'REFRIGERATED', quantity: 1, unit: 'L', expireDate: '2026-10-27', dDay: 5, memo: '개봉함' },
  { ingredientId: 13, masterIngredientId: 52, categoryId: 6, name: '두부', storageType: 'REFRIGERATED', quantity: 1, unit: '모', expireDate: '2026-10-31', dDay: 9 },
  { ingredientId: 14, masterIngredientId: 18, categoryId: 3, name: '양파', storageType: 'ROOM_TEMP', quantity: 3, unit: '개', expireDate: '2026-11-12', dDay: 21 },
  { ingredientId: 15, masterIngredientId: 77, categoryId: 8, name: '냉동만두', storageType: 'FROZEN', quantity: 20, unit: '개', expireDate: '2027-01-15', dDay: 85, memo: '엄마표' },
  { ingredientId: 16, masterIngredientId: 12, categoryId: 4, name: '삼겹살', storageType: 'FROZEN', quantity: 300, unit: 'g', expireDate: '2026-10-21', dDay: -1 },
];
