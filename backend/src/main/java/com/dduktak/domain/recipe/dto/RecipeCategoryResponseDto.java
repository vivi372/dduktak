package com.dduktak.domain.recipe.dto;

import lombok.*;

/**
 * 레시피 카테고리 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeCategoryResponseDto {

    private Long recipeCategoryId;
    private String categoryName;
    private Integer displayOrder;
}
