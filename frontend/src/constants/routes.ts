/** 앱 라우트 경로 상수 (하드코딩 방지) */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ONBOARDING: '/onboarding',
  INVENTORY: '/inventory',
  RECIPES: '/recipes',
  RECIPE_DETAIL: '/recipes/:id',
  RECIPE_NEW: '/recipes/new',
  RECIPE_EDIT: '/recipes/:id/edit',
  MYPAGE: '/mypage',
  NOTIFICATIONS: '/notifications',
  RESET_PASSWORD: '/reset-password',
} as const;

