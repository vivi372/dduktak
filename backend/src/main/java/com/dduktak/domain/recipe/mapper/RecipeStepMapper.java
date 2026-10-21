package com.dduktak.domain.recipe.mapper;

import com.dduktak.domain.recipe.entity.RecipeStep;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 레시피 조리 순서 MyBatis Mapper 인터페이스
 */
@Mapper
public interface RecipeStepMapper {

    /**
     * 조리 단계 일괄 등록
     */
    int insertBatch(
            @Param("recipeId") Long recipeId,
            @Param("steps") List<RecipeStep> steps
    );

    /**
     * 레시피 ID 기반 조리 순서 목록 조회 (step_no ASC)
     */
    List<RecipeStep> findByRecipeId(@Param("recipeId") Long recipeId);

    /**
     * 레시피 ID 기반 조리 순서 전체 삭제
     */
    int deleteByRecipeId(@Param("recipeId") Long recipeId);
}
