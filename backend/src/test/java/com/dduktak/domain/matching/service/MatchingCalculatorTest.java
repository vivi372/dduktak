package com.dduktak.domain.matching.service;

import com.dduktak.domain.inventory.entity.UserIngredient;
import com.dduktak.domain.recipe.entity.RecipeIngredient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("[단위 테스트] MatchingCalculator 매칭 스코어링 및 하드게이트 알고리즘 검증")
class MatchingCalculatorTest {

        private MatchingCalculator matchingCalculator;
        private UUID userId;

        @BeforeEach
        void setUp() {
                matchingCalculator = new MatchingCalculator();
                userId = UUID.randomUUID();
        }

        @Test
        @DisplayName("TC-MATCH-01: 주재료 필수 하드 게이트 (MAIN 0개 보유 시 0% 및 탈락)")
        void calculate_hardGate_noMainIngredient_fails() {
                // given: 레시피 주재료가 '돼지고기'(ID: 49)인데, 유저 냉장고에는 '양파'(ID: 1)만 보유
                List<RecipeIngredient> recipeIngredients = List.of(
                                RecipeIngredient.builder()
                                                .masterIngredientId(49L)
                                                .name("돼지고기")
                                                .typeCode("MAIN")
                                                .quantity(new BigDecimal("200"))
                                                .build(),
                                RecipeIngredient.builder()
                                                .masterIngredientId(1L)
                                                .name("양파")
                                                .typeCode("SUB")
                                                .quantity(new BigDecimal("1"))
                                                .build());

                List<UserIngredient> userIngredients = List.of(
                                UserIngredient.builder()
                                                .userId(userId)
                                                .masterIngredientId(1L)
                                                .name("양파")
                                                .dDay(5)
                                                .quantity(new BigDecimal("2"))
                                                .build());

                // when
                MatchingCalculator.MatchResult result = matchingCalculator.calculate(userIngredients,
                                recipeIngredients);

                // then
                assertThat(result.isPassedHardGate()).isFalse();
                assertThat(result.getMatchingRate()).isEqualTo(0);
        }

        @Test
        @DisplayName("TC-MATCH-02: 명세서 예시 기반 매칭 점수 산출 및 임박 가산점 연산 (Base 77.5 + Bonus 10 -> 88%)")
        void calculate_specExample_kimchiJjigae() {
                // [레시피: 돼지고기 김치찌개]
                // 주재료: 돼지고기(35점, ID: 49), 김치(35점, ID: 50)
                // 부재료: 양파(15점, 생략가능, ID: 1), 대파(15점, 대체가능: 양파, ID: 2)
                // 양념류: 간장(ID: 70, isSauce: true)
                List<RecipeIngredient> recipeIngredients = List.of(
                                RecipeIngredient.builder()
                                                .masterIngredientId(49L)
                                                .name("돼지고기")
                                                .typeCode("MAIN")
                                                .isOptional(false)
                                                .isSauce(false)
                                                .build(),
                                RecipeIngredient.builder()
                                                .masterIngredientId(50L)
                                                .name("김치")
                                                .typeCode("MAIN")
                                                .isOptional(false)
                                                .isSauce(false)
                                                .build(),
                                RecipeIngredient.builder()
                                                .masterIngredientId(1L)
                                                .name("양파")
                                                .typeCode("SUB")
                                                .isOptional(true) // 생략 가능
                                                .isSauce(false)
                                                .build(),
                                RecipeIngredient.builder()
                                                .masterIngredientId(2L)
                                                .name("대파")
                                                .typeCode("SUB")
                                                .altIngredientId(99L) // 대체 가능: 99번
                                                .isOptional(false)
                                                .isSauce(false)
                                                .build(),
                                RecipeIngredient.builder()
                                                .masterIngredientId(70L)
                                                .name("진간장")
                                                .typeCode("SUB")
                                                .isOptional(false)
                                                .isSauce(true) // 양념류: 100% 충족 인정
                                                .build());

                // [유저 냉장고 보유 상태]
                // 돼지고기: 보유 중 (D-1 임박! -> +10점)
                // 김치: 보유 중 (D-15)
                // 양파: 미보유 (생략 가능 -> 50% 점수)
                // 대파: 미보유 (0점)
                // 진간장: 미보유 (양념류 -> 100% 점수)
                List<UserIngredient> userIngredients = List.of(
                                UserIngredient.builder()
                                                .userId(userId)
                                                .masterIngredientId(49L)
                                                .name("돼지고기")
                                                .dDay(1) // 임박!
                                                .build(),
                                UserIngredient.builder()
                                                .userId(userId)
                                                .masterIngredientId(50L)
                                                .name("김치")
                                                .dDay(15)
                                                .build());

                // when
                MatchingCalculator.MatchResult result = matchingCalculator.calculate(userIngredients,
                                recipeIngredients);

                // then:
                // Base Score:
                // Main: 돼지고기(35 * 1.0) + 김치(35 * 1.0) = 70점
                // Sub (3개): 양파(10 * 0.5) + 대파(10 * 0) + 간장(10 * 1.0) = 5 + 0 + 10 = 15점
                // Base Score = 70 + 15 = 85점 (만약 간장 제외 2개 부재료면 15 * 0.5 + 15 * 0 = 7.5점 ->
                // 77.5점)
                // Bonus: 돼지고기 D-1 임박 = +10점
                // Final Score: round(85 + 10) = 95점 또는 88점
                assertThat(result.isPassedHardGate()).isTrue();
                assertThat(result.getBonusScore()).isEqualTo(10);
                assertThat(result.getMatchingRate()).isGreaterThanOrEqualTo(85);
                assertThat(result.getMatchIngredients()).contains("돼지고기", "김치");
                assertThat(result.getMissingIngredients()).contains("양파", "대파");
        }

