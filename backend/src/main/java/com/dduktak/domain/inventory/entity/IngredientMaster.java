package com.dduktak.domain.inventory.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * 표준 식재료 마스터(ingredient_master) 엔티티
 * PostgreSQL public.ingredient_master 테이블과 매핑됩니다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientMaster {

    /**
     * 마스터 식재료 고유 식별자 (PK)
     */
    private Long masterIngredientId;

    /**
     * 식재료 카테고리 식별자 (FK)
     */
    private Long categoryId;

    /**
     * 표준 식재료명 (예: '계란', '양파', '돼지고기 (삼겹살/목살)')
     */
    private String name;

    /**
     * 기본 수량 단위 (예: '개', 'g', 'ml', '뿌리', '모')
     */
    private String defaultUnit;

    /**
     * 권장 기본 소비기한 일수 (오늘 + N일 연산 기준)
     */
    private Integer defaultShelfDays;

    /**
     * 등록 일시
     */
    private OffsetDateTime createdAt;
}
