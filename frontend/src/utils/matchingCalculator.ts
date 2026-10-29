/**
 * 스마트 매칭 엔진 및 FIFO 차감 클라이언트 연산 유틸리티
 * (module_04_matching.md 및 03_REQUIREMENTS_SUMMARY.md 공식 100% 구현)
 */

import type { RecipeDetail, RecipeIngredient } from '@/types/recipe';
import type {
  IngredientMatchStatus,
  RecipeMatchingScore,
  FifoDeductionItem,
} from '@/types/matching';
import type { InventoryItem } from '@/types/inventory';

/**
 * 특정 마스터 재료의 냉장고 총 보유 수량 및 가장 임박한 D-Day 조회
 * (소비기한 만료 재료 dDay < 0 는 정상 보유에서 배제)
 */
export function getInventoryStatusForIngredient(
  masterIngredientId: number,
  inventory: InventoryItem[] = [],
) {
  const activeItems = inventory.filter(
    (item) => item.masterIngredientId === masterIngredientId && item.dDay >= 0,
  );

  const totalQuantity = activeItems.reduce((acc, cur) => acc + cur.quantity, 0);
  const minDDay =
    activeItems.length > 0 ? Math.min(...activeItems.map((item) => item.dDay)) : null;

  return { totalQuantity, minDDay, activeItems };
}

/**
 * 단일 재료의 보유/부족/대체/양념 상태 판별
 */
export function evaluateIngredientStatus(
  ingredient: RecipeIngredient,
  servingsRatio: number,
  inventory: InventoryItem[] = [],
): IngredientMatchStatus {
  const requiredQuantity = Number((ingredient.quantity * servingsRatio).toFixed(2));
  const isSauce = ingredient.categoryId === 6;

  // 1. 양념/소스류: 상시 100% 충족 및 차감 제외
  if (isSauce) {
    return {
      masterIngredientId: ingredient.masterIngredientId,
      name: ingredient.name,
      typeCode: ingredient.typeCode,
      requiredQuantity,
      ownedQuantity: requiredQuantity, // 상시 보유로 간주
      deficitQuantity: 0,
      unit: ingredient.unit,
      status: 'SAUCE',
      hasAlternative: false,
      altIngredientName: null,
      isOptional: ingredient.isOptional,
      minDDay: null,
    };
  }

  // 2. 일반 재료: 냉장고 보유 현황 조회
  const { totalQuantity, minDDay } = getInventoryStatusForIngredient(
    ingredient.masterIngredientId,
    inventory,
  );

  // 보유 중인 경우
  if (totalQuantity >= requiredQuantity) {
    return {
      masterIngredientId: ingredient.masterIngredientId,
      name: ingredient.name,
      typeCode: ingredient.typeCode,
      requiredQuantity,
      ownedQuantity: totalQuantity,
      deficitQuantity: 0,
      unit: ingredient.unit,
      status: 'OWNED',
      hasAlternative: !!ingredient.altIngredientName,
      altIngredientName: ingredient.altIngredientName ?? null,
      isOptional: ingredient.isOptional,
      minDDay,
    };
  }

  // 일부 보유 중인 경우
  if (totalQuantity > 0) {
    return {
      masterIngredientId: ingredient.masterIngredientId,
      name: ingredient.name,
      typeCode: ingredient.typeCode,
      requiredQuantity,
      ownedQuantity: totalQuantity,
      deficitQuantity: Number((requiredQuantity - totalQuantity).toFixed(2)),
      unit: ingredient.unit,
      status: 'DEFICIENT',
      hasAlternative: !!ingredient.altIngredientName,
      altIngredientName: ingredient.altIngredientName ?? null,
      isOptional: ingredient.isOptional,
      minDDay,
    };
  }

  // 3. 미보유 시 대체 재료 확인 (부재료 전용)
  if (ingredient.altIngredientId) {
    const altStatus = getInventoryStatusForIngredient(ingredient.altIngredientId, inventory);
    if (altStatus.totalQuantity > 0) {
      return {
        masterIngredientId: ingredient.masterIngredientId,
        name: ingredient.name,
        typeCode: ingredient.typeCode,
        requiredQuantity,
        ownedQuantity: 0,
        deficitQuantity: requiredQuantity,
        unit: ingredient.unit,
        status: 'ALTERNATIVE',
        hasAlternative: true,
        altIngredientName: ingredient.altIngredientName ?? '대체재료',
        isOptional: ingredient.isOptional,
        minDDay: altStatus.minDDay,
      };
    }
  }

  // 4. 완전 미보유
  return {
    masterIngredientId: ingredient.masterIngredientId,
    name: ingredient.name,
    typeCode: ingredient.typeCode,
    requiredQuantity,
    ownedQuantity: 0,
    deficitQuantity: requiredQuantity,
    unit: ingredient.unit,
    status: 'DEFICIENT',
    hasAlternative: !!ingredient.altIngredientName,
    altIngredientName: ingredient.altIngredientName ?? null,
    isOptional: ingredient.isOptional,
    minDDay: null,
  };
}

