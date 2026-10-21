package com.dduktak.domain.recipe.dto;

import lombok.*;

import java.util.List;

/**
 * 레시피 목록 페이징 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeListResponseDto {

    private List<RecipeSummaryResponseDto> recipes;
    private int totalPages;
    private long totalElements;
    private int currentPage;
}
