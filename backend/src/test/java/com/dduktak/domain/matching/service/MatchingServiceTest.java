package com.dduktak.domain.matching.service;

import com.dduktak.domain.inventory.entity.UserIngredient;
import com.dduktak.domain.inventory.repository.UserIngredientRepository;
import com.dduktak.domain.matching.dto.CookRequestDto;
import com.dduktak.domain.matching.dto.CookResponseDto;
import com.dduktak.domain.matching.dto.MatchingRecommendationResponseDto;
import com.dduktak.domain.recipe.entity.Recipe;
import com.dduktak.domain.recipe.entity.RecipeIngredient;
import com.dduktak.domain.recipe.repository.RecipeIngredientRepository;
import com.dduktak.domain.recipe.repository.RecipeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("[단위 테스트] MatchingService 스마트 매칭 및 요리완료 FIFO 차감 검증")
class MatchingServiceTest {

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private RecipeIngredientRepository recipeIngredientRepository;

    @Mock
    private UserIngredientRepository userIngredientRepository;

    @Spy
    private MatchingCalculator matchingCalculator = new MatchingCalculator();

    @InjectMocks
    private MatchingService matchingService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("TC-MATCH-01: 주재료 필수 하드 필터링 (주재료 0개 레시피는 추천 목록에서 완전 제외)")
    void getRecommendations_hardGateExclusion() {
        // given: 유저는 양파만 보유
        List<UserIngredient> userIngredients = List.of(
                UserIngredient.builder()
                        .userId(userId)
                        .masterIngredientId(1L)
                        .name("양파")
                        .quantity(new BigDecimal("2.00"))
                        .dDay(5)
                        .build()
        );
        given(userIngredientRepository.findAllByUserIdAndFilter(userId, null, null, null, "ACTIVE"))
                .willReturn(userIngredients);

        // 레시피 1: 주재료 '돼지고기'(ID: 49) -> 주재료 0개이므로 하드게이트 탈락
        Recipe r1 = Recipe.builder().recipeId(1L).title("돼지고기 김치찌개").cookedCount(5).likeCount(3).build();
        given(recipeRepository.findAllForMatching(null)).willReturn(List.of(r1));

        RecipeIngredient ri1 = RecipeIngredient.builder()
                .recipeId(1L)
                .masterIngredientId(49L)
                .name("돼지고기")
                .typeCode("MAIN")
                .quantity(new BigDecimal("200"))
                .build();
        given(recipeIngredientRepository.findByRecipeIds(List.of(1L))).willReturn(List.of(ri1));

        // when
        List<MatchingRecommendationResponseDto> recommendations =
                matchingService.getRecommendations(userId, null, 0, 10);

        // then: 하드게이트 탈락으로 추천 목록에서 완전히 제외되어 빈 목록 반환
        assertThat(recommendations).isEmpty();
    }

    @Test
    @DisplayName("TC-MATCH-02: 매칭 점수 산출 및 소비기한 임박 가산점 반영 최상단 추천 검증")
    void getRecommendations_sortedByMatchingRateAndBonus() {
        // given: 유저가 돼지고기(D-1 임박)와 김치(D-10) 보유
        List<UserIngredient> userIngredients = List.of(
                UserIngredient.builder()
                        .userId(userId)
                        .masterIngredientId(49L)
                        .name("돼지고기")
                        .quantity(new BigDecimal("300"))
                        .dDay(1) // 임박!
                        .build(),
                UserIngredient.builder()
                        .userId(userId)
                        .masterIngredientId(50L)
                        .name("김치")
                        .quantity(new BigDecimal("500"))
                        .dDay(10)
                        .build()
        );
        given(userIngredientRepository.findAllByUserIdAndFilter(userId, null, null, null, "ACTIVE"))
                .willReturn(userIngredients);

        Recipe r1 = Recipe.builder().recipeId(1L).title("돼지고기 김치찌개").cookingTime(20).difficulty("보통").build();
        Recipe r2 = Recipe.builder().recipeId(2L).title("돼지고기 두루치기").cookingTime(15).difficulty("쉬움").build();
        given(recipeRepository.findAllForMatching(null)).willReturn(List.of(r1, r2));

        // r1: 돼지고기, 김치 모두 주재료 (100% 매칭 + 임박 +10점)
        RecipeIngredient ri1 = RecipeIngredient.builder().recipeId(1L).masterIngredientId(49L).name("돼지고기").typeCode("MAIN").build();
        RecipeIngredient ri2 = RecipeIngredient.builder().recipeId(1L).masterIngredientId(50L).name("김치").typeCode("MAIN").build();

        // r2: 돼지고기 주재료, 미보유 채소(양파) 주재료 (50% 매칭)
        RecipeIngredient ri3 = RecipeIngredient.builder().recipeId(2L).masterIngredientId(49L).name("돼지고기").typeCode("MAIN").build();
        RecipeIngredient ri4 = RecipeIngredient.builder().recipeId(2L).masterIngredientId(999L).name("미보유채소").typeCode("MAIN").build();

        given(recipeIngredientRepository.findByRecipeIds(List.of(1L, 2L))).willReturn(List.of(ri1, ri2, ri3, ri4));

        // when
        List<MatchingRecommendationResponseDto> recommendations =
                matchingService.getRecommendations(userId, null, 0, 10);

        // then
        assertThat(recommendations).hasSize(2);
        // 점수가 더 높은 r1이 최상단 (80점 이상)
        assertThat(recommendations.get(0).getRecipeId()).isEqualTo(1L);
        assertThat(recommendations.get(0).getTitle()).isEqualTo("돼지고기 김치찌개");
        assertThat(recommendations.get(0).getMatchingRate()).isGreaterThan(recommendations.get(1).getMatchingRate());
    }

