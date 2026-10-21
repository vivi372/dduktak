package com.dduktak.domain.recipe.repository;

import com.dduktak.domain.recipe.entity.RecipeIngredient;
import com.dduktak.domain.recipe.mapper.RecipeIngredientMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;

/**
 * 레시피 필요 재료 Repository
 */
@Repository
@RequiredArgsConstructor
public class RecipeIngredientRepository {

    private final RecipeIngredientMapper recipeIngredientMapper;

    public int insertBatch(Long recipeId, List<RecipeIngredient> ingredients) {
        if (ingredients == null || ingredients.isEmpty()) {
            return 0;
        }
        return recipeIngredientMapper.insertBatch(recipeId, ingredients);
    }

    public List<RecipeIngredient> findByRecipeId(Long recipeId) {
        return recipeIngredientMapper.findByRecipeId(recipeId);
    }

    public int deleteByRecipeId(Long recipeId) {
        return recipeIngredientMapper.deleteByRecipeId(recipeId);
    }

    public List<RecipeIngredient> findByRecipeIds(List<Long> recipeIds) {
        if (recipeIds == null || recipeIds.isEmpty()) {
            return Collections.emptyList();
        }
        return recipeIngredientMapper.findByRecipeIds(recipeIds);
    }
}
