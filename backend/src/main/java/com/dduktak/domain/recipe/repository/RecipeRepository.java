package com.dduktak.domain.recipe.repository;

import com.dduktak.domain.recipe.dto.RecipeSummaryResponseDto;
import com.dduktak.domain.recipe.entity.Recipe;
import com.dduktak.domain.recipe.entity.RecipeCategory;
import com.dduktak.domain.recipe.mapper.RecipeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 뚝딱 레시피 마스터 Repository
 */
@Repository
@RequiredArgsConstructor
public class RecipeRepository {

    private final RecipeMapper recipeMapper;

    public int insert(Recipe recipe) {
        return recipeMapper.insert(recipe);
    }

    public int update(Recipe recipe) {
        return recipeMapper.update(recipe);
    }

    public int deleteById(Long recipeId) {
        return recipeMapper.deleteById(recipeId);
    }

    public Optional<Recipe> findById(Long recipeId) {
        return recipeMapper.findById(recipeId);
    }

    public List<RecipeCategory> findAllCategories() {
        return recipeMapper.findAllCategories();
    }

    public Optional<RecipeCategory> findCategoryById(Long recipeCategoryId) {
        return recipeMapper.findCategoryById(recipeCategoryId);
    }

    public List<RecipeSummaryResponseDto> findRecipesByFilter(
            UUID userId, String query, String filter, Long recipeCategoryId, String sort, int offset, int limit
    ) {
        return recipeMapper.findRecipesByFilter(userId, query, filter, recipeCategoryId, sort, offset, limit);
    }

    public long countRecipesByFilter(UUID userId, String query, String filter, Long recipeCategoryId) {
        return recipeMapper.countRecipesByFilter(userId, query, filter, recipeCategoryId);
    }

    public int incrementLikeCount(Long recipeId) {
        return recipeMapper.incrementLikeCount(recipeId);
    }

    public int decrementLikeCount(Long recipeId) {
        return recipeMapper.decrementLikeCount(recipeId);
    }

    public int incrementCookedCount(Long recipeId) {
        return recipeMapper.incrementCookedCount(recipeId);
    }

    public List<Recipe> findAllForMatching(Long recipeCategoryId) {
        return recipeMapper.findAllForMatching(recipeCategoryId);
    }

    /**
     * 커뮤니티 인기 레시피 상위 1건 조회 (cooked_count + like_count DESC)
     */
    public Optional<Recipe> findTopPopularRecipe() {
        return recipeMapper.findTopPopularRecipe();
    }
}
