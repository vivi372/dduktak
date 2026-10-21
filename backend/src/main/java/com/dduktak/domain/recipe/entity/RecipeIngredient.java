package com.dduktak.domain.recipe.entity;

import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * 레시피 필요 재료 엔티티 (recipe_ingredient)
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeIngredient {

    /**
     * 레시피 재료 고유 식별자 (PK)
     */
    private Long recipeIngId;

    /**
     * 레시피 ID (FK)
     */
    private Long recipeId;

    /**
     * 표준 마스터 식재료 ID (FK)
     */
    private Long masterIngredientId;

    /**
     * 대체 가능 표준 마스터 식재료 ID (FK, 선택)
     */
    private Long altIngredientId;

    /**
     * 식재료 카테고리 ID (FK)
     */
    private Long categoryId;

    /**
     * 재료명
     */
    private String name;

    /**
     * 필요 수량
     */
    private BigDecimal quantity;

    /**
     * 수량 단위
     */
    private String unit;

    /**
     * 재료 구분 코드 ('MAIN', 'SUB')
     */
    private String typeCode;

    /**
     * 생략 가능 여부
     */
    private Boolean isOptional;

    /**
     * 생성 일시
     */
    private OffsetDateTime createdAt;

    // 조인 조회용 확장 필드
    private String altIngredientName;
    private Boolean isSauce;
}
