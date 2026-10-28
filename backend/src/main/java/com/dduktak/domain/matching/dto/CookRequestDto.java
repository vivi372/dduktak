package com.dduktak.domain.matching.dto;

import jakarta.validation.constraints.Min;
import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * 뚝딱 요리 완료 요청 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CookRequestDto {

    /**
     * 냉장고 식재료 선입선출(FIFO) 차감 여부 (기본값 true, false 시 cookedCount만 증가)
     */
    @Builder.Default
    private Boolean deductInventory = true;

    /**
     * 조리 인분 수 (기본값 1)
     */
    @Builder.Default
    @Min(value = 1, message = "인분 수는 1 이상이어야 합니다.")
    private Integer servings = 1;

    /**
     * 사용자가 2단계 차감 검수 모달에서 수동으로 미세 조정한 식재료별 차감 수량 맵
     * (Key: masterIngredientId, Value: 차감할 수량)
     */
    private Map<Long, BigDecimal> customDeductions;
}
