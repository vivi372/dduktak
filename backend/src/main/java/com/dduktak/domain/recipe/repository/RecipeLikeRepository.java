package com.dduktak.domain.recipe.repository;

import com.dduktak.domain.recipe.mapper.RecipeLikeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * 레시피 좋아요 Repository
 */
@Repository
@RequiredArgsConstructor
public class RecipeLikeRepository {

    private final RecipeLikeMapper recipeLikeMapper;

    public boolean exists(UUID userId, Long recipeId) {
        return recipeLikeMapper.exists(userId, recipeId);
    }

    public int insert(UUID userId, Long recipeId) {
        return recipeLikeMapper.insert(userId, recipeId);
    }

    public int delete(UUID userId, Long recipeId) {
        return recipeLikeMapper.delete(userId, recipeId);
    }

    public int countByRecipeId(Long recipeId) {
        return recipeLikeMapper.countByRecipeId(recipeId);
    }
}
