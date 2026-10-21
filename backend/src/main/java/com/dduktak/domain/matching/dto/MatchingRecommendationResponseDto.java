package com.dduktak.domain.matching.dto;

import lombok.*;

import java.util.List;

/**
 * 스마트 매칭 추천 레시피 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingRecommendationResponseDto {

    private Long recipeId;
    private String title;
    private String thumbnailUrl;
    private Integer cookingTime;
    private String difficulty;
    private Integer matchingRate;
    private List<String> matchIngredients;
    private List<String> missingIngredients;
}