    @Test
    @DisplayName("TC-MATCH-03: 요리 완료 시 선입선출(FIFO) 차감 (임박순 순차 차감, No-Mixing 혼합차감 금지, 양념류 제외, 부족 시 부분 차감)")
    void cookRecipe_fifoDeduction_success() {
        // given: 2인분 요리, 필요 재료: 계란 2개 (주재료), 진간장 10ml (양념류, isSauce: true)
        Long recipeId = 10L;
        Recipe recipe = Recipe.builder()
                .recipeId(recipeId)
                .servings(1)
                .cookedCount(5)
                .build();
        given(recipeRepository.findById(recipeId)).willReturn(Optional.of(recipe));

        RecipeIngredient riEgg = RecipeIngredient.builder()
                .recipeId(recipeId)
                .masterIngredientId(2L)
                .altIngredientId(99L)
                .name("계란")
                .quantity(new BigDecimal("1.00")) // 1인분에 1개 -> 2인분이면 2개 필요
                .isSauce(false)
                .build();
        RecipeIngredient riSoy = RecipeIngredient.builder()
                .recipeId(recipeId)
                .masterIngredientId(70L)
                .name("진간장")
                .quantity(new BigDecimal("10.00"))
                .isSauce(true) // 양념류: 차감 제외
                .build();
        given(recipeIngredientRepository.findByRecipeId(recipeId)).willReturn(List.of(riEgg, riSoy));

        // 유저 냉장고 계란 2개 레코드 (FIFO: 10월 20일 만료 1개, 10월 25일 만료 5개)
        UserIngredient egg1 = UserIngredient.builder()
                .ingredientId(101L)
                .userId(userId)
                .masterIngredientId(2L)
                .quantity(new BigDecimal("1.00"))
                .expireDate(LocalDate.of(2026, 10, 20))
                .status("ACTIVE")
                .build();
        UserIngredient egg2 = UserIngredient.builder()
                .ingredientId(102L)
                .userId(userId)
                .masterIngredientId(2L)
                .quantity(new BigDecimal("5.00"))
                .expireDate(LocalDate.of(2026, 10, 25))
                .status("ACTIVE")
                .build();
        given(userIngredientRepository.findActiveByUserIdAndMasterId(userId, 2L))
                .willReturn(List.of(egg1, egg2));
        given(userIngredientRepository.findTotalQuantityByUserIdAndMasterId(userId, 2L))
                .willReturn(new BigDecimal("4.00")); // 6개 중 2개 차감 후 잔여 4개

        CookRequestDto cookRequest = CookRequestDto.builder()
                .deductInventory(true)
                .servings(2)
                .build();

        // when
        CookResponseDto response = matchingService.cookRecipe(userId, recipeId, cookRequest);

        // then
        assertThat(response.getIsDeducted()).isTrue();
        // egg1: 전량 차감 (1.00 -> 0.00, CONSUMED)
        verify(userIngredientRepository).updateQuantityAndStatus(101L, userId, BigDecimal.ZERO, "CONSUMED");
        // egg2: 부분 차감 (5.00 - 1.00 = 4.00, ACTIVE)
        verify(userIngredientRepository).updateQuantityAndStatus(102L, userId, new BigDecimal("4.00"), "ACTIVE");
        // No-Mixing: 대체 재료(altIngredientId: 99L) 조회는 전혀 발생하지 않아야 함
        verify(userIngredientRepository, never()).findActiveByUserIdAndMasterId(userId, 99L);
        // 양념류: 진간장(ID: 70L) 차감 루프 진입 배제
        verify(userIngredientRepository, never()).findActiveByUserIdAndMasterId(userId, 70L);
        // 원자적 요리완료 수 증가
        verify(recipeRepository).incrementCookedCount(recipeId);
        // 응답 검증
        assertThat(response.getDeductedIngredients()).hasSize(1);
        assertThat(response.getDeductedIngredients().get(0).getName()).isEqualTo("계란");
        assertThat(response.getDeductedIngredients().get(0).getDeductedQuantity()).isEqualByComparingTo("2.00");
        assertThat(response.getDeductedIngredients().get(0).getRemainingQuantity()).isEqualByComparingTo("4.00");
    }