/**
 * 스마트 매칭 엔진 점수 산출 함수 (module_04_matching.md 공식 100% 구현)
 */
export function calculateRecipeMatching(
  recipe: RecipeDetail,
  inventory: InventoryItem[] = [],
  servings: number = recipe.servings,
): RecipeMatchingScore {
  const servingsRatio = servings / recipe.servings;
  const mainIngredients = recipe.ingredients.filter((i) => i.typeCode === 'MAIN');
  const subIngredients = recipe.ingredients.filter((i) => i.typeCode === 'SUB');

  const ingredientStatuses = recipe.ingredients.map((ing) =>
    evaluateIngredientStatus(ing, servingsRatio, inventory),
  );

  // [규칙 1] 주재료 필수 하드 필터 (Hard Gate)
  // 주재료 중 냉장고에 보유(totalQuantity > 0)된 것이 1개 이상 있어야 함
  const matchedMains = mainIngredients.filter((main) => {
    const { totalQuantity } = getInventoryStatusForIngredient(main.masterIngredientId, inventory);
    return totalQuantity > 0;
  });

  const isHardGatePassed = mainIngredients.length === 0 || matchedMains.length > 0;

  if (!isHardGatePassed) {
    return {
      recipeId: recipe.recipeId,
      baseScore: 0,
      bonusScore: 0,
      finalScore: 0,
      isHardGatePassed: false,
      matchedMainCount: 0,
      urgentIngredients: [],
      ingredientStatuses,
    };
  }

  // [규칙 2] 기본 재료 충족 점수 (Base Score - 최대 100점)
  // 백엔드 MatchingCalculator.java와 100% 동일한 가중치 및 스코어링 공식 적용
  let mainWeightTotal = 70.0;
  let subWeightTotal = 30.0;

  if (mainIngredients.length === 0) {
    subWeightTotal = 100.0;
  } else if (subIngredients.length === 0) {
    mainWeightTotal = 100.0;
  }

  const mainUnitWeight = mainIngredients.length === 0 ? 0.0 : mainWeightTotal / mainIngredients.length;
  const subUnitWeight = subIngredients.length === 0 ? 0.0 : subWeightTotal / subIngredients.length;

  let baseScore = 0.0;

  // 2.1 주재료 스코어링
  mainIngredients.forEach((main) => {
    const isSauce = main.isSauce || main.categoryId === 6;
    const { totalQuantity } = getInventoryStatusForIngredient(main.masterIngredientId, inventory);

    if (isSauce) {
      baseScore += mainUnitWeight * 1.0;
    } else if (totalQuantity > 0) {
      baseScore += mainUnitWeight * 1.0;
    } else if (main.altIngredientId) {
      const altStatus = getInventoryStatusForIngredient(main.altIngredientId, inventory);
      if (altStatus.totalQuantity > 0) {
        baseScore += mainUnitWeight * 0.7;
      } else if (main.isOptional) {
        baseScore += mainUnitWeight * 0.5;
      }
    } else if (main.isOptional) {
      baseScore += mainUnitWeight * 0.5;
    }
  });

  // 2.2 부재료 스코어링
  subIngredients.forEach((sub) => {
    const isSauce = sub.isSauce || sub.categoryId === 6;
    const { totalQuantity } = getInventoryStatusForIngredient(sub.masterIngredientId, inventory);

    if (isSauce) {
      baseScore += subUnitWeight * 1.0;
    } else if (totalQuantity > 0) {
      baseScore += subUnitWeight * 1.0;
    } else if (sub.altIngredientId) {
      const altStatus = getInventoryStatusForIngredient(sub.altIngredientId, inventory);
      if (altStatus.totalQuantity > 0) {
        baseScore += subUnitWeight * 0.7;
      } else if (sub.isOptional) {
        baseScore += subUnitWeight * 0.5;
      }
    } else if (sub.isOptional) {
      baseScore += subUnitWeight * 0.5;
    }
  });

  // [규칙 3] 소비기한 임박 가산점 (Bonus Score - 최대 20점)
  // D-0 ~ D-3 임박 주재료 +10점, 임박 부재료 +5점
  let bonusScore = 0;
  const urgentIngredients: string[] = [];

  mainIngredients.forEach((ing) => {
    const { minDDay } = getInventoryStatusForIngredient(ing.masterIngredientId, inventory);
    if (minDDay !== null && minDDay >= 0 && minDDay <= 3) {
      bonusScore += 10;
      urgentIngredients.push(ing.name);
    }
  });

  subIngredients.forEach((ing) => {
    if (ing.categoryId === 6) return; // 양념류는 임박 가산점 제외
    const { minDDay } = getInventoryStatusForIngredient(ing.masterIngredientId, inventory);
    if (minDDay !== null && minDDay >= 0 && minDDay <= 3) {
      bonusScore += 5;
      urgentIngredients.push(ing.name);
    }
  });

  const cappedBonus = Math.min(20, bonusScore);
  const finalScore = Math.min(100, Math.round(baseScore + cappedBonus));

  return {
    recipeId: recipe.recipeId,
    baseScore: Math.round(baseScore),
    bonusScore: cappedBonus,
    finalScore,
    isHardGatePassed: true,
    matchedMainCount: matchedMains.length,
    urgentIngredients,
    ingredientStatuses,
  };
}

