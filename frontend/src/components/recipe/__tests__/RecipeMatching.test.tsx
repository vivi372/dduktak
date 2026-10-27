import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { calculateRecipeMatching, calculateFifoDeductionItems } from '@/utils/matchingCalculator';
import { ServingsCalculator } from '@/components/recipe/ServingsCalculator';
import { CookConfirmationModal } from '@/components/recipe/CookConfirmationModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { InventoryItem } from '@/types/inventory';
import type { RecipeDetail } from '@/types/recipe';

// 테스트용 유저 냉장고 더미
const testInventory: InventoryItem[] = [
  {
    ingredientId: 1,
    masterIngredientId: 18, // 계란 (주재료)
    categoryId: 2,
    name: '계란',
    storageType: 'REFRIGERATED',
    quantity: 5,
    unit: '개',
    expireDate: '2026-10-25',
    dDay: 2, // D-2 (임박 가산점 대상: +10)
  },
  {
    ingredientId: 2,
    masterIngredientId: 2, // 대파 (부재료)
    categoryId: 1,
    name: '대파',
    storageType: 'REFRIGERATED',
    quantity: 2,
    unit: '뿌리',
    expireDate: '2026-10-26',
    dDay: 3, // D-3 (임박 가산점 대상: +5)
  },
];

// 테스트 전용 레시피 더미 데이터 (외부 mock 의존성 제거)
const testRecipeDetails: RecipeDetail[] = [
  {
    recipeId: 1,
    recipeCategoryId: 1,
    categoryName: '한그릇/밥',
    title: '계란 볶음밥',
    description: '간단하고 맛있는 계란볶음밥',
    servings: 1,
    cookingTime: 15,
    difficulty: '쉬움',
    thumbnailUrl: '',
    likeCount: 10,
    cookedCount: 20,
    authorNickname: '셰프',
    authorTag: '1234',
    isLiked: false,
    isScrapped: false,
    ingredients: [
      {
        recipeIngId: 1,
        masterIngredientId: 18,
        altIngredientId: null,
        categoryId: 2,
        name: '계란',
        quantity: 2,
        unit: '개',
        typeCode: 'MAIN',
        isOptional: false,
      },
    ],
    steps: [
      { stepNo: 1, description: '밥을 볶습니다.', imageUrl: null },
    ],
  },
  {
    recipeId: 3,
    recipeCategoryId: 1,
    categoryName: '한그릇/밥',
    title: '스팸김치볶음밥',
    description: '스팸김치볶음밥',
    servings: 1,
    cookingTime: 20,
    difficulty: '쉬움',
    thumbnailUrl: '',
    likeCount: 5,
    cookedCount: 10,
    authorNickname: '셰프',
    authorTag: '1234',
    isLiked: false,
    isScrapped: false,
    ingredients: [
      {
        recipeIngId: 2,
        masterIngredientId: 13,
        altIngredientId: null,
        categoryId: 2,
        name: '스팸',
        quantity: 1,
        unit: '개',
        typeCode: 'MAIN',
        isOptional: false,
      },
      {
        recipeIngId: 3,
        masterIngredientId: 19,
        altIngredientId: null,
        categoryId: 5,
        name: '배추김치',
        quantity: 100,
        unit: 'g',
        typeCode: 'MAIN',
        isOptional: false,
      },
    ],
    steps: [{ stepNo: 1, description: '볶습니다.', imageUrl: null }],
  },
  {
    recipeId: 6,
    recipeCategoryId: 3,
    categoryName: '반찬/나물/조림',
    title: '촉촉한 계란말이',
    description: '부드러운 계란말이',
    servings: 1,
    cookingTime: 15,
    difficulty: '보통',
    thumbnailUrl: '',
    likeCount: 8,
    cookedCount: 12,
    authorNickname: '셰프',
    authorTag: '1234',
    isLiked: false,
    isScrapped: false,
    ingredients: [
      {
        recipeIngId: 4,
        masterIngredientId: 18,
        altIngredientId: null,
        categoryId: 2,
        name: '계란',
        quantity: 3,
        unit: '개',
        typeCode: 'MAIN',
        isOptional: false,
      },
      {
        recipeIngId: 5,
        masterIngredientId: 2,
        altIngredientId: null,
        categoryId: 1,
        name: '대파',
        quantity: 1,
        unit: '뿌리',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 6,
        masterIngredientId: 86,
        altIngredientId: null,
        categoryId: 6,
        name: '소금',
        quantity: 2,
        unit: 'g',
        typeCode: 'SUB',
        isOptional: false,
      },
      {
        recipeIngId: 7,
        masterIngredientId: 28,
        altIngredientId: null,
        categoryId: 6,
        name: '식용유',
        quantity: 5,
        unit: 'ml',
        typeCode: 'SUB',
        isOptional: false,
      },
    ],
    steps: [{ stepNo: 1, description: '말아줍니다.', imageUrl: null }],
  },
];

