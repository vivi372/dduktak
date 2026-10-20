package com.dduktak.domain.inventory.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * 내 냉장고 식재료 엔티티 (user_ingredient 테이블 매핑)
 * 독립 레코드 저장 원칙(INV-01-2)에 따라 동일 식재료라도 개별 인스턴스(PK)로 관리됩니다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserIngredient {

    /**
     * 식재료 고유 식별자 (PK)
     */
    private Long ingredientId;

    /**
     * 소유 회원 식별자 (public.profiles.id UUID FK)
     */
    private UUID userId;

    /**
     * 표준 식재료 마스터 식별자 (ingredient_master.master_ingredient_id FK)
     */
    private Long masterIngredientId;

    /**
     * 식재료 카테고리 식별자 (ingredient_category.category_id FK)
     */
    private Long categoryId;

    /**
     * 표시 식재료명 (마스터 식재료명 스냅샷)
     */
    private String name;

    /**
     * 보관 장소 (REFRIGERATED: 냉장, FROZEN: 냉동, ROOM_TEMP: 실온)
     */
    private String storageType;

    /**
     * 보유 수량 (소비 차감 시 방어적 감소)
     */
    private BigDecimal quantity;

    /**
     * 수량 단위 (개, g, ml, 팩, 뿌리 등)
     */
    private String unit;

    /**
     * 소비기한 (YYYY-MM-DD)
     */
    private LocalDate expireDate;

    /**
     * 표시용 메모/별칭 (최대 30자, 예: "편의점 1+1", "엄마표 김치")
     */
    private String memo;

    /**
     * 상태 (ACTIVE: 보유 중, CONSUMED: 소비 완료, DELETED: 직접 삭제, EXPIRED: 만료)
     */
    private String status;

    /**
     * SQL 동적 연산 D-Day ((expire_date - CURRENT_DATE) 일수)
     */
    private Integer dDay;

    /**
     * 등록 일시
     */
    private OffsetDateTime createdAt;

    /**
     * 최종 수정 일시
     */
    private OffsetDateTime updatedAt;
}
