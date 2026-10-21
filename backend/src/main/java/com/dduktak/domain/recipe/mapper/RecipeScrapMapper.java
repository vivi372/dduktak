package com.dduktak.domain.recipe.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.UUID;

/**
 * 레시피 스크랩(scrap) MyBatis Mapper 인터페이스
 */
@Mapper
public interface RecipeScrapMapper {

    /**
     * 특정 회원의 특정 레시피 스크랩 등록 여부 확인
     */
    boolean exists(
            @Param("userId") UUID userId,
            @Param("recipeId") Long recipeId
    );

    /**
     * 스크랩 등록
     */
    int insert(
            @Param("userId") UUID userId,
            @Param("recipeId") Long recipeId
    );

    /**
     * 스크랩 취소
     */
    int delete(
            @Param("userId") UUID userId,
            @Param("recipeId") Long recipeId
    );
}
