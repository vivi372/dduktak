package com.dduktak.domain.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 바코드 조회 응답 DTO
 * GET /api/v1/inventory/barcode/{barcodeNo} 명세 규격을 따릅니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BarcodeIngredientResponseDto {

    /**
     * 표준 식재료 식별자
     */
    private Long masterIngredientId;

    /**
     * 표준 식재료명
     */
    private String name;

    /**
     * 식재료 카테고리 식별자
     */
    private Long categoryId;

    /**
     * 권장 수량 단위
     */
    private String recommendedUnit;

    /**
     * 권장 소비기한 (오늘 날짜 + 권장 보관일수)
     */
    private LocalDate recommendedExpireDate;
}
