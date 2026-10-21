package com.dduktak.domain.recipe.dto;

import lombok.*;

/**
 * 레시피 상세 조회용 조리 단계 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeStepResponseDto {

    private Long stepId;
    private Integer stepNo;
    private String description;
    private String imageUrl;
}
