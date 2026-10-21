package com.dduktak.domain.matching.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * 요리 완료 시 차감된 식재료 정보 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeductedIngredientDto {

    private String name;
    private BigDecimal deductedQuantity;
    private BigDecimal remainingQuantity;
}
