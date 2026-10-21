package com.dduktak.domain.matching.controller;

import com.dduktak.domain.matching.dto.CookRequestDto;
import com.dduktak.domain.matching.dto.CookResponseDto;
import com.dduktak.domain.matching.dto.MatchingRecommendationResponseDto;
import com.dduktak.domain.matching.service.MatchingService;
import com.dduktak.global.error.ApiResponseDto;
import com.dduktak.global.security.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 스마트 매칭 엔진 및 요리완료 차감 REST Controller (/api/v1/matching)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/matching")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingService matchingService;

    /**
     * 내 냉장고 기반 맞춤 레시피 추천 조회
     */
    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponseDto<List<MatchingRecommendationResponseDto>>> getRecommendations(
            @RequestParam(value = "recipeCategoryId", required = false) Long recipeCategoryId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        List<MatchingRecommendationResponseDto> response = matchingService.getRecommendations(
                userId, recipeCategoryId, page, size
        );
        return ResponseEntity.ok(ApiResponseDto.success(response, "스마트 매칭 레시피 추천 조회가 완료되었습니다."));
    }

    /**
     * 뚝딱 요리 완료 (선입선출 FIFO 자동 차감 / 2-Way)
     */
    @PostMapping("/cook/{recipeId}")
    public ResponseEntity<ApiResponseDto<CookResponseDto>> cookRecipe(
            @PathVariable("recipeId") Long recipeId,
            @Valid @RequestBody(required = false) CookRequestDto dto
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        if (dto == null) {
            dto = CookRequestDto.builder().deductInventory(true).servings(1).build();
        }
        CookResponseDto response = matchingService.cookRecipe(userId, recipeId, dto);
        return ResponseEntity.ok(ApiResponseDto.success(response, "요리 완료 처리가 성공적으로 수행되었습니다."));
    }
}
