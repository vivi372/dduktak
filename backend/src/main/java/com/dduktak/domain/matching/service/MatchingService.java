package com.dduktak.domain.matching.service;

import com.dduktak.domain.auth.entity.Profile;
import com.dduktak.domain.auth.repository.ProfileRepository;
import com.dduktak.domain.inventory.entity.UserIngredient;
import com.dduktak.domain.inventory.repository.UserIngredientRepository;
import com.dduktak.domain.matching.dto.*;
import com.dduktak.domain.notification.entity.NotificationType;
import com.dduktak.domain.notification.service.NotificationService;
import com.dduktak.domain.recipe.entity.Recipe;
import com.dduktak.domain.recipe.entity.RecipeIngredient;
import com.dduktak.domain.recipe.repository.RecipeIngredientRepository;
import com.dduktak.domain.recipe.repository.RecipeRepository;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 스마트 매칭 엔진 및 선입선출(FIFO) 차감 서비스 (모듈 4)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MatchingService {

    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final UserIngredientRepository userIngredientRepository;
    private final MatchingCalculator matchingCalculator;
    private final ProfileRepository profileRepository;
    private final NotificationService notificationService;

    @Getter
    @Builder
    private static class RecipeMatchCandidate {
        private final Recipe recipe;
        private final int matchingRate;
        private final int bonusScore;
        private final List<String> matchIngredients;
        private final List<String> missingIngredients;
    }

    /**
     * 내 냉장고 기반 맞춤 레시피 추천 (하드 게이트, 가중치 산출 및 정렬)
     */
    public List<MatchingRecommendationResponseDto> getRecommendations(
            UUID userId, Long recipeCategoryId, int page, int size
    ) {
        if (page < 0) page = 0;
        if (size <= 0) size = 10;

        // 1. 유저의 현재 활성(ACTIVE) 냉장고 식재료 조회 (D-Day 포함)
        List<UserIngredient> userIngredients = userIngredientRepository.findAllByUserIdAndFilter(
                userId, null, null, null, "ACTIVE"
        );

        if (userIngredients.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. 추천 대상 레시피 조회 (카테고리 필터 반영)
        List<Recipe> recipes = recipeRepository.findAllForMatching(recipeCategoryId);
        if (recipes.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> recipeIds = recipes.stream().map(Recipe::getRecipeId).collect(Collectors.toList());
        List<RecipeIngredient> allIngredients = recipeIngredientRepository.findByRecipeIds(recipeIds);
        Map<Long, List<RecipeIngredient>> ingredientMap = allIngredients.stream()
                .collect(Collectors.groupingBy(RecipeIngredient::getRecipeId));

        // 3. 각 레시피별 매칭 스코어링 및 하드게이트 필터링
        List<RecipeMatchCandidate> candidates = new ArrayList<>();
        for (Recipe recipe : recipes) {
            List<RecipeIngredient> ingList = ingredientMap.getOrDefault(recipe.getRecipeId(), Collections.emptyList());
            MatchingCalculator.MatchResult matchResult = matchingCalculator.calculate(userIngredients, ingList);

            // 하드게이트 탈락 레시피는 추천 목록에서 완전 제외
            if (!matchResult.isPassedHardGate() || matchResult.getMatchingRate() <= 0) {
                continue;
            }

            candidates.add(RecipeMatchCandidate.builder()
                    .recipe(recipe)
                    .matchingRate(matchResult.getMatchingRate())
                    .bonusScore(matchResult.getBonusScore())
                    .matchIngredients(matchResult.getMatchIngredients())
                    .missingIngredients(matchResult.getMissingIngredients())
                    .build());
        }

        // 4. 정렬: a. 최종 매칭 점수 DESC -> b. 임박 가산점 DESC -> c. 인기순 (cooked + like) DESC
        candidates.sort((c1, c2) -> {
            if (c1.getMatchingRate() != c2.getMatchingRate()) {
                return Integer.compare(c2.getMatchingRate(), c1.getMatchingRate());
            }
            if (c1.getBonusScore() != c2.getBonusScore()) {
                return Integer.compare(c2.getBonusScore(), c1.getBonusScore());
            }
            int pop1 = (c1.getRecipe().getCookedCount() != null ? c1.getRecipe().getCookedCount() : 0)
                    + (c1.getRecipe().getLikeCount() != null ? c1.getRecipe().getLikeCount() : 0);
            int pop2 = (c2.getRecipe().getCookedCount() != null ? c2.getRecipe().getCookedCount() : 0)
                    + (c2.getRecipe().getLikeCount() != null ? c2.getRecipe().getLikeCount() : 0);
            return Integer.compare(pop2, pop1);
        });

        // 5. 페이징 슬라이싱
        int fromIndex = page * size;
        if (fromIndex >= candidates.size()) {
            return Collections.emptyList();
        }
        int toIndex = Math.min(fromIndex + size, candidates.size());
        List<RecipeMatchCandidate> pagedCandidates = candidates.subList(fromIndex, toIndex);

        return pagedCandidates.stream()
                .map(c -> MatchingRecommendationResponseDto.builder()
                        .recipeId(c.getRecipe().getRecipeId())
                        .title(c.getRecipe().getTitle())
                        .thumbnailUrl(c.getRecipe().getThumbnailUrl())
                        .cookingTime(c.getRecipe().getCookingTime())
                        .difficulty(c.getRecipe().getDifficulty())
                        .matchingRate(c.getMatchingRate())
                        .matchIngredients(c.getMatchIngredients())
                        .missingIngredients(c.getMissingIngredients())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 뚝딱 요리 완료 및 선입선출(FIFO) 차감 (2-Way 옵션, No-Mixing 혼합차감 금지, 양념류 제외)
     */
    @Transactional
    public CookResponseDto cookRecipe(UUID userId, Long recipeId, CookRequestDto dto) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new CustomException(ErrorCode.RECIPE_WARN_NOT_FOUND));

        boolean deductInventory = dto != null && Boolean.TRUE.equals(dto.getDeductInventory());
        int servings = (dto != null && dto.getServings() != null && dto.getServings() > 0) ? dto.getServings() : 1;

        // 옵션 1. 차감 없이 요리 완료만 기록 (deductInventory = false)
        if (!deductInventory) {
            recipeRepository.incrementCookedCount(recipeId);
            int cookedCount = recipeRepository.findById(recipeId).map(Recipe::getCookedCount).orElse(1);

            // [모듈 5 연동] 요리완료 소셜 알림 발송 (자추 스킵 및 방해금지 판정은 NotificationService 내부에서 수행)
            sendCookedNotification(userId, recipe);

            return CookResponseDto.builder()
                    .recipeId(recipeId)
                    .isDeducted(false)
                    .cookedCount(cookedCount)
                    .deductedIngredients(Collections.emptyList())
                    .build();
        }

        // 옵션 2. 내 냉장고 재료 선입선출(FIFO) 차감 및 요리 완료 기록
        List<RecipeIngredient> recipeIngredients = recipeIngredientRepository.findByRecipeId(recipeId);
        BigDecimal servingRatio = BigDecimal.valueOf(servings)
                .divide(BigDecimal.valueOf(Math.max(1, recipe.getServings())), 4, RoundingMode.HALF_UP);

        List<DeductedIngredientDto> deductedList = new ArrayList<>();

        for (RecipeIngredient ri : recipeIngredients) {
            // [원칙 2] 양념/소스 카테고리(is_sauce = TRUE)는 차감 대상에서 자동 제외
            if (Boolean.TRUE.equals(ri.getIsSauce())) {
                continue;
            }

            // [DEF-01 보완] 사용자가 2단계 검수 모달에서 수동 조정한 수량이 전달된 경우 최우선 반영
            BigDecimal needQty;
            if (dto.getCustomDeductions() != null
                    && dto.getCustomDeductions().containsKey(ri.getMasterIngredientId())) {
                BigDecimal customVal = dto.getCustomDeductions().get(ri.getMasterIngredientId());
                needQty = (customVal != null)
                        ? customVal.setScale(2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;
            } else {
                needQty = ri.getQuantity().multiply(servingRatio).setScale(2, RoundingMode.HALF_UP);
            }

            if (needQty.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal remainingNeed = needQty;
            BigDecimal totalDeducted = BigDecimal.ZERO;
            Long targetMasterId = ri.getMasterIngredientId();

            // [원칙 1] 원본 재료 최우선 FIFO 차감
            List<UserIngredient> originalStocks = userIngredientRepository.findActiveByUserIdAndMasterId(
                    userId, ri.getMasterIngredientId()
            );

            if (!originalStocks.isEmpty()) {
                // 원본 재료가 존재하면 원본 재료에서만 FIFO 차감 진행
                for (UserIngredient stock : originalStocks) {
                    if (remainingNeed.compareTo(BigDecimal.ZERO) <= 0) {
                        break;
                    }
                    BigDecimal curr = stock.getQuantity();
                    if (curr.compareTo(remainingNeed) <= 0) {
                        userIngredientRepository.updateQuantityAndStatus(stock.getIngredientId(), userId, BigDecimal.ZERO, "CONSUMED");
                        totalDeducted = totalDeducted.add(curr);
                        remainingNeed = remainingNeed.subtract(curr);
                    } else {
                        BigDecimal left = curr.subtract(remainingNeed);
                        userIngredientRepository.updateQuantityAndStatus(stock.getIngredientId(), userId, left, "ACTIVE");
                        totalDeducted = totalDeducted.add(remainingNeed);
                        remainingNeed = BigDecimal.ZERO;
                    }
                }
                // [No-Mixing] 수량이 부족하더라도 보유분만 전량 차감(Partial Deduction)하며 대체 재료로 이어서 섞지 않음
            } else if (ri.getAltIngredientId() != null) {
                // 원본 재료를 0개 보유한 경우에 한해, 대체 재료 단독 FIFO 차감 수행
                targetMasterId = ri.getAltIngredientId();
                List<UserIngredient> altStocks = userIngredientRepository.findActiveByUserIdAndMasterId(
                        userId, ri.getAltIngredientId()
                );
                for (UserIngredient stock : altStocks) {
                    if (remainingNeed.compareTo(BigDecimal.ZERO) <= 0) {
                        break;
                    }
                    BigDecimal curr = stock.getQuantity();
                    if (curr.compareTo(remainingNeed) <= 0) {
                        userIngredientRepository.updateQuantityAndStatus(stock.getIngredientId(), userId, BigDecimal.ZERO, "CONSUMED");
                        totalDeducted = totalDeducted.add(curr);
                        remainingNeed = remainingNeed.subtract(curr);
                    } else {
                        BigDecimal left = curr.subtract(remainingNeed);
                        userIngredientRepository.updateQuantityAndStatus(stock.getIngredientId(), userId, left, "ACTIVE");
                        totalDeducted = totalDeducted.add(remainingNeed);
                        remainingNeed = BigDecimal.ZERO;
                    }
                }
            }

            // 실제로 차감된 수량이 있을 경우 응답 목록에 추가
            if (totalDeducted.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal remainingTotal = userIngredientRepository.findTotalQuantityByUserIdAndMasterId(
                        userId, targetMasterId
                );
                deductedList.add(DeductedIngredientDto.builder()
                        .name(ri.getName())
                        .deductedQuantity(totalDeducted)
                        .remainingQuantity(remainingTotal != null ? remainingTotal : BigDecimal.ZERO)
                        .build());
            }
        }

        // 원자적 요리완료 수 증가 (+1)
        recipeRepository.incrementCookedCount(recipeId);
        int updatedCookedCount = recipeRepository.findById(recipeId).map(Recipe::getCookedCount).orElse(1);

        // [모듈 5 연동] 요리완료 소셜 알림 발송 (자추 스킵 및 방해금지 판정은 NotificationService 내부에서 수행)
        sendCookedNotification(userId, recipe);

        return CookResponseDto.builder()
                .recipeId(recipeId)
                .isDeducted(true)
                .cookedCount(updatedCookedCount)
                .deductedIngredients(deductedList)
                .build();
    }

    /**
     * 요리완료 소셜 알림 발송 헬퍼 메서드
     */
    private void sendCookedNotification(UUID actorId, Recipe recipe) {
        if (recipe != null && recipe.getUserId() != null) {
            Profile actor = profileRepository.findById(actorId).orElse(null);
            String actorNickname = (actor != null) ? actor.getNickname() : "어떤 요리사";
            notificationService.sendSocialNotification(
                    recipe.getUserId(), actorId, NotificationType.COOKED_NOTICE,
                    recipe.getRecipeId(), recipe.getTitle(), actorNickname
            );
        }
    }
}
