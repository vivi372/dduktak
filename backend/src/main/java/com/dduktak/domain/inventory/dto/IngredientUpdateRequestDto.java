package com.dduktak.domain.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 내 냉장고 식재료 개별 수정 요청 DTO
 * (PUT /api/v1/inventory/{ingredientId})
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientUpdateRequestDto {

    /**
     * 보관 장소 (REFRIGERATED, FROZEN, ROOM_TEMP)
     */
    @NotBlank(message = "보관 장소를 선택해 주세요.")
    @Pattern(regexp = "REFRIGERATED|FROZEN|ROOM_TEMP", message = "보관 장소는 REFRIGERATED, FROZEN, ROOM_TEMP 중 하나여야 합니다.")
    private String storageType;

    /**
     * 수정 수량 (0보다 큰 양수)
     */
    @NotNull(message = "수량을 입력해 주세요.")
    @Positive(message = "수량은 0보다 커야 합니다.")
    private BigDecimal quantity;

    /**
     * 수량 단위 (필수)
     */
    @NotBlank(message = "수량 단위를 입력해 주세요.")
    private String unit;

    /**
     * 소비기한 (필수)
     */
    @NotNull(message = "소비기한을 입력해 주세요.")
    private LocalDate expireDate;

    /**
     * 표시용 메모/별칭 (최대 30자)
     */
    @Size(max = 30, message = "메모는 최대 30자까지 입력할 수 있습니다.")
    private String memo;
}
