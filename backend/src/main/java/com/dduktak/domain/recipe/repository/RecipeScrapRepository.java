package com.dduktak.domain.recipe.repository;

import com.dduktak.domain.recipe.mapper.RecipeScrapMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * 레시피 스크랩 Repository
 */
@Repository
@RequiredArgsConstructor
public class RecipeScrapRepository {

    private final RecipeScrapMapper recipeScrapMapper;

    public boolean exists(UUID userId, Long recipeId) {
        return recipeScrapMapper.exists(userId, recipeId);
    }

    public int insert(UUID userId, Long recipeId) {
        return recipeScrapMapper.insert(userId, recipeId);
    }

    public int delete(UUID userId, Long recipeId) {
        return recipeScrapMapper.delete(userId, recipeId);
    }
}
