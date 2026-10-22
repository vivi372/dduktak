/** 임박 재료 요약 */
export interface ImminentIngredient {
  ingredientId: number;
  name: string;
  dDay: number;
}

/** 메인 화면 브리핑 (GET /api/v1/home/briefing) */
export interface HomeBriefing {
  nickname: string;
  expiringIngredientsCount: number; // 0 <= D-Day <= 3 범위만 집계
  imminentIngredients: ImminentIngredient[];
  topRecipe: {
    recipeId: number;
    title: string;
    matchingRate: number;
  } | null;
}
