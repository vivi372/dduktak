import type { InventoryItem } from '@/types/inventory';

/**
 * 목 데이터: 내 냉장고 재료 목록
 * - 동일 마스터 식재료 묶음(2-Tier 아코디언) 검증 지원
 * - 4색 D-Day 신호등(D-3 빨강, D-7 주황, D-7초과 안심, 기한초과 Deep Red) 전량 지원
 */
export const mockInventory: InventoryItem[] = [
  // 1. 계란 (마스터 ID: 18) - 2개 인스턴스 묶음 (가장 임박: D-2)
  {
    ingredientId: 101,
    masterIngredientId: 18,
    categoryId: 2,
    name: '계란',
    storageType: 'REFRIGERATED',
    quantity: 10,
    unit: '개',
    expireDate: '2026-10-24',
    dDay: 2, // D-3 이내: 빨강 (임박)
    memo: '편의점 1+1 행사',
  },
  {
    ingredientId: 102,
    masterIngredientId: 18,
    categoryId: 2,
    name: '계란',
    storageType: 'REFRIGERATED',
    quantity: 15,
    unit: '개',
    expireDate: '2026-11-09',
    dDay: 18, // D-7 초과: 안심 (초록)
    memo: '주말에 본가에서 가져옴',
  },

  // 2. 양파 (마스터 ID: 1) - 2개 인스턴스 묶음 (가장 임박: D-5)
  {
    ingredientId: 103,
    masterIngredientId: 1,
    categoryId: 1,
    name: '양파',
    storageType: 'REFRIGERATED',
    quantity: 2,
    unit: '개',
    expireDate: '2026-10-27',
    dDay: 5, // D-7 이내: 주황 (주의)
    memo: '깐양파 지퍼백 보관',
  },
  {
    ingredientId: 104,
    masterIngredientId: 1,
    categoryId: 1,
    name: '양파',
    storageType: 'ROOM_TEMP',
    quantity: 3,
    unit: '개',
    expireDate: '2026-11-03',
    dDay: 12, // D-7 초과: 안심
    memo: '망에 걸어둠',
  },

  // 3. 돼지고기 (삼겹살/목살) (마스터 ID: 20) - 2개 인스턴스 (냉장 D-1, 냉동 D-60)
  {
    ingredientId: 105,
    masterIngredientId: 20,
    categoryId: 2,
    name: '돼지고기 (삼겹살/목살)',
    storageType: 'REFRIGERATED',
    quantity: 300,
    unit: 'g',
    expireDate: '2026-10-23',
    dDay: 1, // D-3 이내: 빨강 (임박)
    memo: '오늘 저녁 구이용',
  },
  {
    ingredientId: 106,
    masterIngredientId: 20,
    categoryId: 2,
    name: '돼지고기 (삼겹살/목살)',
    storageType: 'FROZEN',
    quantity: 500,
    unit: 'g',
    expireDate: '2026-12-21',
    dDay: 60, // 안심
    memo: '소분하여 냉동 보관',
  },

  // 4. 대파 (마스터 ID: 2) - 단일 인스턴스 (D-3 빨강)
  {
    ingredientId: 107,
    masterIngredientId: 2,
    categoryId: 1,
    name: '대파',
    storageType: 'REFRIGERATED',
    quantity: 1,
    unit: '뿌리',
    expireDate: '2026-10-25',
    dDay: 3, // D-3 이내: 빨강
    memo: '송송 썰어 밀폐용기에 넣음',
  },

  // 5. 우유 (마스터 ID: 41) - 단일 인스턴스 (D-6 주황)
  {
    ingredientId: 108,
    masterIngredientId: 41,
    categoryId: 4,
    name: '우유',
    storageType: 'REFRIGERATED',
    quantity: 1,
    unit: 'ml',
    expireDate: '2026-10-28',
    dDay: 6, // D-7 이내: 주황
    memo: '개봉함',
  },

  // 6. 만두 (냉동) (마스터 ID: 48) - 단일 인스턴스 (D-80 안심)
  {
    ingredientId: 109,
    masterIngredientId: 48,
    categoryId: 5,
    name: '만두 (냉동)',
    storageType: 'FROZEN',
    quantity: 1,
    unit: '봉지',
    expireDate: '2027-01-10',
    dDay: 80, // 안심
    memo: '고기 왕만두',
  },

  // 7. 소비기한 만료 영역 재료 (dDay < 0) - Deep Red
  {
    ingredientId: 110,
    masterIngredientId: 17,
    categoryId: 1,
    name: '두부',
    storageType: 'REFRIGERATED',
    quantity: 1,
    unit: '모',
    expireDate: '2026-10-20',
    dDay: -2, // 소비기한 2일 지남 (Deep Red)
    memo: '찌개 끓이려다 깜빡함',
  },
  {
    ingredientId: 111,
    masterIngredientId: 49,
    categoryId: 5,
    name: '떡국떡',
    storageType: 'REFRIGERATED',
    quantity: 200,
    unit: 'g',
    expireDate: '2026-10-18',
    dDay: -4, // 소비기한 4일 지남 (Deep Red)
    memo: '냉장고 구석에 있던 떡',
  },
];
