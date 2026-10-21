package com.dduktak.domain.recipe.dto;

import lombok.*;

/**
 * 레시피 스크랩 토글 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeScrapResponseDto {

    private boolean scrapped;
}
