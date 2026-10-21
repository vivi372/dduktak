package com.dduktak.domain.recipe.repository;

import com.dduktak.domain.recipe.entity.RecipeStep;
import com.dduktak.domain.recipe.mapper.RecipeStepMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;

/**
 * 레시피 조리 단계 Repository
 */
@Repository
@RequiredArgsConstructor
public class RecipeStepRepository {

    private final RecipeStepMapper recipeStepMapper;

    public int insertBatch(Long recipeId, List<RecipeStep> steps) {
        if (steps == null || steps.isEmpty()) {
            return 0;
        }
        return recipeStepMapper.insertBatch(recipeId, steps);
    }

    public List<RecipeStep> findByRecipeId(Long recipeId) {
        return recipeStepMapper.findByRecipeId(recipeId);
    }

    public int deleteByRecipeId(Long recipeId) {
        return recipeStepMapper.deleteByRecipeId(recipeId);
    }
}
