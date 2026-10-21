package com.dduktak.domain.recipe.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.UUID;

/**
 * 레시피 좋아요(recipe_like) MyBatis Mapper 인터페이스
 */
@Mapper
public interface RecipeLikeMapper {

    /**
     * 특정 회원의 특정 레시피 좋아요 등록 여부 확인
     */
    boolean exists(
            @Param("userId") UUID userId,
            @Param("recipeId") Long recipeId
    );

    /**
     * 좋아요 등록
     */
    int insert(
            @Param("userId") UUID userId,
            @Param("recipeId") Long recipeId
    );

    /**
     * 좋아요 취소
     */
    int delete(
            @Param("userId") UUID userId,
            @Param("recipeId") Long recipeId
    );

    /**
     * 레시피 총 좋아요 수 조회
     */
    int countByRecipeId(@Param("recipeId") Long recipeId);
}
