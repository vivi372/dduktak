package com.dduktak.domain.recipe.service;

import com.dduktak.domain.auth.entity.Profile;
import com.dduktak.domain.auth.repository.ProfileRepository;
import com.dduktak.domain.inventory.entity.IngredientMaster;
import com.dduktak.domain.inventory.repository.IngredientMasterRepository;
import com.dduktak.domain.recipe.dto.*;
import com.dduktak.domain.recipe.entity.Recipe;
import com.dduktak.domain.recipe.entity.RecipeCategory;
import com.dduktak.domain.recipe.entity.RecipeIngredient;
import com.dduktak.domain.recipe.entity.RecipeStep;
import com.dduktak.domain.recipe.repository.*;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("[단위 테스트] RecipeService 레시피 커뮤니티 비즈니스 로직 검증")
class RecipeServiceTest {

        @Mock
        private RecipeRepository recipeRepository;

        @Mock
        private RecipeIngredientRepository recipeIngredientRepository;

        @Mock
        private RecipeStepRepository recipeStepRepository;

        @Mock
        private RecipeLikeRepository recipeLikeRepository;

        @Mock
        private RecipeScrapRepository recipeScrapRepository;

        @Mock
        private IngredientMasterRepository ingredientMasterRepository;

        @Mock
        private ProfileRepository profileRepository;

        @InjectMocks
        private RecipeService recipeService;

        private UUID userId;
        private UUID otherUserId;

        @BeforeEach
        void setUp() {
                userId = UUID.randomUUID();
                otherUserId = UUID.randomUUID();
        }

        @Test
        @DisplayName("TC-RCP-01: 표준 식재료 기반 레시피 신규 등록 성공")
        void createRecipe_success() {
                // given
                RecipeCreateRequestDto dto = RecipeCreateRequestDto.builder()
                                .recipeCategoryId(1L)
                                .title("버터 간장계란밥")
                                .description("5분 컷 간단 요리")
                                .servings(1)
                                .cookingTime(5)
                                .difficulty("쉬움")
                                .ingredients(List.of(
                                                RecipeIngredientItemDto.builder()
                                                                .masterIngredientId(1L)
                                                                .categoryId(2L)
                                                                .name("계란")
                                                                .quantity(new BigDecimal("1.00"))
                                                                .unit("개")
                                                                .typeCode("MAIN")
                                                                .isOptional(false)
                                                                .build()))
                                .steps(List.of(
                                                RecipeStepItemDto.builder()
                                                                .stepNo(1)
                                                                .description("밥 위에 계란과 버터를 올린다.")
                                                                .build()))
                                .build();

                given(recipeRepository.findCategoryById(1L)).willReturn(Optional.of(
                                RecipeCategory.builder().recipeCategoryId(1L).categoryName("한그릇/밥").displayOrder(1)
                                                .build()));
                given(ingredientMasterRepository.findById(1L)).willReturn(Optional.of(
                                IngredientMaster.builder().masterIngredientId(1L).name("계란").build()));

                // when
                RecipeSimpleResponseDto response = recipeService.createRecipe(userId, dto);

                // then
                assertThat(response).isNotNull();
                assertThat(response.getTitle()).isEqualTo("버터 간장계란밥");
                verify(recipeRepository).insert(any(Recipe.class));
                verify(recipeIngredientRepository).insertBatch(any(), anyList());
                verify(recipeStepRepository).insertBatch(any(), anyList());
        }

