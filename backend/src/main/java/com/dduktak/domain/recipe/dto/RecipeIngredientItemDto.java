package com.dduktak.domain.recipe.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;

/**
 * 레시피 등록 및 수정 요청 시 식재료 항목 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeIngredientItemDto {

    @NotNull(message = "표준 마스터 식재료 ID는 필수입니다.")
    private Long masterIngredientId;

    private Long altIngredientId;

    @NotNull(message = "식재료 카테고리 ID는 필수입니다.")
    private Long categoryId;

    @NotBlank(message = "식재료명은 필수입니다.")
    private String name;

    @NotNull(message = "수량은 필수입니다.")
    @DecimalMin(value = "0.01", message = "수량은 0보다 커야 합니다.")
    private BigDecimal quantity;

    @NotBlank(message = "수량 단위는 필수입니다.")
    private String unit;

    @NotBlank(message = "재료 구분은 필수입니다.")
    @Pattern(regexp = "^(MAIN|SUB)$", message = "재료 구분은 MAIN 또는 SUB이어야 합니다.")
    private String typeCode;

    @Builder.Default
    private Boolean isOptional = false;
}
