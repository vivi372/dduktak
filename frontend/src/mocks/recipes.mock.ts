import type { RecipeCategory, RecipeRecommendation, RecipeSummary } from '@/types/recipe';

/** 목 데이터: 레시피 카테고리 */
export const mockRecipeCategories: RecipeCategory[] = [
  { recipeCategoryId: 0, categoryName: '전체', displayOrder: 0 },
  { recipeCategoryId: 1, categoryName: '국/찌개/탕', displayOrder: 1 },
  { recipeCategoryId: 2, categoryName: '메인반찬', displayOrder: 2 },
  { recipeCategoryId: 3, categoryName: '면/파스타', displayOrder: 3 },
  { recipeCategoryId: 4, categoryName: '한그릇/밥', displayOrder: 4 },
  { recipeCategoryId: 5, categoryName: '샐러드', displayOrder: 5 },
];

/** 목 데이터: 커뮤니티 레시피 (썸네일은 public/mocks 정적 이미지) */
export const mockRecipes: RecipeRecommendation[] = [
  {
    recipeId: 1, recipeCategoryId: 4, categoryName: '한그릇/밥', title: '계란볶음밥',
    thumbnailUrl: '/mocks/egg-fried-rice.jpg', cookingTime: 15, difficulty: '쉬움',
    likeCount: 128, cookedCount: 54, authorNickname: '셰프', authorTag: '1024',
    matchingRate: 90, matchIngredients: ['계란', '대파'], missingIngredients: ['찬밥'],
  },
  {
    recipeId: 2, recipeCategoryId: 1, categoryName: '국/찌개/탕', title: '돼지고기 김치찌개',
    thumbnailUrl: '/mocks/kimchi-stew.jpg', cookingTime: 30, difficulty: '보통',
    likeCount: 256, cookedCount: 112, authorNickname: '자취9단', authorTag: '2048',
    matchingRate: 75, matchIngredients: ['두부', '대파'], missingIngredients: ['김치', '돼지고기'],
  },
  {
    recipeId: 3, recipeCategoryId: 3, categoryName: '면/파스타', title: '방울토마토 파스타',
    thumbnailUrl: '/mocks/tomato-pasta.jpg', cookingTime: 20, difficulty: '쉬움',
    likeCount: 87, cookedCount: 33, authorNickname: '파스타러버', authorTag: '3072',
    matchingRate: 40, matchIngredients: ['양파'], missingIngredients: ['스파게티면', '방울토마토', '바질'],
  },
  {
    recipeId: 4, recipeCategoryId: 5, categoryName: '샐러드', title: '닭가슴살 에그 샐러드',
    thumbnailUrl: '/mocks/salad-bowl.jpg', cookingTime: 10, difficulty: '쉬움',
    likeCount: 64, cookedCount: 21, authorNickname: '다이어터', authorTag: '4096',
    matchingRate: 55, matchIngredients: ['계란'], missingIngredients: ['닭가슴살', '로메인'],
  },
];

/** 인기 순(좋아요 내림차순)으로 정렬된 요약 목록 (홈 '지금 인기있는 뚝딱 요리') */
export const mockPopularRecipes: RecipeSummary[] = [...mockRecipes].sort(
  (a, b) => b.likeCount - a.likeCount,
);
