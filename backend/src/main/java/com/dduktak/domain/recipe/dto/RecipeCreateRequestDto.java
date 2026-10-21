package com.dduktak.domain.recipe.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

/**
 * 레시피 신규 등록 및 수정 요청 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeCreateRequestDto {

    @NotNull(message = "레시피 카테고리 ID는 필수입니다.")
    private Long recipeCategoryId;

    @NotBlank(message = "레시피 제목은 필수입니다.")
    @Size(max = 50, message = "레시피 제목은 최대 50자까지 입력 가능합니다.")
    private String title;

    @Size(max = 100, message = "레시피 설명은 최대 100자까지 입력 가능합니다.")
    private String description;

    @NotNull(message = "기준 인분은 필수입니다.")
    @Min(value = 1, message = "기준 인분은 1 이상이어야 합니다.")
    private Integer servings;

    @NotNull(message = "조리 시간은 필수입니다.")
    @Min(value = 1, message = "조리 시간은 1분 이상이어야 합니다.")
    private Integer cookingTime;

    @NotBlank(message = "난이도는 필수입니다.")
    @Pattern(regexp = "^(쉬움|보통|조금복잡)$", message = "난이도는 '쉬움', '보통', '조금복잡' 중 하나여야 합니다.")
    private String difficulty;

    private String thumbnailUrl;

    @NotEmpty(message = "레시피 등록 시 최소 1개 이상의 식재료를 입력해야 합니다.")
    @Valid
    private List<RecipeIngredientItemDto> ingredients;

    @NotEmpty(message = "레시피 등록 시 최소 1개 이상의 조리 단계를 입력해야 합니다.")
    @Valid
    private List<RecipeStepItemDto> steps;
}
