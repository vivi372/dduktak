package com.dduktak.domain.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 내 냉장고 식재료 수동 등록 응답 DTO
 * (POST /api/v1/inventory)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientCreateResponseDto {

    /**
     * 신규 발급된 식재료 고유 식별자 (PK)
     */
    private Long ingredientId;

    /**
     * 식재료명
     */
    private String name;

    /**
     * 표시용 메모/별칭
     */
    private String memo;
}
