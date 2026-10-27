/**
 * 레시피 커뮤니티(모듈 3) 관련 타입 및 DTO 정의 (05_API_SPECIFICATION.md 3.3절)
 */

/** 레시피 조리 난이도 (백엔드 Validation 및 DB Check 제약 준수: '쉬움' | '보통' | '어려움') */
export type RecipeDifficulty = '쉬움' | '보통' | '어려움';

/** 레시피 8대 카테고리 (GET /api/v1/recipes/categories) */
export interface RecipeCategory {
  recipeCategoryId: number;
  categoryName: string;
  displayOrder: number;
}
export type RecipeCategoryResponseDto = RecipeCategory;

/** 레시피 목록 쿼리 파라미터 (GET /api/v1/recipes) */
export interface RecipeListQueryParams {
  query?: string;
  filter?: 'ALL' | 'MY' | 'SCRAP';
  recipeCategoryId?: number;
  sort?: 'latest' | 'like' | 'cooked';
  page?: number;
  size?: number;
}

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
  /** 양념류 여부 (차감 제외 대상) */
  isSauce?: boolean;
}
export type RecipeIngredientResponseDto = RecipeIngredient;

/** 레시피 조리 순서 (Step) */
export interface RecipeStep {
  stepId?: number;
  /** 단계 번호 (1부터 시작) */
  stepNo: number;
  /** 조리 과정 설명 */
  description: string;
  /** 과정 사진 URL (선택) */
  imageUrl?: string | null;
}
export type RecipeStepResponseDto = RecipeStep;

/** 레시피 목록 카드 요약 항목 (GET /api/v1/recipes) */
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
  authorNickname?: string | null;
  authorTag?: string | null;
  authorId?: string | null;
  matchingRate?: number;
}
export type RecipeSummaryResponseDto = RecipeSummary;

/** 레시피 목록 페이징 응답 DTO */
export interface RecipeListResponseDto {
  recipes: RecipeSummaryResponseDto[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

/** 레시피 상세 정보 (GET /api/v1/recipes/:id) */
export interface RecipeDetail extends RecipeSummary {
  /** 기준 인분 (기본 1인분) */
  servings: number;
  /** 좋아요 여부 */
  isLiked?: boolean;
  /** 스크랩 여부 */
  isScrapped?: boolean;
  /** 등록 일시 */
  createdAt?: string;
  /** 식재료 목록 */
  ingredients: RecipeIngredient[];
  /** 조리 단계 목록 */
  steps: RecipeStep[];
}
export type RecipeDetailResponseDto = RecipeDetail;

/** 레시피 등록 및 수정 요청 시 식재료 항목 DTO */
export interface RecipeIngredientItemDto {
  masterIngredientId: number;
  altIngredientId?: number | null;
  categoryId: number;
  name: string;
  quantity: number;
  unit: string;
  typeCode: 'MAIN' | 'SUB';
  isOptional: boolean;
}

/** 레시피 등록 및 수정 요청 시 조리 단계 항목 DTO */
export interface RecipeStepItemDto {
  stepNo: number;
  description: string;
  imageUrl?: string | null;
}

/** 레시피 등록 및 수정 요청 DTO (POST /api/v1/recipes, PUT /api/v1/recipes/:id) */
export interface RecipeCreateRequestDto {
  recipeCategoryId: number;
  title: string;
  description?: string;
  servings: number;
  cookingTime: number;
  difficulty: RecipeDifficulty;
  thumbnailUrl?: string;
  ingredients: RecipeIngredientItemDto[];
  steps: RecipeStepItemDto[];
}
export type RecipeUpdateRequestDto = RecipeCreateRequestDto;

/** 레시피 등록/수정 간략 응답 DTO */
export interface RecipeSimpleResponseDto {
  recipeId: number;
  title: string;
}

/** 레시피 좋아요 응답 DTO */
export interface RecipeLikeResponseDto {
  liked: boolean;
  likeCount: number;
}

/** 레시피 스크랩 응답 DTO */
export interface RecipeScrapResponseDto {
  scrapped: boolean;
}

/** 레시피 등록 및 수정 폼 입력 데이터 */
export type RecipeFormData = RecipeCreateRequestDto;
