package com.dduktak.domain.matching.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

/**
 * 뚝딱 요리 완료 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CookResponseDto {

    private Long recipeId;

    @JsonProperty("isDeducted")
    private Boolean isDeducted;

    private Integer cookedCount;

    private List<DeductedIngredientDto> deductedIngredients;
}
