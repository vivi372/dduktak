package com.dduktak.domain.home.service;

import com.dduktak.domain.auth.entity.Profile;
import com.dduktak.domain.auth.repository.ProfileRepository;
import com.dduktak.domain.home.dto.BriefingTopRecipeDto;
import com.dduktak.domain.home.dto.HomeBriefingResponseDto;
import com.dduktak.domain.home.dto.ImminentIngredientDto;
import com.dduktak.domain.inventory.entity.UserIngredient;
import com.dduktak.domain.inventory.repository.UserIngredientRepository;
import com.dduktak.domain.matching.dto.MatchingRecommendationResponseDto;
import com.dduktak.domain.matching.service.MatchingService;
import com.dduktak.domain.recipe.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 메인 화면 종합 브리핑 서비스 (모듈 6)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomeService {

        private final ProfileRepository profileRepository;
        private final UserIngredientRepository userIngredientRepository;
        private final RecipeRepository recipeRepository;
        private final MatchingService matchingService;

        /**
         * 메인 화면 종합 브리핑 위젯 데이터 조회
         * (임박 재료 집계 + 상위 3개 리스트 + 최고 매칭 레시피 / 커뮤니티 인기 레시피 폴백)
         *
         * @param userId 로그인 회원 고유 식별자 (UUID)
         * @return 메인 홈 종합 브리핑 DTO
         */
        public HomeBriefingResponseDto getBriefing(UUID userId) {
                // 1. 유저 닉네임 조회 (프로필 없거나 미등록 시 기본값 '뚝딱이')
                String nickname = profileRepository.findById(userId)
                                .map(Profile::getNickname)
                                .filter(n -> n != null && !n.isBlank())
                                .orElse("뚝딱이");

                // 2. 전체 활성 식재료 수 및 소비기한 임박(0 <= D-Day <= 3) 활성 재료 수 집계
                long totalCount = userIngredientRepository.countActiveByUserId(userId);
                long expiringCount = userIngredientRepository.countImminentByUserId(userId);

                // 3. 상위 3개 식재료 목록 조회 (임박 재료 우선, 임박 재료 없더라도 활성 재료 있으면 빠른 순 조회)
                List<ImminentIngredientDto> imminentList = Collections.emptyList();
                if (expiringCount > 0) {
                        List<UserIngredient> ingredients = userIngredientRepository.findTopImminentByUserId(userId, 3);
                        imminentList = ingredients.stream()
                                        .map(ui -> ImminentIngredientDto.builder()
                                                        .ingredientId(ui.getIngredientId())
                                                        .name(ui.getName())
                                                        .dDay(ui.getDDay())
                                                        .build())
                                        .collect(Collectors.toList());
                } else if (totalCount > 0) {
                        List<UserIngredient> ingredients = userIngredientRepository.findTopActiveByUserId(userId, 3);
                        imminentList = ingredients.stream()
                                        .map(ui -> ImminentIngredientDto.builder()
                                                        .ingredientId(ui.getIngredientId())
                                                        .name(ui.getName())
                                                        .dDay(ui.getDDay())
                                                        .build())
                                        .collect(Collectors.toList());
                }

                // 4. 내 냉장고 기반 최고 매칭 레시피 1건 조회 (없거나 매칭률 0% 시 커뮤니티 인기 레시피 폴백)
                BriefingTopRecipeDto topRecipe = null;
                List<MatchingRecommendationResponseDto> recommendations = matchingService.getRecommendations(userId,
                                null, 0, 1);
                if (!recommendations.isEmpty() && recommendations.get(0).getMatchingRate() != null
                                && recommendations.get(0).getMatchingRate() > 0) {
                        MatchingRecommendationResponseDto rec = recommendations.get(0);
                        topRecipe = BriefingTopRecipeDto.builder()
                                        .recipeId(rec.getRecipeId())
                                        .title(rec.getTitle())
                                        .thumbnailUrl(rec.getThumbnailUrl())
                                        .cookingTime(rec.getCookingTime())
                                        .difficulty(rec.getDifficulty())
                                        .matchingRate(rec.getMatchingRate())
                                        .build();
                } else {
                        // 폴백: 커뮤니티 인기 레시피(cooked_count + like_count DESC) 상위 1건 (매칭률 0% 표기)
                        topRecipe = recipeRepository.findTopPopularRecipe()
                                        .map(r -> BriefingTopRecipeDto.builder()
                                                        .recipeId(r.getRecipeId())
                                                        .title(r.getTitle())
                                                        .thumbnailUrl(r.getThumbnailUrl())
                                                        .cookingTime(r.getCookingTime())
                                                        .difficulty(r.getDifficulty())
                                                        .matchingRate(0)
                                                        .build())
                                        .orElse(null);
                }

                // 5. 종합 브리핑 DTO 조합 및 반환
                return HomeBriefingResponseDto.builder()
                                .nickname(nickname)
                                .totalIngredientsCount(totalCount)
                                .expiringIngredientsCount(expiringCount)
                                .imminentIngredients(imminentList)
                                .topRecipe(topRecipe)
                                .build();
        }
}