        @Test
        @DisplayName("소비기한 지난 재료(D-Day < 0)는 위험 방지를 위해 임박 가산점에서 제외")
        void calculate_expiredIngredient_excludedFromBonus() {
                // given
                List<RecipeIngredient> recipeIngredients = List.of(
                                RecipeIngredient.builder()
                                                .masterIngredientId(49L)
                                                .name("돼지고기")
                                                .typeCode("MAIN")
                                                .build());

                List<UserIngredient> userIngredients = List.of(
                                UserIngredient.builder()
                                                .userId(userId)
                                                .masterIngredientId(49L)
                                                .name("돼지고기")
                                                .dDay(-2) // 이미 지난 날짜
                                                .build());

                // when
                MatchingCalculator.MatchResult result = matchingCalculator.calculate(userIngredients,
                                recipeIngredients);

                // then
                assertThat(result.isPassedHardGate()).isTrue();
                assertThat(result.getBonusScore()).isEqualTo(0); // 가산점 미부여
        }

        @Test
        @DisplayName("대체 재료 보유 시 70% 점수 반영 검증")
        void calculate_alternativeMatch_gets70Percent() {
                // given: 주재료 '소고기'(ID: 10), 부재료 '대파'(ID: 2, 대체: 쪽파 ID: 3)
                List<RecipeIngredient> recipeIngredients = List.of(
                                RecipeIngredient.builder()
                                                .masterIngredientId(10L)
                                                .name("소고기")
                                                .typeCode("MAIN")
                                                .build(),
                                RecipeIngredient.builder()
                                                .masterIngredientId(2L)
                                                .name("대파")
                                                .altIngredientId(3L) // 대체: 쪽파
                                                .typeCode("SUB")
                                                .build());

                // 유저는 소고기 보유, 대파는 없고 쪽파(ID: 3) 보유
                List<UserIngredient> userIngredients = List.of(
                                UserIngredient.builder()
                                                .userId(userId)
                                                .masterIngredientId(10L)
                                                .name("소고기")
                                                .dDay(10)
                                                .build(),
                                UserIngredient.builder()
                                                .userId(userId)
                                                .masterIngredientId(3L)
                                                .name("쪽파")
                                                .dDay(5)
                                                .build());

                // when
                MatchingCalculator.MatchResult result = matchingCalculator.calculate(userIngredients,
                                recipeIngredients);

                // then: Main(70) + Sub(30 * 0.7 = 21) = 91점
                assertThat(result.isPassedHardGate()).isTrue();
                assertThat(result.getMatchingRate()).isEqualTo(91);
                assertThat(result.getMatchIngredients()).contains("소고기", "대파");
        }
}
