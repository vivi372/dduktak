package com.dduktak.domain.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 내 냉장고 식재료 개별 수정 응답 DTO
 * (PUT /api/v1/inventory/{ingredientId})
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientUpdateResponseDto {

    /**
     * 식재료 고유 식별자 (PK)
     */
    private Long ingredientId;

    /**
     * 수정 완료된 수량
     */
    private BigDecimal quantity;

    /**
     * 수정 완료된 메모
     */
    private String memo;
}
