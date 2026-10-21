package com.dduktak.domain.recipe.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * 레시피 등록 및 수정 요청 시 조리 단계 항목 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeStepItemDto {

    @NotNull(message = "단계 번호는 필수입니다.")
    @Min(value = 1, message = "단계 번호는 1 이상이어야 합니다.")
    private Integer stepNo;

    @NotBlank(message = "조리 설명은 필수입니다.")
    private String description;

    private String imageUrl;
}
