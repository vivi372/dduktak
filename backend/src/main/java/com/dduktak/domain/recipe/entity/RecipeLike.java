package com.dduktak.domain.recipe.entity;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * 레시피 좋아요 엔티티 (recipe_like)
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeLike {

    private Long likeId;
    private UUID userId;
    private Long recipeId;
    private OffsetDateTime createdAt;
}
