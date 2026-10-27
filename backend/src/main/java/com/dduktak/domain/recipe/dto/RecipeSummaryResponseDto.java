package com.dduktak.domain.recipe.dto;

import lombok.*;

/**
 * 레시피 목록 카드 요약 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeSummaryResponseDto {

    private Long recipeId;
    private Long recipeCategoryId;
    private String categoryName;
    private String title;
    private String thumbnailUrl;
    private Integer cookingTime;
    private String difficulty;
    private Integer likeCount;
    private Integer cookedCount;
    private String authorNickname;
    private String authorTag;
    private Integer matchingRate; // 매칭 모드 배지용 점수 (선택)
    private Boolean isLiked; // 현재 사용자의 좋아요 여부
}
