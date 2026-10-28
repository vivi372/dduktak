/**
 * 스마트 매칭 엔진(모듈 4) 및 FIFO 차감 관련 타입 & DTO 정의 (05_API_SPECIFICATION.md 3.4절)
 */

/** 식재료별 매칭 상태 구분 */
export type IngredientStatusType =
  | 'OWNED'       // 🟢 보유 중 (충분 또는 일부 보유)
  | 'DEFICIENT'   // 🔴 부족함 (미보유 또는 필요량 부족)
  | 'ALTERNATIVE' // 🟡 대체가능 (원본 미보유이나 대체재료 보유)
  | 'SAUCE';      // ⚪ 양념류 (상시 100% 충족 및 차감 제외)

/** 레시피 상세 화면용 식재료 매칭 상태 */
export interface IngredientMatchStatus {
  masterIngredientId: number;
  name: string;
  typeCode: 'MAIN' | 'SUB';
  /** 인분 계산 반영된 필요 수량 */
  requiredQuantity: number;
  /** 내 냉장고 보유 총 수량 */
  ownedQuantity: number;
  /** 부족 수량 (0 이상) */
  deficitQuantity: number;
  unit: string;
  status: IngredientStatusType;
  /** 대체 가능 여부 */
  hasAlternative: boolean;
  /** 대체 재료명 */
  altIngredientName?: string | null;
  /** 생략 가능 여부 */
  isOptional: boolean;
  /** 가장 임박한 소비기한 D-Day (임박 가산점 및 경고 표기용) */
  minDDay?: number | null;
}

/** 레시피 매칭 스코어 연산 결과 */
export interface RecipeMatchingScore {
  recipeId: number;
  /** 기본 재료 충족 점수 (최대 100점) */
  baseScore: number;
  /** 소비기한 임박 가산점 (D-0~D-3, 최대 20점) */
  bonusScore: number;
  /** 최종 매칭 점수 min(100, baseScore + bonusScore) */
  finalScore: number;
  /** 주재료 하드 게이트 통과 여부 (주재료 최소 1개 이상 보유) */
  isHardGatePassed: boolean;
  /** 보유 중인 주재료 개수 */
  matchedMainCount: number;
  /** 임박 재료명 목록 (D-0 ~ D-3) */
  urgentIngredients: string[];
  /** 각 재료별 매칭 상태 리스트 */
  ingredientStatuses: IngredientMatchStatus[];
}

/** FIFO 차감 예정 품목 (2차 확인 모달용) */
export interface FifoDeductionItem {
  masterIngredientId: number;
  name: string;
  unit: string;
  /** 냉장고 총 보유 수량 */
  currentStock: number;
  /** 차감 예정 수량 (사용자가 직접 조절 가능) */
  toDeductQuantity: number;
  /** 차감 후 예상 잔여 수량 */
  remainingStock: number;
  /** 보유량 부족으로 인한 부분 차감 여부 */
  isPartial: boolean;
  /** 양념/소스류 차감 제외 여부 (항상 제외) */
  isSauceExcluded: boolean;
}

/** 스마트 매칭 추천 쿼리 파라미터 (GET /api/v1/matching/recommendations) */
export interface MatchingQueryParams {
  recipeCategoryId?: number;
  page?: number;
  size?: number;
}

/** 스마트 매칭 추천 레시피 응답 DTO (GET /api/v1/matching/recommendations) */
export interface MatchingRecommendationResponseDto {
  recipeId: number;
  title: string;
  thumbnailUrl: string;
  cookingTime: number;
  difficulty: string;
  matchingRate: number;
  matchIngredients: string[];
  missingIngredients: string[];
}
export type RecipeRecommendation = MatchingRecommendationResponseDto;

/** 뚝딱 요리 완료 요청 DTO (POST /api/v1/matching/cook/:recipeId) */
export interface CookRequestDto {
  /** 냉장고 식재료 선입선출(FIFO) 차감 여부 (기본값 true, false 시 cookedCount만 증가) */
  deductInventory?: boolean;
  /** 조리 인분 수 (기본값 1) */
  servings?: number;
  /** 사용자가 2단계 검수 모달에서 직접 조정한 식재료별 차감 수량 (Key: masterIngredientId, Value: 차감 수량) */
  customDeductions?: Record<number, number>;
}

/** 요리 완료 시 차감된 식재료 정보 DTO */
export interface DeductedIngredientDto {
  name: string;
  deductedQuantity: number;
  remainingQuantity: number;
}

/** 뚝딱 요리 완료 응답 DTO (POST /api/v1/matching/cook/:recipeId) */
export interface CookResponseDto {
  recipeId: number;
  isDeducted: boolean;
  cookedCount: number;
  deductedIngredients: DeductedIngredientDto[];
}
