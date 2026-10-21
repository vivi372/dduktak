package com.dduktak.domain.recipe.mapper;

import com.dduktak.domain.recipe.dto.RecipeSummaryResponseDto;
import com.dduktak.domain.recipe.entity.Recipe;
import com.dduktak.domain.recipe.entity.RecipeCategory;
import com.dduktak.domain.recipe.entity.RecipeIngredient;
import com.dduktak.domain.recipe.entity.RecipeStep;
import com.dduktak.global.config.DotenvTestInitializer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@ContextConfiguration(initializers = DotenvTestInitializer.class)
@DisplayName("[통합 테스트] RecipeMapper 및 관련 매퍼 MyBatis SQL 매핑 및 실제 DB 연동 검증")
class RecipeMapperIntegrationTest {

    @Autowired
    private RecipeMapper recipeMapper;

    @Autowired
    private RecipeIngredientMapper recipeIngredientMapper;

    @Autowired
    private RecipeStepMapper recipeStepMapper;

    @Autowired
    private RecipeLikeMapper recipeLikeMapper;

    @Autowired
    private RecipeScrapMapper recipeScrapMapper;

    private final UUID TEST_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Test
    @DisplayName("8대 레시피 카테고리 시드 목록 조회 및 display_order 정렬 검증")
    void findAllCategories_success() {
        List<RecipeCategory> categories = recipeMapper.findAllCategories();
        assertThat(categories).hasSize(8);
        assertThat(categories.get(0).getCategoryName()).isEqualTo("국/찌개/탕");
    }

    @Test
    @DisplayName("레시피 목록 페이징 및 카테고리 JOIN 쿼리 무결성 검증 (30선 시드)")
    void findRecipesByFilter_success() {
        List<RecipeSummaryResponseDto> recipes = recipeMapper.findRecipesByFilter(
                TEST_USER_ID, null, "ALL", null, "latest", 0, 10
        );
        assertThat(recipes).isNotEmpty();
        assertThat(recipes.size()).isLessThanOrEqualTo(10);
        assertThat(recipes.get(0).getTitle()).isNotBlank();
        assertThat(recipes.get(0).getCategoryName()).isNotBlank();
    }

    @Test
    @DisplayName("레시피 단건 조회 및 재료/조리순서 매핑 검증")
    void recipe_detail_mapping_success() {
        // 첫 번째 시드 레시피 조회
        List<RecipeSummaryResponseDto> list = recipeMapper.findRecipesByFilter(
                TEST_USER_ID, null, "ALL", null, "latest", 0, 1
        );
        assertThat(list).isNotEmpty();
        Long recipeId = list.get(0).getRecipeId();

        Optional<Recipe> recipeOpt = recipeMapper.findById(recipeId);
        assertThat(recipeOpt).isPresent();

        List<RecipeIngredient> ingredients = recipeIngredientMapper.findByRecipeId(recipeId);
        assertThat(ingredients).isNotEmpty();
        assertThat(ingredients.get(0).getName()).isNotBlank();

        List<RecipeStep> steps = recipeStepMapper.findByRecipeId(recipeId);
        assertThat(steps).isNotEmpty();
        assertThat(steps.get(0).getStepNo()).isEqualTo(1);
    }

    @Test
    @DisplayName("원자적 카운터 업데이트 및 좋아요/스크랩 토글 DB 무결성 검증")
    void atomic_counter_and_like_scrap_success() {
        List<RecipeSummaryResponseDto> list = recipeMapper.findRecipesByFilter(
                TEST_USER_ID, null, "ALL", null, "latest", 0, 1
        );
        assertThat(list).isNotEmpty();
        Long recipeId = list.get(0).getRecipeId();

        int initialCooked = recipeMapper.findById(recipeId).map(Recipe::getCookedCount).orElse(0);
        recipeMapper.incrementCookedCount(recipeId);
        int afterCooked = recipeMapper.findById(recipeId).map(Recipe::getCookedCount).orElse(0);
        assertThat(afterCooked).isEqualTo(initialCooked + 1);

        // 좋아요 등록 및 취소
        recipeLikeMapper.insert(TEST_USER_ID, recipeId);
        assertThat(recipeLikeMapper.exists(TEST_USER_ID, recipeId)).isTrue();
        recipeLikeMapper.delete(TEST_USER_ID, recipeId);
        assertThat(recipeLikeMapper.exists(TEST_USER_ID, recipeId)).isFalse();

        // 스크랩 등록 및 취소
        recipeScrapMapper.insert(TEST_USER_ID, recipeId);
        assertThat(recipeScrapMapper.exists(TEST_USER_ID, recipeId)).isTrue();
        recipeScrapMapper.delete(TEST_USER_ID, recipeId);
        assertThat(recipeScrapMapper.exists(TEST_USER_ID, recipeId)).isFalse();
    }
}
