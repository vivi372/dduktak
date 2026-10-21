package com.dduktak.domain.matching.service;

import com.dduktak.domain.inventory.entity.UserIngredient;
import com.dduktak.domain.recipe.entity.RecipeIngredient;
import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 스마트 매칭 점수 산출 및 하드 게이트 필터링 엔진 (MATCH-01, MATCH-02)
 */
@Component
public class MatchingCalculator {

    @Getter
    @Builder
    public static class MatchResult {
        private final boolean passedHardGate;
        private final int matchingRate;
        private final int bonusScore;
        private final List<String> matchIngredients;
        private final List<String> missingIngredients;
    }

    /**
     * 유저 냉장고 식재료와 레시피 필요 재료 목록을 비교하여 매칭 점수를 계산합니다.
     *
     * @param userIngredients 유저의 활성(ACTIVE) 냉장고 식재료 목록
     * @param recipeIngredients 레시피의 필요 식재료 목록
     * @return 매칭 결과 (하드게이트 통과 여부, 매칭률, 임박 가산점, 매칭/부족 재료 목록)
     */
    public MatchResult calculate(List<UserIngredient> userIngredients, List<RecipeIngredient> recipeIngredients) {
        if (recipeIngredients == null || recipeIngredients.isEmpty()) {
            return MatchResult.builder()
                    .passedHardGate(false)
                    .matchingRate(0)
                    .bonusScore(0)
                    .matchIngredients(Collections.emptyList())
                    .missingIngredients(Collections.emptyList())
                    .build();
        }

        // 유저 보유 마스터 식재료 ID Set
        Set<Long> userMasterIds = userIngredients.stream()
                .map(UserIngredient::getMasterIngredientId)
                .collect(Collectors.toSet());

        // 유저 보유 임박(0 <= dDay <= 3) 마스터 식재료 ID Set
        Set<Long> imminentMasterIds = userIngredients.stream()
                .filter(ui -> ui.getDDay() != null && ui.getDDay() >= 0 && ui.getDDay() <= 3)
                .map(UserIngredient::getMasterIngredientId)
                .collect(Collectors.toSet());

        // 레시피 재료 분류: 주재료(MAIN) vs 부재료(SUB)
        List<RecipeIngredient> mainIngredients = new ArrayList<>();
        List<RecipeIngredient> subIngredients = new ArrayList<>();

        for (RecipeIngredient ri : recipeIngredients) {
            if ("MAIN".equalsIgnoreCase(ri.getTypeCode())) {
                mainIngredients.add(ri);
            } else {
                subIngredients.add(ri);
            }
        }

        // -------------------------------------------------------------
        // 1. 주재료 필수 하드 게이트 (Hard Gate - MATCH-01-1)
        // -------------------------------------------------------------
        // 주재료가 정의되어 있는 경우, 최소 1개 이상을 유저 냉장고에 보유해야 함
        boolean hasAnyMain = false;
        if (mainIngredients.isEmpty()) {
            // 주재료가 없는 특수 레시피의 경우 게이트 통과 간주
            hasAnyMain = true;
        } else {
            for (RecipeIngredient main : mainIngredients) {
                if (userMasterIds.contains(main.getMasterIngredientId())) {
                    hasAnyMain = true;
                    break;
                }
            }
        }

        if (!hasAnyMain) {
            // 하드게이트 탈락: 매칭률 0% 및 목록 완전 제외 대상
            return MatchResult.builder()
                    .passedHardGate(false)
                    .matchingRate(0)
                    .bonusScore(0)
                    .matchIngredients(Collections.emptyList())
                    .missingIngredients(Collections.emptyList())
                    .build();
        }

        // -------------------------------------------------------------
        // 2. 기본 점수 (Base Score - 최대 100점) 계산
        // -------------------------------------------------------------
        double mainWeightTotal = 70.0;
        double subWeightTotal = 30.0;

        if (mainIngredients.isEmpty()) {
            subWeightTotal = 100.0;
        } else if (subIngredients.isEmpty()) {
            mainWeightTotal = 100.0;
        }

        double mainUnitWeight = mainIngredients.isEmpty() ? 0.0 : (mainWeightTotal / mainIngredients.size());
        double subUnitWeight = subIngredients.isEmpty() ? 0.0 : (subWeightTotal / subIngredients.size());

        double baseScore = 0.0;
        List<String> matchIngredients = new ArrayList<>();
        List<String> missingIngredients = new ArrayList<>();

        int imminentMainCount = 0;
        int imminentSubCount = 0;

        // 2.1 주재료 스코어링
        for (RecipeIngredient main : mainIngredients) {
            boolean isSauce = Boolean.TRUE.equals(main.getIsSauce());
            if (isSauce) {
                baseScore += mainUnitWeight * 1.0;
                matchIngredients.add(main.getName());
            } else if (userMasterIds.contains(main.getMasterIngredientId())) {
                baseScore += mainUnitWeight * 1.0;
                matchIngredients.add(main.getName());
                if (imminentMasterIds.contains(main.getMasterIngredientId())) {
                    imminentMainCount++;
                }
            } else if (main.getAltIngredientId() != null && userMasterIds.contains(main.getAltIngredientId())) {
                baseScore += mainUnitWeight * 0.7;
                matchIngredients.add(main.getName());
                if (imminentMasterIds.contains(main.getAltIngredientId())) {
                    imminentMainCount++;
                }
            } else if (Boolean.TRUE.equals(main.getIsOptional())) {
                baseScore += mainUnitWeight * 0.5;
                missingIngredients.add(main.getName());
            } else {
                missingIngredients.add(main.getName());
            }
        }

        // 2.2 부재료 스코어링
        for (RecipeIngredient sub : subIngredients) {
            boolean isSauce = Boolean.TRUE.equals(sub.getIsSauce());
            if (isSauce) {
                baseScore += subUnitWeight * 1.0;
                // 양념/소스는 상시 100% 충족이므로 missing에 추가하지 않음
            } else if (userMasterIds.contains(sub.getMasterIngredientId())) {
                baseScore += subUnitWeight * 1.0;
                matchIngredients.add(sub.getName());
                if (imminentMasterIds.contains(sub.getMasterIngredientId())) {
                    imminentSubCount++;
                }
            } else if (sub.getAltIngredientId() != null && userMasterIds.contains(sub.getAltIngredientId())) {
                baseScore += subUnitWeight * 0.7;
                matchIngredients.add(sub.getName());
                if (imminentMasterIds.contains(sub.getAltIngredientId())) {
                    imminentSubCount++;
                }
            } else if (Boolean.TRUE.equals(sub.getIsOptional())) {
                baseScore += subUnitWeight * 0.5;
                missingIngredients.add(sub.getName());
            } else {
                missingIngredients.add(sub.getName());
            }
        }

        // -------------------------------------------------------------
        // 3. 소비기한 임박 가산점 (Bonus Score - 최대 20점) 계산
        // -------------------------------------------------------------
        int rawBonus = (imminentMainCount * 10) + (imminentSubCount * 5);
        int bonusScore = Math.min(20, rawBonus);

        // -------------------------------------------------------------
        // 4. 최종 매칭 점수 합산 및 100점 캡핑
        // -------------------------------------------------------------
        int finalScore = (int) Math.min(100, Math.round(baseScore + bonusScore));

        return MatchResult.builder()
                .passedHardGate(true)
                .matchingRate(finalScore)
                .bonusScore(bonusScore)
                .matchIngredients(matchIngredients)
                .missingIngredients(missingIngredients)
                .build();
    }
}
