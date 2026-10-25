/**
 * 메인 홈 화면 DTO 및 모델 타입 정의 (05_API_SPECIFICATION.md 3.6절)
 */

/** 임박 재료 요약 항목 */
export interface ImminentIngredient {
  /** 식재료 식별자 */
  ingredientId: number;
  /** 식재료명 */
  name: string;
  /** 소비기한 잔여 일수 (0 <= D-Day <= 3) */
  dDay: number;
}

/** 메인 홈 브리핑용 최고 매칭 또는 인기 레시피 폴백 */
export interface BriefingTopRecipe {
  /** 레시피 식별자 */
  recipeId: number;
  /** 레시피 제목 */
  title: string;
  /** 대표 썸네일 이미지 URL */
  thumbnailUrl?: string;
  /** 조리 소요 시간 (분) */
  cookingTime?: number;
  /** 조리 난이도 ('쉬움', '보통', '조금복잡') */
  difficulty?: string;
  /** 매칭 점수 (0 ~ 100%, 0개 폴백 시 0%) */
  matchingRate: number;
}

/** 메인 화면 종합 브리핑 응답 모델 (GET /api/v1/home/briefing) */
export interface HomeBriefing {
  /** 유저 닉네임 */
  nickname: string;
  /** 0 <= D-Day <= 3 범위 임박 식재료 수 */
  expiringIngredientsCount: number;
  /** 임박 식재료 상위 3개 목록 */
  imminentIngredients: ImminentIngredient[];
  /** 최고 매칭 추천 또는 인기 레시피 폴백 */
  topRecipe: BriefingTopRecipe | null;
}