describe('스마트 매칭 엔진 알고리즘 (module_04_matching.md) 검증', () => {
  it('주재료를 1개도 보유하지 않은 경우 Hard Gate에 의해 매칭 점수가 0%여야 한다', () => {
    // 스팸김치볶음밥 (주재료: 스팸, 김치) - testInventory에 주재료 0개
    const spamRiceRecipe = testRecipeDetails.find((r) => r.recipeId === 3)!;
    const result = calculateRecipeMatching(spamRiceRecipe, testInventory);

    expect(result.isHardGatePassed).toBe(false);
    expect(result.finalScore).toBe(0);
  });

  it('주재료 보유 시 점수 계산 및 소비기한 임박 가산점(+10, +5)이 정상 합산되어야 한다', () => {
    // 촉촉한 계란말이 (주재료: 계란 / 부재료: 대파, 소금, 식용유)
    const eggRollRecipe = testRecipeDetails.find((r) => r.recipeId === 6)!;
    const result = calculateRecipeMatching(eggRollRecipe, testInventory);

    expect(result.isHardGatePassed).toBe(true);
    expect(result.bonusScore).toBeGreaterThan(0); // 계란(D-2), 대파(D-3) 가산점
    expect(result.finalScore).toBeGreaterThanOrEqual(70);
  });

  it('양념/소스류는 차감 대상에서 자동 제외되어 toDeductQuantity가 0이어야 한다', () => {
    const eggRollRecipe = testRecipeDetails.find((r) => r.recipeId === 6)!;
    const deductions = calculateFifoDeductionItems(eggRollRecipe, 1, testInventory);

    const saltItem = deductions.find((d) => d.name === '소금');
    const oilItem = deductions.find((d) => d.name === '식용유');

    expect(saltItem?.isSauceExcluded).toBe(true);
    expect(saltItem?.toDeductQuantity).toBe(0);
    expect(oilItem?.isSauceExcluded).toBe(true);
    expect(oilItem?.toDeductQuantity).toBe(0);
  });
});

describe('인분 변환 계산기 (ServingsCalculator) 단위 테스트', () => {
  it('+ 버튼 클릭 시 인분 증가 콜백이 올바른 값으로 호출되어야 한다', () => {
    const onChange = vi.fn();
    render(<ServingsCalculator servings={1} onChange={onChange} />);

    const plusBtn = screen.getByLabelText('1인분 증가');
    fireEvent.click(plusBtn);

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('1인분일 때 - 버튼이 비활성화되어 있어야 한다', () => {
    const onChange = vi.fn();
    render(<ServingsCalculator servings={1} min={1} onChange={onChange} />);

    const minusBtn = screen.getByLabelText('1인분 감소');
    expect(minusBtn).toBeDisabled();
  });
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('요리하기 2차 확인 차감 모달 (CookConfirmationModal) 인터랙션 테스트', () => {
  it('모달 오픈 시 1단계 2-Way 옵션이 렌더링되어야 한다', () => {
    const recipe = testRecipeDetails[0];
    renderWithClient(
      <CookConfirmationModal
        open={true}
        onClose={vi.fn()}
        recipe={recipe}
        onConfirmCook={vi.fn()}
      />,
    );

    expect(screen.getByText('이 레시피로 요리하기 🍳')).toBeInTheDocument();
    expect(screen.getByText('재료 자동으로 차감하고 요리하기')).toBeInTheDocument();
    expect(screen.getByText('차감 없이 요리 완료 기록만 하기')).toBeInTheDocument();
  });

  it('재료 자동으로 차감하고 요리하기 선택 후 다음 단계로 이동하면 차감 검수 화면이 나와야 한다', () => {
    const recipe = testRecipeDetails[0];
    renderWithClient(
      <CookConfirmationModal
        open={true}
        onClose={vi.fn()}
        recipe={recipe}
        onConfirmCook={vi.fn()}
      />,
    );

    const nextBtn = screen.getByText('차감 내역 확인하기');
    fireEvent.click(nextBtn);

    expect(screen.getByText('냉장고 재료 차감 검수')).toBeInTheDocument();
    expect(screen.getByText('임박한 재료부터 자동 차감')).toBeInTheDocument();
  });
});