/**
 * 모든 레시피의 매칭 스코어를 일괄 산출하여 Map으로 반환
 */
export function getAllRecipeMatchingScores(
  recipes: RecipeDetail[] = [],
  inventory: InventoryItem[] = [],
): Map<number, RecipeMatchingScore> {
  const scoreMap = new Map<number, RecipeMatchingScore>();
  recipes.forEach((recipe) => {
    scoreMap.set(recipe.recipeId, calculateRecipeMatching(recipe, inventory));
  });
  return scoreMap;
}

/**
 * FIFO 차감 예정 리스트 산출 (2-Step 요리하기 확인 모달용)
 */
export function calculateFifoDeductionItems(
  recipe: RecipeDetail,
  servings: number,
  inventory: InventoryItem[] = [],
): FifoDeductionItem[] {
  const servingsRatio = servings / recipe.servings;

  return recipe.ingredients.map((ing) => {
    const isSauce = ing.categoryId === 6;
    const requiredQuantity = Number((ing.quantity * servingsRatio).toFixed(1));
    const { totalQuantity } = getInventoryStatusForIngredient(ing.masterIngredientId, inventory);

    if (isSauce) {
      return {
        masterIngredientId: ing.masterIngredientId,
        name: ing.name,
        unit: ing.unit,
        currentStock: totalQuantity,
        toDeductQuantity: 0,
        remainingStock: totalQuantity,
        isPartial: false,
        isSauceExcluded: true,
      };
    }

    const toDeduct = Math.min(totalQuantity, requiredQuantity);
    const isPartial = totalQuantity < requiredQuantity;
    const remainingStock = Math.max(0, Number((totalQuantity - toDeduct).toFixed(1)));

    return {
      masterIngredientId: ing.masterIngredientId,
      name: ing.name,
      unit: ing.unit,
      currentStock: totalQuantity,
      toDeductQuantity: toDeduct,
      remainingStock,
      isPartial,
      isSauceExcluded: false,
    };
  });
}
