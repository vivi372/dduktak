package com.dduktak.domain.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

/**
 * 소비기한 임박(0 <= D-Day <= 3) 식재료 추출 VO
 * 매일 09시 배치 스케줄러에서 유저별 묶음 메시지 생성 시 사용됩니다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpiringIngredientTargetVo {

    private UUID userId;
    private Long ingredientId;
    private String ingredientName;
    private Integer dDay;
    private LocalDate expireDate;
    private Boolean isExpireWarnEnabled;
}
