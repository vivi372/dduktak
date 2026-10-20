package com.dduktak.domain.inventory.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 내 냉장고 식재료 목록 조회 응답 DTO
 * (GET /api/v1/inventory)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientResponseDto {

    /**
     * 식재료 고유 식별자 (PK)
     */
    private Long ingredientId;

    /**
     * 표준 식재료 마스터 ID
     */
    private Long masterIngredientId;

    /**
     * 식재료 카테고리 ID
     */
    private Long categoryId;

    /**
     * 식재료명
     */
    private String name;

    /**
     * 보관 장소 (REFRIGERATED, FROZEN, ROOM_TEMP)
     */
    private String storageType;

    /**
     * 보유 수량
     */
    private BigDecimal quantity;

    /**
     * 수량 단위
     */
    private String unit;

    /**
     * 소비기한 (YYYY-MM-DD)
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate expireDate;

    /**
     * SQL 기반 실시간 연산 D-Day (expire_date - CURRENT_DATE 일수)
     */
    @com.fasterxml.jackson.annotation.JsonProperty("dDay")
    private Integer dDay;

    /**
     * 표시용 메모/별칭
     */
    private String memo;
}
