package com.dduktak.domain.recipe.controller;

import com.dduktak.domain.recipe.dto.*;
import com.dduktak.domain.recipe.service.RecipeService;
import com.dduktak.global.error.ApiResponseDto;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import com.dduktak.global.security.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 뚝딱 레시피 커뮤니티 REST Controller (/api/v1/recipes)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    /**
     * 레시피 카테고리 목록 조회
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponseDto<List<RecipeCategoryResponseDto>>> getCategories() {
        List<RecipeCategoryResponseDto> response = recipeService.getCategories();
        return ResponseEntity.ok(ApiResponseDto.success(response, "레시피 카테고리 목록 조회가 완료되었습니다."));
    }

    /**
     * 레시피 목록 조회 (검색/필터/카테고리/정렬/페이징)
     */
    @GetMapping
    public ResponseEntity<ApiResponseDto<RecipeListResponseDto>> getRecipes(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "filter", defaultValue = "ALL") String filter,
            @RequestParam(value = "recipeCategoryId", required = false) Long recipeCategoryId,
            @RequestParam(value = "sort", defaultValue = "latest") String sort,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {
        UUID userId = SecurityUtil.getCurrentUserIdOrNull();
        if (("MY".equalsIgnoreCase(filter) || "SCRAP".equalsIgnoreCase(filter)) && userId == null) {
            throw new CustomException(ErrorCode.AUTH_ALERT_UNAUTHORIZED);
        }
        RecipeListResponseDto response = recipeService.getRecipes(
                userId, query, filter, recipeCategoryId, sort, page, size
        );
        return ResponseEntity.ok(ApiResponseDto.success(response, "레시피 목록 조회가 완료되었습니다."));
    }

    /**
     * 레시피 상세 조회
     */
    @GetMapping("/{recipeId}")
    public ResponseEntity<ApiResponseDto<RecipeDetailResponseDto>> getRecipeDetail(
            @PathVariable("recipeId") Long recipeId
    ) {
        UUID userId = SecurityUtil.getCurrentUserIdOrNull();
        RecipeDetailResponseDto response = recipeService.getRecipeDetail(userId, recipeId);
        return ResponseEntity.ok(ApiResponseDto.success(response, "레시피 상세 조회가 완료되었습니다."));
    }

    /**
     * 레시피 신규 등록
     */
    @PostMapping
    public ResponseEntity<ApiResponseDto<RecipeSimpleResponseDto>> createRecipe(
            @Valid @RequestBody RecipeCreateRequestDto dto
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        RecipeSimpleResponseDto response = recipeService.createRecipe(userId, dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseDto.success(response, "레시피가 성공적으로 등록되었습니다."));
    }

    /**
     * 본인 작성 레시피 수정
     */
    @PutMapping("/{recipeId}")
    public ResponseEntity<ApiResponseDto<RecipeSimpleResponseDto>> updateRecipe(
            @PathVariable("recipeId") Long recipeId,
            @Valid @RequestBody RecipeCreateRequestDto dto
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        RecipeSimpleResponseDto response = recipeService.updateRecipe(userId, recipeId, dto);
        return ResponseEntity.ok(ApiResponseDto.success(response, "레시피가 성공적으로 수정되었습니다."));
    }

    /**
     * 본인 작성 레시피 삭제
     */
    @DeleteMapping("/{recipeId}")
    public ResponseEntity<ApiResponseDto<Void>> deleteRecipe(
            @PathVariable("recipeId") Long recipeId
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        recipeService.deleteRecipe(userId, recipeId);
        return ResponseEntity.ok(ApiResponseDto.success(null, "레시피가 성공적으로 삭제되었습니다."));
    }

    /**
     * 레시피 좋아요 Toggle
     */
    @PostMapping("/{recipeId}/like")
    public ResponseEntity<ApiResponseDto<RecipeLikeResponseDto>> toggleLike(
            @PathVariable("recipeId") Long recipeId
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        RecipeLikeResponseDto response = recipeService.toggleLike(userId, recipeId);
        String message = response.isLiked() ? "좋아요가 등록되었습니다." : "좋아요가 취소되었습니다.";
        return ResponseEntity.ok(ApiResponseDto.success(response, message));
    }

    /**
     * 레시피 스크랩 Toggle
     */
    @PostMapping("/{recipeId}/scrap")
    public ResponseEntity<ApiResponseDto<RecipeScrapResponseDto>> toggleScrap(
            @PathVariable("recipeId") Long recipeId
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        RecipeScrapResponseDto response = recipeService.toggleScrap(userId, recipeId);
        String message = response.isScrapped() ? "레시피가 스크랩되었습니다." : "스크랩이 취소되었습니다.";
        return ResponseEntity.ok(ApiResponseDto.success(response, message));
    }
}
