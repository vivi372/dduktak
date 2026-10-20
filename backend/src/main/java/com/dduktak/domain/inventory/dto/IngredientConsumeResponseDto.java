package com.dduktak.domain.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 식재료 수동 소비 처리 응답 DTO
 * (PATCH /api/v1/inventory/{ingredientId}/consume)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientConsumeResponseDto {

    /**
     * 식재료 고유 식별자 (PK)
     */
    private Long ingredientId;

    /**
     * 차감 후 최종 잔여 수량 (0.00 이상)
     */
    private BigDecimal remainingQuantity;

    /**
     * 상태 (ACTIVE: 잔여 수량 존재 시, CONSUMED: 0 도달 시)
     */
    private String status;
}
