package com.dduktak.domain.home.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 메인 화면 브리핑용 소비기한 임박 식재료 요약 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImminentIngredientDto {

    /**
     * 식재료 고유 식별자 (PK)
     */
    private Long ingredientId;

    /**
     * 식재료명
     */
    private String name;

    /**
     * 소비기한 D-Day (0 <= D-Day <= 3)
     */
    @com.fasterxml.jackson.annotation.JsonProperty("dDay")
    private Integer dDay;
}
