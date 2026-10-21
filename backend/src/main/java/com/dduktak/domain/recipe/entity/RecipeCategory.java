package com.dduktak.domain.recipe.entity;

import lombok.*;

import java.time.OffsetDateTime;

/**
 * 레시피 카테고리 엔티티 (recipe_category)
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeCategory {

    /**
     * 레시피 카테고리 식별자 (PK)
     */
    private Long recipeCategoryId;

    /**
     * 카테고리명 (8개 고정 표준 카테고리)
     */
    private String categoryName;

    /**
     * 표시 순서
     */
    private Integer displayOrder;

    /**
     * 생성 일시
     */
    private OffsetDateTime createdAt;
}
