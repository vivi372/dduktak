package com.dduktak.domain.recipe.entity;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * 레시피 스크랩 엔티티 (scrap)
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeScrap {

    private UUID userId;
    private Long recipeId;
    private OffsetDateTime createdAt;
}
