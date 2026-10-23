import type { RecipeCategory, RecipeDetail, RecipeSummary } from '@/types/recipe';

/**
 * 8대 고정 레시피 카테고리 (recipe_category)
 * - 0번 '전체'는 탭 필터링 전용 가상 항목
 */
export const mockRecipeCategories: RecipeCategory[] = [
  { recipeCategoryId: 0, categoryName: '전체', displayOrder: 0 },
  { recipeCategoryId: 1, categoryName: '국/찌개/탕', displayOrder: 1 },
  { recipeCategoryId: 2, categoryName: '메인반찬', displayOrder: 2 },
  { recipeCategoryId: 3, categoryName: '밑반찬', displayOrder: 3 },
  { recipeCategoryId: 4, categoryName: '한그릇/밥', displayOrder: 4 },
  { recipeCategoryId: 5, categoryName: '면/만두', displayOrder: 5 },
  { recipeCategoryId: 6, categoryName: '간식/디저트', displayOrder: 6 },
  { recipeCategoryId: 7, categoryName: '안주/야식', displayOrder: 7 },
  { recipeCategoryId: 8, categoryName: '기타', displayOrder: 8 },
];

/**
 * 1인 가구 대표 레시피 목 데이터 (recipe_seed.md 기반 6선)
 * - 표준 마스터 식재료 74종 바인딩
 * - 주재료(MAIN) / 부재료(SUB) / 양념류(categoryId=6) 명확 구분
 * - 조리 순서(Step) 상세 및 썸네일 탑재
 */
