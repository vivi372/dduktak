package com.dduktak.domain.recipe.dto;

import lombok.*;

/**
 * 레시피 등록 및 수정 성공 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeSimpleResponseDto {

    private Long recipeId;
    private String title;
}
