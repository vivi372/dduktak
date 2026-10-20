package com.dduktak.domain.inventory.dto;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 식재료 수동 소비 처리 요청 DTO
 * (PATCH /api/v1/inventory/{ingredientId}/consume)
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientConsumeRequestDto {

    /**
     * 차감할 수량 (선택: null 또는 미제공 시 전체 보유 수량 차감)
     */
    @Positive(message = "소비 수량은 0보다 커야 합니다.")
    private BigDecimal consumeQuantity;
}
