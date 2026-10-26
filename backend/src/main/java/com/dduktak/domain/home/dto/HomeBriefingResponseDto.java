package com.dduktak.domain.home.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 메인 홈 종합 브리핑 응답 DTO (GET /api/v1/home/briefing)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeBriefingResponseDto {

    /**
     * 회원 닉네임 (미등록 시 '뚝딱이')
     */
    private String nickname;

    /**
     * 보관 중인 전체 활성 식재료 수 (status='ACTIVE')
     */
    private long totalIngredientsCount;

    /**
     * 소비기한 임박 식재료 수 (0 <= D-Day <= 3)
     */
    private long expiringIngredientsCount;

    /**
     * 가장 임박한 상위 3개 식재료 목록 (소비기한 임박순 정렬)
     */
    private List<ImminentIngredientDto> imminentIngredients;

    /**
     * 내 냉장고 기반 최고 매칭 레시피 (매칭 불가 또는 재료 0개 시 커뮤니티 인기 레시피 상위 1건 폴백)
     */
    private BriefingTopRecipeDto topRecipe;
}