export const mockRecipeDetails: RecipeDetail[] = [
  {
    recipeId: 1,
    recipeCategoryId: 4,
    categoryName: '한그릇/밥',
    title: '버터 간장계란밥',
    description: '5분 컷, 자취생 영원한 기본 소울푸드',
    servings: 1,
    cookingTime: 5,
    difficulty: '쉬움',
    thumbnailUrl: '/mocks/egg-fried-rice.jpg',
    likeCount: 342,
    cookedCount: 156,
    authorNickname: '셰프',
    authorTag: '1024',
    authorId: 'user-001',
    isLiked: true,
    isScrapped: false,
    createdAt: '2026-10-15',
    ingredients: [
      {
        recipeIngId: 101,
        masterIngredientId: 18, // 계란 (냉장고 보유: 25개)
        categoryId: 2,
        name: '계란',
        quantity: 1,
        unit: '개',
        typeCode: 'MAIN',
        isOptional: false,
      },
      {
        recipeIngId: 102,
        masterIngredientId: 46, // 밥 (공기밥 / 햇반) (냉장고 미보유)
        categoryId: 5,
        name: '밥 (공기밥 / 햇반)',
        quantity: 1,
        unit: '공기',
        typeCode: 'MAIN',
        isOptional: false,
      },
      {
        recipeIngId: 103,
        masterIngredientId: 64, // 진간장 (양념류)
        categoryId: 6,
        name: '진간장',
        quantity: 15,
        unit: 'ml',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 104,
        masterIngredientId: 68, // 참기름 (양념류)
        categoryId: 6,
        name: '참기름',
        quantity: 5,
        unit: 'ml',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 105,
        masterIngredientId: 42, // 버터 (부재료, 생략가능)
        categoryId: 4,
        name: '버터',
        quantity: 10,
        unit: 'g',
        typeCode: 'SUB',
        isOptional: true,
      },
    ],
    steps: [
      {
        stepNo: 1,
        description: '따뜻한 밥을 그릇에 담고 가운데를 살짝 파낸 뒤 버터를 올려 녹입니다.',
        imageUrl: null,
      },
      {
        stepNo: 2,
        description: '계란을 반숙이나 후라이로 노릇하게 구워 밥 위에 올립니다.',
        imageUrl: null,
      },
      {
        stepNo: 3,
        description: '진간장과 참기름을 기호에 맞게 넣고 숟가락으로 골고루 비벼 맛있게 먹습니다.',
        imageUrl: null,
      },
    ],
  },
  {
    recipeId: 2,
    recipeCategoryId: 4,
    categoryName: '한그릇/밥',
    title: '파기름 계란볶음밥',
    description: '파기름 + 굴소스 한 스푼으로 중화풍 감칠맛을 살린 볶음밥',
    servings: 1,
    cookingTime: 10,
    difficulty: '쉬움',
    thumbnailUrl: '/mocks/egg-fried-rice.jpg',
    likeCount: 512,
    cookedCount: 230,
    authorNickname: '자취9단',
    authorTag: '2048',
    authorId: 'user-002',
    isLiked: false,
    isScrapped: true,
    createdAt: '2026-10-16',
    ingredients: [
      {
        recipeIngId: 201,
        masterIngredientId: 18, // 계란 (보유)
        categoryId: 2,
        name: '계란',
        quantity: 2,
        unit: '개',
        typeCode: 'MAIN',
        isOptional: false,
      },
      {
        recipeIngId: 202,
        masterIngredientId: 46, // 밥
        categoryId: 5,
        name: '밥 (공기밥 / 햇반)',
        quantity: 1,
        unit: '공기',
        typeCode: 'MAIN',
        isOptional: false,
      },
      {
        recipeIngId: 203,
        masterIngredientId: 2, // 대파 (냉장고 보유: 1뿌리, 임박 D-3)
        categoryId: 1,
        name: '대파',
        quantity: 0.5,
        unit: '뿌리',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 204,
        masterIngredientId: 72, // 식용유 (양념류)
        categoryId: 6,
        name: '식용유',
        quantity: 15,
        unit: 'ml',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 205,
        masterIngredientId: 70, // 굴소스 (양념류)
        categoryId: 6,
        name: '굴소스',
        quantity: 10,
        unit: 'ml',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 206,
        masterIngredientId: 66, // 소금 (양념류)
        categoryId: 6,
        name: '소금',
        quantity: 2,
        unit: 'g',
        typeCode: 'SUB',
        isOptional: true,
      },
    ],
    steps: [
      {
        stepNo: 1,
        description: '팬에 식용유를 두르고 송송 썬 대파를 볶아 은은한 파기름을 냅니다.',
        imageUrl: null,
      },
      {
        stepNo: 2,
        description: '파를 팬 한쪽으로 치우고 빈 공간에 계란물을 부어 스크램블 에그를 만듭니다.',
        imageUrl: null,
      },
      {
        stepNo: 3,
        description: '밥을 넣고 주걱을 세워 밥알이 뭉치지 않게 골고루 볶아줍니다.',
        imageUrl: null,
      },
      {
        stepNo: 4,
        description: '팬 가장자리에 굴소스를 둘러 불향을 입힌 뒤 소금으로 간을 맞춰 마무리합니다.',
        imageUrl: null,
      },
    ],
  },
  {
    recipeId: 3,
    recipeCategoryId: 4,
    categoryName: '한그릇/밥',
    title: '스팸 김치볶음밥',
    description: '단짠 스팸과 신김치의 실패 없는 자취생 정석 조합',
    servings: 1,
    cookingTime: 15,
    difficulty: '쉬움',
    thumbnailUrl: '/mocks/tomato-pasta.jpg',
    likeCount: 420,
    cookedCount: 188,
    authorNickname: '볶음밥장인',
    authorTag: '3072',
    authorId: 'user-003',
    isLiked: false,
    isScrapped: false,
    createdAt: '2026-10-17',
    ingredients: [
      {
        recipeIngId: 301,
        masterIngredientId: 30, // 스팸 (미보유)
        categoryId: 2,
        name: '스팸',
        quantity: 0.5,
        unit: '개',
        typeCode: 'MAIN',
        isOptional: false,
      },
      {
        recipeIngId: 302,
        masterIngredientId: 51, // 배추김치 (미보유)
        categoryId: 5,
        name: '배추김치',
        quantity: 100,
        unit: 'g',
        typeCode: 'MAIN',
        isOptional: false,
      },
      {
        recipeIngId: 303,
        masterIngredientId: 46, // 밥
        categoryId: 5,
        name: '밥 (공기밥 / 햇반)',
        quantity: 1,
        unit: '공기',
        typeCode: 'MAIN',
        isOptional: false,
      },
      {
        recipeIngId: 304,
        masterIngredientId: 18, // 계란 (보유)
        categoryId: 2,
        name: '계란',
        quantity: 1,
        unit: '개',
        typeCode: 'SUB',
        isOptional: true,
      },
      {
        recipeIngId: 305,
        masterIngredientId: 2, // 대파 (보유, 대체: 양파)
        altIngredientId: 1,
        altIngredientName: '양파',
        categoryId: 1,
        name: '대파',
        quantity: 0.3,
        unit: '뿌리',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 306,
        masterIngredientId: 65, // 설탕 (양념류)
        categoryId: 6,
        name: '설탕',
        quantity: 5,
        unit: 'g',
        typeCode: 'SUB',
        isOptional: true,
      },
      {
        recipeIngId: 307,
        masterIngredientId: 68, // 참기름 (양념류)
        categoryId: 6,
        name: '참기름',
        quantity: 5,
        unit: 'ml',
        typeCode: 'SUB',
        isOptional: true,
      },
    ],
    steps: [
      {
        stepNo: 1,
        description: '스팸을 먹기 좋은 크기로 깍둑썰기하고, 대파는 송송 썹니다.',
        imageUrl: null,
      },
      {
        stepNo: 2,
        description: '팬에 식용유를 두르고 대파와 스팸을 노릇하게 볶아 기름을 냅니다.',
        imageUrl: null,
      },
      {
        stepNo: 3,
        description: '잘게 썬 김치와 설탕을 넣고 김치가 투명해질 때까지 볶아줍니다.',
        imageUrl: null,
      },
      {
        stepNo: 4,
        description: '밥을 넣고 골고루 볶은 뒤, 참기름을 두르고 계란후라이를 얹어 완성합니다.',
        imageUrl: null,
      },
    ],
  },
  {
    recipeId: 4,
    recipeCategoryId: 1,
    categoryName: '국/찌개/탕',
    title: '돼지고기 김치찌개',
    description: '진한 묵은지와 쫄깃한 돼지고기로 끓여낸 밥도둑 찌개',
    servings: 1,
    cookingTime: 25,
    difficulty: '보통',
    thumbnailUrl: '/mocks/kimchi-stew.jpg',
    likeCount: 680,
    cookedCount: 310,
    authorNickname: '뚝딱마스터',
    authorTag: '4096',
    authorId: 'user-004',
    isLiked: true,
    isScrapped: true,
    createdAt: '2026-10-18',
    ingredients: [
      {
        recipeIngId: 401,
        masterIngredientId: 20, // 돼지고기 (삼겹살/목살) (냉장고 보유: 800g, D-1 임박!)
        categoryId: 2,
        name: '돼지고기 (삼겹살/목살)',
        quantity: 150,
        unit: 'g',
        typeCode: 'MAIN',
        isOptional: false,
      },
      {
        recipeIngId: 402,
        masterIngredientId: 51, // 배추김치 (미보유)
        categoryId: 5,
        name: '배추김치',
        quantity: 150,
        unit: 'g',
        typeCode: 'MAIN',
        isOptional: false,
      },
      {
        recipeIngId: 403,
        masterIngredientId: 17, // 두부 (소비기한 만료 1모 보유)
        categoryId: 1,
        name: '두부',
        quantity: 0.5,
        unit: '모',
        typeCode: 'SUB',
        isOptional: true,
      },
      {
        recipeIngId: 404,
        masterIngredientId: 2, // 대파 (보유: 1뿌리)
        altIngredientId: 1,
        altIngredientName: '양파',
        categoryId: 1,
        name: '대파',
        quantity: 0.5,
        unit: '뿌리',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 405,
        masterIngredientId: 3, // 마늘 (양념)
        categoryId: 1,
        name: '마늘',
        quantity: 3,
        unit: '쪽',
        typeCode: 'SUB',
        isOptional: true,
      },
      {
        recipeIngId: 406,
        masterIngredientId: 63, // 고춧가루 (양념류)
        categoryId: 6,
        name: '고춧가루',
        quantity: 10,
        unit: 'g',
        typeCode: 'SUB',
        isOptional: true,
      },
      {
        recipeIngId: 407,
        masterIngredientId: 64, // 국간장 (양념류)
        categoryId: 6,
        name: '국간장',
        quantity: 10,
        unit: 'ml',
        typeCode: 'SUB',
        isOptional: false,
      },
    ],
    steps: [
      {
        stepNo: 1,
        description: '냄비에 돼지고기를 넣고 겉면이 하얗게 익을 때까지 먼저 볶습니다.',
        imageUrl: null,
      },
      {
        stepNo: 2,
        description: '쫑쫑 썬 김치와 다진 마늘을 넣고 김치가 나른해질 때까지 달달 볶아줍니다.',
        imageUrl: null,
      },
      {
        stepNo: 3,
        description: '물 400ml를 붓고 끓어오르면 중약불로 줄여 15분간 푹 끓여줍니다.',
        imageUrl: null,
      },
      {
        stepNo: 4,
        description: '두부와 송송 썬 대파, 고춧가루를 넣고 5분간 한소끔 더 끓여 완성합니다.',
        imageUrl: null,
      },
    ],
  },
  {
    recipeId: 5,
    recipeCategoryId: 2,
    categoryName: '메인반찬',
    title: '고추장 삼겹살 볶음',
    description: '매콤달콤 양념에 노릇하게 구워낸 밥반찬/술안주 뚝딱 메뉴',
    servings: 1,
    cookingTime: 20,
    difficulty: '보통',
    thumbnailUrl: '/mocks/salad-bowl.jpg',
    likeCount: 290,
    cookedCount: 142,
    authorNickname: '맛있는인생',
    authorTag: '5120',
    authorId: 'user-005',
    isLiked: false,
    isScrapped: false,
    createdAt: '2026-10-19',
    ingredients: [
      {
        recipeIngId: 501,
        masterIngredientId: 20, // 돼지고기 (삼겹살/목살) (보유: D-1 임박)
        categoryId: 2,
        name: '돼지고기 (삼겹살/목살)',
        quantity: 200,
        unit: 'g',
        typeCode: 'MAIN',
        isOptional: false,
      },
      {
        recipeIngId: 502,
        masterIngredientId: 1, // 양파 (보유: 5개)
        categoryId: 1,
        name: '양파',
        quantity: 0.5,
        unit: '개',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 503,
        masterIngredientId: 2, // 대파 (보유: 1뿌리)
        categoryId: 1,
        name: '대파',
        quantity: 0.5,
        unit: '뿌리',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 504,
        masterIngredientId: 61, // 고추장 (양념류)
        categoryId: 6,
        name: '고추장',
        quantity: 20,
        unit: 'g',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 505,
        masterIngredientId: 64, // 진간장 (양념류)
        categoryId: 6,
        name: '진간장',
        quantity: 10,
        unit: 'ml',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 506,
        masterIngredientId: 65, // 설탕 (양념류)
        categoryId: 6,
        name: '설탕',
        quantity: 10,
        unit: 'g',
        typeCode: 'SUB',
        isOptional: false,
      },
    ],
    steps: [
      {
        stepNo: 1,
        description: '고추장, 간장, 설탕, 다진마늘을 섞어 양념장을 만듭니다.',
        imageUrl: null,
      },
      {
        stepNo: 2,
        description: '달군 팬에 삼겹살을 노릇하게 구워 기름을 살짝 빼줍니다.',
        imageUrl: null,
      },
      {
        stepNo: 3,
        description: '썰어둔 양파와 대파를 넣고 고기와 함께 볶습니다.',
        imageUrl: null,
      },
      {
        stepNo: 4,
        description: '양념장을 붓고 센 불에서 빠르게 볶아 불향을 입혀 마무리합니다.',
        imageUrl: null,
      },
    ],
  },
  {
    recipeId: 6,
    recipeCategoryId: 3,
    categoryName: '밑반찬',
    title: '촉촉한 계란말이',
    description: '부드럽고 폭신한 기본 계란말이, 실패 없는 초간단 반찬',
    servings: 1,
    cookingTime: 10,
    difficulty: '쉬움',
    thumbnailUrl: '/mocks/egg-fried-rice.jpg',
    likeCount: 388,
    cookedCount: 204,
    authorNickname: '포근한식탁',
    authorTag: '6144',
    authorId: 'user-006',
    isLiked: false,
    isScrapped: false,
    createdAt: '2026-10-20',
    ingredients: [
      {
        recipeIngId: 601,
        masterIngredientId: 18, // 계란 (보유: 25개)
        categoryId: 2,
        name: '계란',
        quantity: 3,
        unit: '개',
        typeCode: 'MAIN',
        isOptional: false,
      },
      {
        recipeIngId: 602,
        masterIngredientId: 2, // 대파 (보유: 1뿌리)
        altIngredientId: 1,
        altIngredientName: '양파',
        categoryId: 1,
        name: '대파',
        quantity: 0.2,
        unit: '뿌리',
        typeCode: 'SUB',
        isOptional: true,
      },
      {
        recipeIngId: 603,
        masterIngredientId: 41, // 우유 (보유: 1)
        categoryId: 4,
        name: '우유',
        quantity: 30,
        unit: 'ml',
        typeCode: 'SUB',
        isOptional: true,
      },
      {
        recipeIngId: 604,
        masterIngredientId: 66, // 소금 (양념류)
        categoryId: 6,
        name: '소금',
        quantity: 2,
        unit: 'g',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 605,
        masterIngredientId: 72, // 식용유 (양념류)
        categoryId: 6,
        name: '식용유',
        quantity: 10,
        unit: 'ml',
        typeCode: 'SUB',
        isOptional: false,
      },
    ],
    steps: [
      {
        stepNo: 1,
        description: '볼에 계란을 풀고 우유, 소금, 잘게 다진 대파를 넣어 골고루 섞어줍니다.',
        imageUrl: null,
      },
      {
        stepNo: 2,
        description: '팬에 식용유를 두르고 키친타월로 가볍게 닦아낸 뒤 약불로 달굽니다.',
        imageUrl: null,
      },
      {
        stepNo: 3,
        description: '계란물을 3번에 나누어 부어가며 돌돌 말아줍니다.',
        imageUrl: null,
      },
      {
        stepNo: 4,
        description: '한 김 식힌 뒤 먹기 좋은 크기로 썰어냅니다.',
        imageUrl: null,
      },
    ],
  },
];

const defaultMatchingRates: Record<number, number> = {
  1: 85,
  2: 90,
  3: 40,
  4: 75,
  5: 95,
  6: 88,
};

/** 레시피 목록 요약 리스트 */
export const mockRecipes: RecipeSummary[] = mockRecipeDetails.map((r) => ({
  recipeId: r.recipeId,
  recipeCategoryId: r.recipeCategoryId,
  categoryName: r.categoryName,
  title: r.title,
  description: r.description,
  thumbnailUrl: r.thumbnailUrl,
  cookingTime: r.cookingTime,
  difficulty: r.difficulty,
  likeCount: r.likeCount,
  cookedCount: r.cookedCount,
  authorNickname: r.authorNickname,
  authorTag: r.authorTag,
  authorId: r.authorId,
  matchingRate: defaultMatchingRates[r.recipeId] ?? 70,
}));

/** 인기 순으로 정렬된 요약 목록 (홈 '지금 인기있는 뚝딱 요리') */
export const mockPopularRecipes: RecipeSummary[] = [...mockRecipes].sort(
  (a, b) => b.likeCount - a.likeCount,
);

