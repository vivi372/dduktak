/** 레시피 카테고리 (GET /api/v1/recipes/categories) */
export interface RecipeCategory {
  recipeCategoryId: number;
  categoryName: string;
  displayOrder: number;
}

/** 레시피 목록 항목 (GET /api/v1/recipes) */
export interface RecipeSummary {
  recipeId: number;
  recipeCategoryId: number;
  categoryName: string;
  title: string;
  thumbnailUrl: string;
  cookingTime: number; // 분
  difficulty: '쉬움' | '보통' | '어려움';
  likeCount: number;
  cookedCount: number;
  authorNickname: string;
  authorTag: string;
}

/** 맞춤 추천 항목 (GET /api/v1/matching/recommendations) */
export interface RecipeRecommendation extends RecipeSummary {
  matchingRate: number; // 0~100 (%)
  matchIngredients: string[];
  missingIngredients: string[];
}
