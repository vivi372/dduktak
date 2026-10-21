package com.dduktak.domain.home.service;

import com.dduktak.domain.auth.entity.Profile;
import com.dduktak.domain.auth.repository.ProfileRepository;
import com.dduktak.domain.home.dto.HomeBriefingResponseDto;
import com.dduktak.domain.inventory.entity.UserIngredient;
import com.dduktak.domain.inventory.repository.UserIngredientRepository;
import com.dduktak.domain.matching.dto.MatchingRecommendationResponseDto;
import com.dduktak.domain.matching.service.MatchingService;
import com.dduktak.domain.recipe.entity.Recipe;
import com.dduktak.domain.recipe.repository.RecipeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

/**
 * 모듈 6 메인 화면 종합 브리핑 서비스 단위 테스트 (TC-HOME-01)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("[단위 테스트] HomeService 메인 화면 브리핑 및 폴백 비즈니스 로직 검증")
class HomeServiceTest {

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private UserIngredientRepository userIngredientRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private MatchingService matchingService;

    @InjectMocks
    private HomeService homeService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("TC-HOME-01-A: 정상 유저 브리핑 조회 - 임박 식재료 집계 및 최고 매칭 레시피 반환")
    void getBriefing_success_withRecommendations() {
        // given
        Profile profile = Profile.builder()
                .id(userId)
                .nickname("뚝딱마스터")
                .build();
        given(profileRepository.findById(userId)).willReturn(Optional.of(profile));

        given(userIngredientRepository.countImminentByUserId(userId)).willReturn(3L);

        List<UserIngredient> imminentList = List.of(
                UserIngredient.builder().ingredientId(1L).name("계란").expireDate(LocalDate.now().plusDays(1)).dDay(1).build(),
                UserIngredient.builder().ingredientId(2L).name("우유").expireDate(LocalDate.now().plusDays(2)).dDay(2).build(),
                UserIngredient.builder().ingredientId(3L).name("두부").expireDate(LocalDate.now().plusDays(3)).dDay(3).build()
        );
        given(userIngredientRepository.findTopImminentByUserId(userId, 3)).willReturn(imminentList);

        MatchingRecommendationResponseDto recommendation = MatchingRecommendationResponseDto.builder()
                .recipeId(10L)
                .title("버터 간장계란밥")
                .thumbnailUrl("https://example.com/egg_rice.jpg")
                .cookingTime(10)
                .difficulty("쉬움")
                .matchingRate(85)
                .build();
        given(matchingService.getRecommendations(userId, null, 0, 1))
                .willReturn(List.of(recommendation));

        // when
        HomeBriefingResponseDto response = homeService.getBriefing(userId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getNickname()).isEqualTo("뚝딱마스터");
        assertThat(response.getExpiringIngredientsCount()).isEqualTo(3L);
        assertThat(response.getImminentIngredients()).hasSize(3);
        assertThat(response.getImminentIngredients().get(0).getName()).isEqualTo("계란");
        assertThat(response.getImminentIngredients().get(0).getDDay()).isEqualTo(1);

        assertThat(response.getTopRecipe()).isNotNull();
        assertThat(response.getTopRecipe().getRecipeId()).isEqualTo(10L);
        assertThat(response.getTopRecipe().getTitle()).isEqualTo("버터 간장계란밥");
        assertThat(response.getTopRecipe().getMatchingRate()).isEqualTo(85);

        // 최고 매칭 결과가 있으므로 인기 레시피 폴백 조회는 호출되지 않아야 함
        verify(recipeRepository, never()).findTopPopularRecipe();
    }

    @Test
    @DisplayName("TC-HOME-01-B: 매칭 추천 결과가 없는 경우 - 커뮤니티 인기 레시피로 우아하게 폴백 (matchingRate: 0%)")
    void getBriefing_fallback_whenNoMatchingRecommendations() {
        // given
        Profile profile = Profile.builder().id(userId).nickname("요리초보").build();
        given(profileRepository.findById(userId)).willReturn(Optional.of(profile));

        given(userIngredientRepository.countImminentByUserId(userId)).willReturn(1L);
        given(userIngredientRepository.findTopImminentByUserId(userId, 3)).willReturn(List.of(
                UserIngredient.builder().ingredientId(5L).name("양파").dDay(2).build()
        ));

        // 매칭 추천 결과 없음 (하드게이트 탈락 또는 조건 불일치)
        given(matchingService.getRecommendations(userId, null, 0, 1)).willReturn(Collections.emptyList());

        // 커뮤니티 인기 레시피 Mocking (cooked_count + like_count DESC 최상위 1건)
        Recipe popularRecipe = Recipe.builder()
                .recipeId(99L)
                .title("인기 만점 돼지고기 김치찌개")
                .thumbnailUrl("https://example.com/kimchi_soup.jpg")
                .cookingTime(25)
                .difficulty("보통")
                .likeCount(50)
                .cookedCount(30)
                .build();
        given(recipeRepository.findTopPopularRecipe()).willReturn(Optional.of(popularRecipe));

        // when
        HomeBriefingResponseDto response = homeService.getBriefing(userId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getNickname()).isEqualTo("요리초보");
        assertThat(response.getExpiringIngredientsCount()).isEqualTo(1L);
        assertThat(response.getImminentIngredients()).hasSize(1);

        assertThat(response.getTopRecipe()).isNotNull();
        assertThat(response.getTopRecipe().getRecipeId()).isEqualTo(99L);
        assertThat(response.getTopRecipe().getTitle()).isEqualTo("인기 만점 돼지고기 김치찌개");
        assertThat(response.getTopRecipe().getMatchingRate()).isEqualTo(0); // 폴백 표기 0% 검증

        verify(recipeRepository, times(1)).findTopPopularRecipe();
    }

    @Test
    @DisplayName("TC-HOME-01-C: 재료 0개 신규 유저 조회 (Empty State) - 0 카운트, 빈 배열, 인기 레시피 폴백 반환")
    void getBriefing_emptyState_userWithZeroIngredients() {
        // given
        given(profileRepository.findById(userId)).willReturn(Optional.empty()); // 프로필 없음

        given(userIngredientRepository.countImminentByUserId(userId)).willReturn(0L);
        given(matchingService.getRecommendations(userId, null, 0, 1)).willReturn(Collections.emptyList());

        Recipe popularRecipe = Recipe.builder()
                .recipeId(101L)
                .title("초간단 라면 뚝딱")
                .thumbnailUrl("https://example.com/ramen.jpg")
                .cookingTime(5)
                .difficulty("쉬움")
                .likeCount(100)
                .cookedCount(200)
                .build();
        given(recipeRepository.findTopPopularRecipe()).willReturn(Optional.of(popularRecipe));

        // when
        HomeBriefingResponseDto response = homeService.getBriefing(userId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getNickname()).isEqualTo("뚝딱이"); // 기본 닉네임 폴백 검증
        assertThat(response.getExpiringIngredientsCount()).isEqualTo(0L);
        assertThat(response.getImminentIngredients()).isNotNull().isEmpty(); // 빈 배열 검증

        assertThat(response.getTopRecipe()).isNotNull();
        assertThat(response.getTopRecipe().getRecipeId()).isEqualTo(101L);
        assertThat(response.getTopRecipe().getTitle()).isEqualTo("초간단 라면 뚝딱");
        assertThat(response.getTopRecipe().getMatchingRate()).isEqualTo(0);

        // 재료가 0개이므로 상위 임박 목록 쿼리는 호출되지 않아야 함
        verify(userIngredientRepository, never()).findTopImminentByUserId(any(), anyInt());
    }

    @Test
    @DisplayName("TC-HOME-01-D: 매칭률이 0%인 추천 결과 반환 시 - 인기 레시피로 우아하게 폴백")
    void getBriefing_fallback_whenMatchingRateIsZero() {
        // given
        given(profileRepository.findById(userId)).willReturn(Optional.empty());
        given(userIngredientRepository.countImminentByUserId(userId)).willReturn(0L);

        // 매칭 결과가 있으나 matchingRate = 0
        MatchingRecommendationResponseDto zeroRateRec = MatchingRecommendationResponseDto.builder()
                .recipeId(12L)
                .title("매칭률0레시피")
                .matchingRate(0)
                .build();
        given(matchingService.getRecommendations(userId, null, 0, 1)).willReturn(List.of(zeroRateRec));

        Recipe popularRecipe = Recipe.builder()
                .recipeId(200L)
                .title("커뮤니티 베스트 요리")
                .thumbnailUrl("https://example.com/best.jpg")
                .cookingTime(15)
                .difficulty("쉬움")
                .build();
        given(recipeRepository.findTopPopularRecipe()).willReturn(Optional.of(popularRecipe));

        // when
        HomeBriefingResponseDto response = homeService.getBriefing(userId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTopRecipe()).isNotNull();
        assertThat(response.getTopRecipe().getRecipeId()).isEqualTo(200L);
        assertThat(response.getTopRecipe().getTitle()).isEqualTo("커뮤니티 베스트 요리");
        assertThat(response.getTopRecipe().getMatchingRate()).isEqualTo(0);
        verify(recipeRepository, times(1)).findTopPopularRecipe();
    }

    @Test
    @DisplayName("TC-HOME-01-E: 레시피 테이블이 완전히 비어있는 극단 상황 방어 (Null 안전성)")
    void getBriefing_whenDatabaseHasZeroRecipes() {
        // given
        given(profileRepository.findById(userId)).willReturn(Optional.empty());
        given(userIngredientRepository.countImminentByUserId(userId)).willReturn(0L);
        given(matchingService.getRecommendations(userId, null, 0, 1)).willReturn(Collections.emptyList());
        given(recipeRepository.findTopPopularRecipe()).willReturn(Optional.empty());

        // when
        HomeBriefingResponseDto response = homeService.getBriefing(userId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getExpiringIngredientsCount()).isEqualTo(0L);
        assertThat(response.getImminentIngredients()).isEmpty();
        assertThat(response.getTopRecipe()).isNull(); // NPE 발생 없이 null 처리
    }
}
