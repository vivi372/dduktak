package com.dduktak.domain.recipe.entity;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * 뚝딱 레시피 마스터 엔티티 (recipe)
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Recipe {

    /**
     * 레시피 고유 식별자 (PK)
     */
    private Long recipeId;

    /**
     * 작성자 회원 식별자 (UUID, USER-02 탈퇴 시 NULL 익명 보존)
     */
    private UUID userId;

    /**
     * 레시피 카테고리 ID (FK)
     */
    private Long recipeCategoryId;

    /**
     * 레시피 제목
     */
    private String title;

    /**
     * 레시피 소개 / 설명
     */
    private String description;

    /**
     * 기준 인분 (기본값 1)
     */
    private Integer servings;

    /**
     * 조리 시간 (분 단위, 기본값 15)
     */
    private Integer cookingTime;

    /**
     * 조리 난이도 ('쉬움', '보통', '어려움')
     */
    private String difficulty;

    /**
     * 대표 썸네일 이미지 URL (Supabase Storage)
     */
    private String thumbnailUrl;

    /**
     * 좋아요 수 (원자적 업데이트)
     */
    private Integer likeCount;

    /**
     * 요리 완료 수 (원자적 업데이트)
     */
    private Integer cookedCount;

    /**
     * 등록 일시
     */
    private OffsetDateTime createdAt;

    /**
     * 수정 일시
     */
    private OffsetDateTime updatedAt;
}
