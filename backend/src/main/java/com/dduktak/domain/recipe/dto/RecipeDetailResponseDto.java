package com.dduktak.domain.recipe.dto;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 레시피 상세 조회 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeDetailResponseDto {

    private Long recipeId;
    private Long recipeCategoryId;
    private String categoryName;
    private String title;
    private String description;
    private Integer servings;
    private Integer cookingTime;
    private String difficulty;
    private String thumbnailUrl;
    private Integer likeCount;
    private Integer cookedCount;

    // 작성자 정보 (탈퇴 시 닉네임: "(알 수 없음)", null)
    private UUID authorId;
    private String authorNickname;
    private String authorTag;

    // 현재 사용자 상호작용 플래그
    private Boolean isLiked;
    private Boolean isScrapped;

    // 등록 일시
    private OffsetDateTime createdAt;

    // 재료 및 조리 순서 목록
    private List<RecipeIngredientResponseDto> ingredients;
    private List<RecipeStepResponseDto> steps;
}
