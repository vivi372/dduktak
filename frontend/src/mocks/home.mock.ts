import type { HomeBriefing } from '@/types/home';

/** 목 데이터: 메인 브리핑 (재료 보유 상태) */
export const mockHomeBriefing: HomeBriefing = {
  nickname: '뚝딱이',
  expiringIngredientsCount: 2,
  imminentIngredients: [
    { ingredientId: 10, name: '계란', dDay: 2 },
    { ingredientId: 11, name: '대파', dDay: 3 },
    { ingredientId: 12, name: '우유', dDay: 5 },
  ],
  topRecipe: { recipeId: 1, title: '계란볶음밥', matchingRate: 90 },
};

/** 목 데이터: 재료 0개 신규 유저 폴백 (인기 레시피 1건, 매칭률 0%) */
export const mockEmptyHomeBriefing: HomeBriefing = {
  nickname: '뚝딱이',
  expiringIngredientsCount: 0,
  imminentIngredients: [],
  topRecipe: { recipeId: 2, title: '돼지고기 김치찌개', matchingRate: 0 },
};
