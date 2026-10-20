package com.dduktak.domain.inventory.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Gemini Flash 모델이 영수증에서 추출하여 반환하는 원천 JSON 항목 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class GeminiReceiptItemDto {

    /**
     * 영수증 원문 품목명
     */
    private String rawName;

    /**
     * Gemini가 추론한 표준 식재료명 (74종 마스터 기준)
     */
    private String matchedMasterName;

    /**
     * 인식된 구매 수량
     */
    private BigDecimal quantity;

    /**
     * 인식된 단위 (개, g, 팩, 봉 등)
     */
    private String unit;
}
