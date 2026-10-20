package com.dduktak.domain.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 표준 식재료 마스터 검색 및 카테고리별 조회 응답 DTO
 * (GET /api/v1/inventory/master-ingredients)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MasterIngredientResponseDto {

    /**
     * 표준 식재료 마스터 ID
     */
    private Long masterIngredientId;

    /**
     * 식재료 카테고리 ID
     */
    private Long categoryId;

    /**
     * 식재료 카테고리명 (예: "정육/계란", "채소류")
     */
    private String categoryName;

    /**
     * 표준 식재료명 (예: "계란", "양파")
     */
    private String name;

    /**
     * 기본 수량 단위 (개, g, ml 등)
     */
    private String defaultUnit;

    /**
     * 기본 권장 보관 일수 (일 단위)
     */
    private Integer defaultShelfDays;
}
