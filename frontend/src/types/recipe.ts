/**
 * 레시피 커뮤니티(모듈 3) 관련 타입 정의
 */

/** 레시피 8대 카테고리 (GET /api/v1/recipes/categories) */
export interface RecipeCategory {
  recipeCategoryId: number;
  categoryName: string;
  displayOrder: number;
}

/** 레시피 조리 난이도 */
export type RecipeDifficulty = '쉬움' | '보통' | '조금복잡' | '어려움';

/** 레시피 필요 재료 (표준 마스터 식재료 바인딩) */
export interface RecipeIngredient {
  recipeIngId?: number;
  /** 표준 식재료 마스터 ID (1~74) */
  masterIngredientId: number;
  /** 대체 가능 표준 재료 ID (부재료 전용, 선택) */
  altIngredientId?: number | null;
  /** 대체 가능 식재료명 (표시용) */
  altIngredientName?: string | null;
  /** 식재료 카테고리 ID (양념류 판단용: 6) */
  categoryId: number;
  /** 식재료명 */
  name: string;
  /** 1인분 기준 기본 수량 */
  quantity: number;
  /** 수량 단위 (개, g, ml, 큰술, 모 등) */
  unit: string;
  /** 주재료(MAIN) vs 부재료(SUB) */
  typeCode: 'MAIN' | 'SUB';
  /** 생략 가능 여부 (부재료 전용) */
  isOptional: boolean;
}

/** 레시피 조리 순서 (Step) */
export interface RecipeStep {
  /** 단계 번호 (1부터 시작) */
  stepNo: number;
  /** 조리 과정 설명 */
  description: string;
  /** 과정 사진 URL (선택) */
  imageUrl?: string | null;
}

/** 레시피 목록 요약 항목 (GET /api/v1/recipes) */
export interface RecipeSummary {
  recipeId: number;
  recipeCategoryId: number;
  categoryName: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  cookingTime: number; // 분
  difficulty: RecipeDifficulty;
  likeCount: number;
  cookedCount: number;
  authorNickname: string;
  authorTag: string;
  authorId?: string | null;
  matchingRate?: number;
}

/** 레시피 상세 정보 (GET /api/v1/recipes/:id) */
export interface RecipeDetail extends RecipeSummary {
  /** 기준 인분 (기본 1인분) */
  servings: number;
  /** 좋아요 여부 */
  isLiked?: boolean;
  /** 스크랩 여부 */
  isScrapped?: boolean;
  /** 작성일시 */
  createdAt?: string;
  /** 식재료 목록 */
  ingredients: RecipeIngredient[];
  /** 조리 단계 목록 */
  steps: RecipeStep[];
}

/** 스마트 매칭 추천 항목 (GET /api/v1/matching/recommendations) */
export interface RecipeRecommendation extends RecipeSummary {
  /** 냉장고 매칭률 (%) */
  matchingRate: number;
  /** 보유한 일치 재료명 목록 */
  matchIngredients: string[];
  /** 부족한 재료명 목록 */
  missingIngredients: string[];
}

/** 레시피 등록 및 수정 폼 입력 데이터 */
export interface RecipeFormData {
  title: string;
  description: string;
  recipeCategoryId: number;
  servings: number;
  cookingTime: number;
  difficulty: RecipeDifficulty;
  thumbnailUrl?: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}
