/**
 * '오늘의 뚝딱' 식재료 6대 카테고리 및 레시피 8대 카테고리 상수 정의
 * (04_DATABASE_SCHEMA.md 기준 고정 마스터 데이터)
 */

export interface IngredientCategoryItem {
  categoryId: number;
  categoryName: string;
}

/** 6대 표준 식재료 카테고리 */
export const INVENTORY_CATEGORIES: IngredientCategoryItem[] = [
  { categoryId: 1, categoryName: '채소/과일' },
  { categoryId: 2, categoryName: '정육/계란' },
  { categoryId: 3, categoryName: '수산/해산물' },
  { categoryId: 4, categoryName: '유제품/시리얼' },
  { categoryId: 5, categoryName: '가공식품/냉동' },
  { categoryId: 6, categoryName: '양념/소스/조미료' },
];

/** 8대 레시피 카테고리 (서버 미응답 시 기본 메타데이터 구조) */
export const RECIPE_CATEGORIES = [
  { recipeCategoryId: 1, categoryName: '한그릇/밥', icon: '🍚' },
  { recipeCategoryId: 2, categoryName: '국/찌개/탕', icon: '🍲' },
  { recipeCategoryId: 3, categoryName: '반찬/나물/조림', icon: '🥢' },
  { recipeCategoryId: 4, categoryName: '구이/볶음', icon: '🍳' },
  { recipeCategoryId: 5, categoryName: '면/파스타', icon: '🍜' },
  { recipeCategoryId: 6, categoryName: '분식/야식/간식', icon: '🍢' },
  { recipeCategoryId: 7, categoryName: '다이어트/샐러드', icon: '🥗' },
  { recipeCategoryId: 8, categoryName: '기타/간편식', icon: '🍽️' },
];
