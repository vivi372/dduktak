package com.dduktak.domain.home.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 메인 화면 브리핑용 최고 매칭 추천 또는 인기 레시피 폴백 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BriefingTopRecipeDto {

    /**
     * 레시피 고유 식별자 (PK)
     */
    private Long recipeId;

    /**
     * 레시피 제목
     */
    private String title;

    /**
     * 대표 썸네일 이미지 URL
     */
    private String thumbnailUrl;

    /**
     * 조리 소요 시간 (분)
     */
    private Integer cookingTime;

    /**
     * 조리 난이도 ('쉬움', '보통', '어려움')
     */
    private String difficulty;

    /**
     * 매칭 점수 (0 ~ 100%, 폴백 인기 레시피의 경우 0%)
     */
    private Integer matchingRate;
}