    @Test
    @DisplayName("TC-MATCH-03 부분 차감: 보유 수량 부족 시 에러 없이 보유분만 전량 차감(Partial Deduction)")
    void cookRecipe_partialDeduction_noError() {
        // given: 필요 3개, 냉장고에 1개만 보유
        Long recipeId = 15L;
        Recipe recipe = Recipe.builder().recipeId(recipeId).servings(1).build();
        given(recipeRepository.findById(recipeId)).willReturn(Optional.of(recipe));

        RecipeIngredient ri = RecipeIngredient.builder()
                .recipeId(recipeId)
                .masterIngredientId(2L)
                .name("계란")
                .quantity(new BigDecimal("3.00"))
                .isSauce(false)
                .build();
        given(recipeIngredientRepository.findByRecipeId(recipeId)).willReturn(List.of(ri));

        UserIngredient eggOnlyOne = UserIngredient.builder()
                .ingredientId(101L)
                .userId(userId)
                .masterIngredientId(2L)
                .quantity(new BigDecimal("1.00"))
                .build();
        given(userIngredientRepository.findActiveByUserIdAndMasterId(userId, 2L))
                .willReturn(List.of(eggOnlyOne));
        given(userIngredientRepository.findTotalQuantityByUserIdAndMasterId(userId, 2L))
                .willReturn(BigDecimal.ZERO);

        CookRequestDto cookRequest = CookRequestDto.builder()
                .deductInventory(true)
                .servings(1)
                .build();

        // when: 에러가 발생하지 않고 보유분만 전량 차감
        CookResponseDto response = matchingService.cookRecipe(userId, recipeId, cookRequest);

        // then
        assertThat(response.getIsDeducted()).isTrue();
        verify(userIngredientRepository).updateQuantityAndStatus(101L, userId, BigDecimal.ZERO, "CONSUMED");
        assertThat(response.getDeductedIngredients().get(0).getDeductedQuantity()).isEqualByComparingTo("1.00");
        assertThat(response.getDeductedIngredients().get(0).getRemainingQuantity()).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("TC-MATCH-04: 요리 완료 2-Way 옵션 (deductInventory = false 시 재료 차감 없이 cookedCount만 +1)")
    void cookRecipe_noDeductOption_onlyIncrementsCount() {
        // given
        Long recipeId = 20L;
        Recipe recipe = Recipe.builder().recipeId(recipeId).cookedCount(10).servings(1).build();
        given(recipeRepository.findById(recipeId))
                .willReturn(Optional.of(recipe))
                .willReturn(Optional.of(Recipe.builder().recipeId(recipeId).cookedCount(11).build()));

        CookRequestDto cookRequest = CookRequestDto.builder()
                .deductInventory(false) // 차감 안 함
                .servings(2)
                .build();

        // when
        CookResponseDto response = matchingService.cookRecipe(userId, recipeId, cookRequest);

        // then
        assertThat(response.getIsDeducted()).isFalse();
        assertThat(response.getCookedCount()).isEqualTo(11);
        assertThat(response.getDeductedIngredients()).isEmpty();

        // 재료 차감 및 레시피 재료 조회는 전혀 수행되지 않아야 함
        verify(recipeIngredientRepository, never()).findByRecipeId(recipeId);
        verify(userIngredientRepository, never()).findActiveByUserIdAndMasterId(any(), any());
        verify(recipeRepository).incrementCookedCount(recipeId);
    }
}
