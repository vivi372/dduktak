package com.dduktak.domain.recipe.entity;

import lombok.*;

import java.time.OffsetDateTime;

/**
 * 레시피 조리 순서 엔티티 (recipe_step)
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeStep {

    /**
     * 조리 단계 고유 식별자 (PK)
     */
    private Long stepId;

    /**
     * 레시피 ID (FK)
     */
    private Long recipeId;

    /**
     * 조리 단계 번호 (1부터 순차 증가)
     */
    private Integer stepNo;

    /**
     * 조리 설명
     */
    private String description;

    /**
     * 단계별 이미지 URL (Supabase Storage, 선택)
     */
    private String imageUrl;

    /**
     * 생성 일시
     */
    private OffsetDateTime createdAt;
}
