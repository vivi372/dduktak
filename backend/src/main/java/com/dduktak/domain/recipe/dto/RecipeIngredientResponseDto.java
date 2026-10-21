package com.dduktak.domain.recipe.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * 레시피 상세 조회용 식재료 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeIngredientResponseDto {

    private Long recipeIngId;
    private Long masterIngredientId;
    private Long altIngredientId;
    private String altIngredientName;
    private Long categoryId;
    private String name;
    private BigDecimal quantity;
    private String unit;
    private String typeCode;
    private Boolean isOptional;
    private Boolean isSauce;
}
