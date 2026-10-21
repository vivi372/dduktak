package com.dduktak.domain.recipe.mapper;

import com.dduktak.domain.recipe.dto.RecipeSummaryResponseDto;
import com.dduktak.domain.recipe.entity.Recipe;
import com.dduktak.domain.recipe.entity.RecipeCategory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 레시피 마스터 MyBatis Mapper 인터페이스
 */
@Mapper
public interface RecipeMapper {

    /**
     * 신규 레시피 등록 (useGeneratedKeys)
     */
    int insert(Recipe recipe);

    /**
     * 레시피 수정
     */
    int update(Recipe recipe);

    /**
     * 레시피 삭제
     */
    int deleteById(@Param("recipeId") Long recipeId);

    /**
     * 레시피 ID 기반 단건 조회
     */
    Optional<Recipe> findById(@Param("recipeId") Long recipeId);

    /**
     * 전체 레시피 카테고리 목록 조회
     */
    List<RecipeCategory> findAllCategories();

    /**
     * 레시피 카테고리 단건 조회
     */
    Optional<RecipeCategory> findCategoryById(@Param("recipeCategoryId") Long recipeCategoryId);

    /**
     * 레시피 목록 페이징 및 필터/검색/정렬 조회
     */
    List<RecipeSummaryResponseDto> findRecipesByFilter(
            @Param("userId") UUID userId,
            @Param("query") String query,
            @Param("filter") String filter,
            @Param("recipeCategoryId") Long recipeCategoryId,
            @Param("sort") String sort,
            @Param("offset") int offset,
            @Param("limit") int limit
    );

    /**
     * 레시피 목록 페이징 총 건수 카운트
     */
    long countRecipesByFilter(
            @Param("userId") UUID userId,
            @Param("query") String query,
            @Param("filter") String filter,
            @Param("recipeCategoryId") Long recipeCategoryId
    );

    /**
     * 원자적 좋아요 수 증가 (+1)
     */
    int incrementLikeCount(@Param("recipeId") Long recipeId);

    /**
     * 원자적 좋아요 수 감소 (GREATEST(0, like_count - 1))
     */
    int decrementLikeCount(@Param("recipeId") Long recipeId);

    /**
     * 원자적 요리 완료 수 증가 (+1)
     */
    int incrementCookedCount(@Param("recipeId") Long recipeId);

    /**
     * 스마트 매칭용: 전체 레시피 목록 조회 (카테고리 필터 선택적 적용)
     */
    List<Recipe> findAllForMatching(@Param("recipeCategoryId") Long recipeCategoryId);

    /**
     * 커뮤니티 인기 레시피 상위 1건 조회 (cooked_count + like_count DESC)
     */
    Optional<Recipe> findTopPopularRecipe();
}
