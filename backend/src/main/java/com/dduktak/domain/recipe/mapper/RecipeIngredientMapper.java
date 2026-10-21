package com.dduktak.domain.recipe.mapper;

import com.dduktak.domain.recipe.entity.RecipeIngredient;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 레시피 필요 재료 MyBatis Mapper 인터페이스
 */
@Mapper
public interface RecipeIngredientMapper {

    /**
     * 레시피 재료 일괄 등록
     */
    int insertBatch(
            @Param("recipeId") Long recipeId,
            @Param("ingredients") List<RecipeIngredient> ingredients
    );

    /**
     * 레시피 ID 기반 필요 재료 목록 조회 (카테고리 is_sauce 및 대체재료명 JOIN)
     */
    List<RecipeIngredient> findByRecipeId(@Param("recipeId") Long recipeId);

    /**
     * 레시피 ID 기반 필요 재료 전체 삭제 (수정 시 재등록용 또는 CASCADE 보완)
     */
    int deleteByRecipeId(@Param("recipeId") Long recipeId);

    /**
     * 여러 레시피 ID에 속한 재료 목록 일괄 조회 (스마트 매칭용)
     */
    List<RecipeIngredient> findByRecipeIds(@Param("recipeIds") List<Long> recipeIds);
}