        @Test
        @DisplayName("TC-RCP-01 실패: 등록되지 않은 마스터 식재료 ID 전달 시 COMMON_FIELD_INVALID_INPUT 예외")
        void createRecipe_invalidMasterIngredient_throwsException() {
                // given
                RecipeCreateRequestDto dto = RecipeCreateRequestDto.builder()
                                .recipeCategoryId(1L)
                                .title("테스트 요리")
                                .servings(1)
                                .cookingTime(10)
                                .difficulty("쉬움")
                                .ingredients(List.of(
                                                RecipeIngredientItemDto.builder()
                                                                .masterIngredientId(9999L)
                                                                .categoryId(2L)
                                                                .name("미등록 재료")
                                                                .quantity(new BigDecimal("1.00"))
                                                                .unit("개")
                                                                .typeCode("MAIN")
                                                                .build()))
                                .steps(List.of(RecipeStepItemDto.builder().stepNo(1).description("조리").build()))
                                .build();

                given(recipeRepository.findCategoryById(1L)).willReturn(Optional.of(
                                RecipeCategory.builder().recipeCategoryId(1L).categoryName("한그릇/밥").build()));
                given(ingredientMasterRepository.findById(9999L)).willReturn(Optional.empty());

                // when & then
                assertThatThrownBy(() -> recipeService.createRecipe(userId, dto))
                                .isInstanceOf(CustomException.class)
                                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.COMMON_FIELD_INVALID_INPUT);
        }

        @Test
        @DisplayName("TC-RCP-02: 레시피 상세 조회 및 본인 상호작용 플래그 (isLiked, isScrapped, isSauce) 검증")
        void getRecipeDetail_success() {
                // given
                Long recipeId = 10L;
                Recipe recipe = Recipe.builder()
                                .recipeId(recipeId)
                                .userId(userId)
                                .recipeCategoryId(1L)
                                .title("돼지고기 김치찌개")
                                .description("얼큰한 김치찌개")
                                .servings(2)
                                .cookingTime(20)
                                .difficulty("보통")
                                .likeCount(5)
                                .cookedCount(3)
                                .createdAt(java.time.OffsetDateTime.now())
                                .build();

                given(recipeRepository.findById(recipeId)).willReturn(Optional.of(recipe));
                given(recipeRepository.findCategoryById(1L)).willReturn(Optional.of(
                                RecipeCategory.builder().recipeCategoryId(1L).categoryName("국/찌개/탕").build()));
                given(profileRepository.findById(userId)).willReturn(Optional.of(
                                Profile.builder().id(userId).nickname("요리왕").userTag("1024").build()));
                given(recipeLikeRepository.exists(userId, recipeId)).willReturn(true);
                given(recipeScrapRepository.exists(userId, recipeId)).willReturn(false);

                RecipeIngredient ri = RecipeIngredient.builder()
                                .recipeIngId(101L)
                                .recipeId(recipeId)
                                .masterIngredientId(2L)
                                .name("돼지고기")
                                .quantity(new BigDecimal("200.00"))
                                .unit("g")
                                .typeCode("MAIN")
                                .isOptional(false)
                                .isSauce(false)
                                .build();
                given(recipeIngredientRepository.findByRecipeId(recipeId)).willReturn(List.of(ri));
                given(recipeStepRepository.findByRecipeId(recipeId)).willReturn(List.of(
                                RecipeStep.builder().stepId(1L).recipeId(recipeId).stepNo(1).description("고기를 볶는다.")
                                                .build()));

                // when
                RecipeDetailResponseDto response = recipeService.getRecipeDetail(userId, recipeId);

                // then
                assertThat(response).isNotNull();
                assertThat(response.getRecipeId()).isEqualTo(recipeId);
                assertThat(response.getTitle()).isEqualTo("돼지고기 김치찌개");
                assertThat(response.getAuthorNickname()).isEqualTo("요리왕");
                assertThat(response.getAuthorTag()).isEqualTo("1024");
                assertThat(response.getIsLiked()).isTrue();
                assertThat(response.getIsScrapped()).isFalse();
                assertThat(response.getIngredients()).hasSize(1);
                assertThat(response.getIngredients().get(0).getIsSauce()).isFalse();
        }

        @Test
        @DisplayName("TC-RCP-03: 타인이 작성한 레시피 수정 시 403 RECIPE_WARN_NOT_AUTHOR 예외")
        void updateRecipe_notAuthor_throwsException() {
                // given
                Long recipeId = 20L;
                Recipe recipe = Recipe.builder()
                                .recipeId(recipeId)
                                .userId(otherUserId) // 타인 작성
                                .title("타인의 레시피")
                                .build();

                given(recipeRepository.findById(recipeId)).willReturn(Optional.of(recipe));

                RecipeCreateRequestDto updateDto = RecipeCreateRequestDto.builder()
                                .recipeCategoryId(1L)
                                .title("수정 시도")
                                .servings(1)
                                .cookingTime(10)
                                .difficulty("쉬움")
                                .ingredients(List.of())
                                .steps(List.of())
                                .build();

                // when & then
                assertThatThrownBy(() -> recipeService.updateRecipe(userId, recipeId, updateDto))
                                .isInstanceOf(CustomException.class)
                                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RECIPE_WARN_NOT_AUTHOR);
        }

        @Test
        @DisplayName("TC-RCP-03: 탈퇴 회원의 익명 레시피(user_id = NULL) 수정 및 삭제 시 403 RECIPE_WARN_NOT_AUTHOR 차단")
        void updateOrDelete_anonymousRecipe_throwsException() {
                // given
                Long recipeId = 30L;
                Recipe anonymousRecipe = Recipe.builder()
                                .recipeId(recipeId)
                                .userId(null) // USER-02 탈퇴 후 익명화된 레시피
                                .title("탈퇴 회원의 레시피")
                                .build();

                given(recipeRepository.findById(recipeId)).willReturn(Optional.of(anonymousRecipe));

                RecipeCreateRequestDto updateDto = RecipeCreateRequestDto.builder()
                                .recipeCategoryId(1L)
                                .title("수정 시도")
                                .servings(1)
                                .cookingTime(10)
                                .difficulty("쉬움")
                                .ingredients(List.of())
                                .steps(List.of())
                                .build();

                // when & then (수정 시도)
                assertThatThrownBy(() -> recipeService.updateRecipe(userId, recipeId, updateDto))
                                .isInstanceOf(CustomException.class)
                                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RECIPE_WARN_NOT_AUTHOR);

                // when & then (삭제 시도)
                assertThatThrownBy(() -> recipeService.deleteRecipe(userId, recipeId))
                                .isInstanceOf(CustomException.class)
                                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RECIPE_WARN_NOT_AUTHOR);
        }

        @Test
        @DisplayName("TC-RCP-04: 마이페이지 레시피 목록 필터링 (filter=MY, filter=SCRAP)")
        void getRecipes_filterMyAndScrap() {
                // given
                RecipeSummaryResponseDto myRecipe = RecipeSummaryResponseDto.builder()
                                .recipeId(1L)
                                .title("내가 만든 요리")
                                .authorNickname("나")
                                .build();

                given(recipeRepository.findRecipesByFilter(userId, null, "MY", null, "latest", 0, 10))
                                .willReturn(List.of(myRecipe));
                given(recipeRepository.countRecipesByFilter(userId, null, "MY", null)).willReturn(1L);

                // when (filter=MY)
                RecipeListResponseDto response = recipeService.getRecipes(userId, null, "MY", null, "latest", 0, 10);

                // then
                assertThat(response.getRecipes()).hasSize(1);
                assertThat(response.getRecipes().get(0).getTitle()).isEqualTo("내가 만든 요리");
                assertThat(response.getTotalElements()).isEqualTo(1L);

                // given (filter=SCRAP)
                RecipeSummaryResponseDto scrapRecipe = RecipeSummaryResponseDto.builder()
                                .recipeId(2L)
                                .title("스크랩한 요리")
                                .authorNickname("타인")
                                .build();
                given(recipeRepository.findRecipesByFilter(userId, null, "SCRAP", null, "latest", 0, 10))
                                .willReturn(List.of(scrapRecipe));
                given(recipeRepository.countRecipesByFilter(userId, null, "SCRAP", null)).willReturn(1L);

                // when (filter=SCRAP)
                RecipeListResponseDto scrapResponse = recipeService.getRecipes(userId, null, "SCRAP", null, "latest", 0,
                                10);

                // then
                assertThat(scrapResponse.getRecipes()).hasSize(1);
                assertThat(scrapResponse.getRecipes().get(0).getTitle()).isEqualTo("스크랩한 요리");
        }

        @Test
        @DisplayName("좋아요 Toggle: 미등록 상태에서 클릭 시 좋아요 등록 및 +1 반영")
        void toggleLike_insert() {
                // given
                Long recipeId = 50L;
                Recipe recipe = Recipe.builder().recipeId(recipeId).likeCount(0).build();
                given(recipeRepository.findById(recipeId))
                                .willReturn(Optional.of(recipe))
                                .willReturn(Optional.of(Recipe.builder().recipeId(recipeId).likeCount(1).build()));
                given(recipeLikeRepository.exists(userId, recipeId)).willReturn(false);

                // when
                RecipeLikeResponseDto response = recipeService.toggleLike(userId, recipeId);

                // then
                assertThat(response.isLiked()).isTrue();
                assertThat(response.getLikeCount()).isEqualTo(1);
                verify(recipeLikeRepository).insert(userId, recipeId);
                verify(recipeRepository).incrementLikeCount(recipeId);
        }

        @Test
        @DisplayName("스크랩 Toggle: 기등록 상태에서 클릭 시 스크랩 취소")
        void toggleScrap_delete() {
                // given
                Long recipeId = 60L;
                Recipe recipe = Recipe.builder().recipeId(recipeId).build();
                given(recipeRepository.findById(recipeId)).willReturn(Optional.of(recipe));
                given(recipeScrapRepository.exists(userId, recipeId)).willReturn(true);

                // when
                RecipeScrapResponseDto response = recipeService.toggleScrap(userId, recipeId);

                // then
                assertThat(response.isScrapped()).isFalse();
                verify(recipeScrapRepository).delete(userId, recipeId);
        }
}
