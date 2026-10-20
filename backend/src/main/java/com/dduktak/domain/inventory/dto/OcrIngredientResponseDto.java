package com.dduktak.domain.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 영수증 OCR 스캔 식재료 항목 응답 DTO
 * POST /api/v1/inventory/scan-ocr 응답 리스트 항목 규격을 따릅니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrIngredientResponseDto {

    /**
     * 매핑된 표준 식재료 식별자
     */
    private Long masterIngredientId;

    /**
     * 표준 식재료명
     */
    private String name;

    /**
     * 구매 수량 (기본값: 1.00)
     */
    private BigDecimal quantity;

    /**
     * 수량 단위 (개, g, ml 등)
     */
    private String unit;

    /**
     * 권장 소비기한 (오늘 날짜 + 마스터 권장 보관일수)
     */
    private LocalDate recommendedExpireDate;
}
