package com.dduktak.domain.recipe.dto;

import lombok.*;

/**
 * 레시피 좋아요 토글 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeLikeResponseDto {

    private boolean liked;
    private int likeCount;
}
