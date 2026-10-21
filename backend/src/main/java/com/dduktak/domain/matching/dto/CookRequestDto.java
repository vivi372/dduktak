package com.dduktak.domain.matching.dto;

import jakarta.validation.constraints.Min;
import lombok.*;

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
}
