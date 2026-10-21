package com.dduktak.domain.recipe.service;

import com.dduktak.domain.auth.entity.Profile;
import com.dduktak.domain.auth.repository.ProfileRepository;
import com.dduktak.domain.inventory.repository.IngredientMasterRepository;
import com.dduktak.domain.recipe.dto.*;
import com.dduktak.domain.recipe.entity.Recipe;
import com.dduktak.domain.recipe.entity.RecipeCategory;
import com.dduktak.domain.recipe.entity.RecipeIngredient;
import com.dduktak.domain.recipe.entity.RecipeStep;
import com.dduktak.domain.recipe.repository.*;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 뚝딱 레시피 커뮤니티 비즈니스 로직 서비스 (모듈 3)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecipeService {

        private final RecipeRepository recipeRepository;
        private final RecipeIngredientRepository recipeIngredientRepository;
        private final RecipeStepRepository recipeStepRepository;
        private final RecipeLikeRepository recipeLikeRepository;
        private final RecipeScrapRepository recipeScrapRepository;
        private final IngredientMasterRepository ingredientMasterRepository;
        private final ProfileRepository profileRepository;

        /**
         * 8대 표준 레시피 카테고리 목록 조회
         */
        public List<RecipeCategoryResponseDto> getCategories() {
                return recipeRepository.findAllCategories().stream()
                                .map(c -> RecipeCategoryResponseDto.builder()
                                                .recipeCategoryId(c.getRecipeCategoryId())
                                                .categoryName(c.getCategoryName())
                                                .displayOrder(c.getDisplayOrder())
                                                .build())
                                .collect(Collectors.toList());
        }

        /**
         * 레시피 목록 조회 (검색/필터/카테고리/정렬 및 페이징)
         */
        public RecipeListResponseDto getRecipes(
                        UUID userId, String query, String filter, Long recipeCategoryId, String sort, int page,
                        int size) {
                if (page < 0)
                        page = 0;
                if (size <= 0)
                        size = 10;
                int offset = page * size;

                List<RecipeSummaryResponseDto> recipes = recipeRepository.findRecipesByFilter(
                                userId, query, filter, recipeCategoryId, sort, offset, size);
                long totalElements = recipeRepository.countRecipesByFilter(userId, query, filter, recipeCategoryId);
                int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;

                return RecipeListResponseDto.builder()
                                .recipes(recipes)
                                .totalPages(totalPages)
                                .totalElements(totalElements)
                                .currentPage(page)
                                .build();
        }

        /**
         * 레시피 상세 조회 (재료 목록, 조리 순서, 좋아요/스크랩 여부 포함)
         */
        public RecipeDetailResponseDto getRecipeDetail(UUID userId, Long recipeId) {
                Recipe recipe = recipeRepository.findById(recipeId)
                                .orElseThrow(() -> new CustomException(ErrorCode.RECIPE_WARN_NOT_FOUND));

                // 카테고리 정보
                String categoryName = recipeRepository.findCategoryById(recipe.getRecipeCategoryId())
                                .map(RecipeCategory::getCategoryName)
                                .orElse("기타");

                // 작성자 프로필 정보 (탈퇴 회원의 익명 레시피인 경우 기본값 처리)
                String authorNickname = "(알 수 없음)";
                String authorTag = null;
                if (recipe.getUserId() != null) {
                        Profile author = profileRepository.findById(recipe.getUserId()).orElse(null);
                        if (author != null) {
                                authorNickname = author.getNickname();
                                authorTag = author.getUserTag();
                        }
                }

                // 유저 상호작용 플래그
                boolean isLiked = (userId != null) && recipeLikeRepository.exists(userId, recipeId);
                boolean isScrapped = (userId != null) && recipeScrapRepository.exists(userId, recipeId);

                // 필요 재료 목록
                List<RecipeIngredientResponseDto> ingredientDtos = recipeIngredientRepository.findByRecipeId(recipeId)
                                .stream()
                                .map(i -> RecipeIngredientResponseDto.builder()
                                                .recipeIngId(i.getRecipeIngId())
                                                .masterIngredientId(i.getMasterIngredientId())
                                                .altIngredientId(i.getAltIngredientId())
                                                .altIngredientName(i.getAltIngredientName())
                                                .categoryId(i.getCategoryId())
                                                .name(i.getName())
                                                .quantity(i.getQuantity())
                                                .unit(i.getUnit())
                                                .typeCode(i.getTypeCode())
                                                .isOptional(i.getIsOptional())
                                                .isSauce(i.getIsSauce() != null && i.getIsSauce())
                                                .build())
                                .collect(Collectors.toList());

                // 조리 순서 목록
                List<RecipeStepResponseDto> stepDtos = recipeStepRepository.findByRecipeId(recipeId).stream()
                                .map(s -> RecipeStepResponseDto.builder()
                                                .stepId(s.getStepId())
                                                .stepNo(s.getStepNo())
                                                .description(s.getDescription())
                                                .imageUrl(s.getImageUrl())
                                                .build())
                                .collect(Collectors.toList());

                return RecipeDetailResponseDto.builder()
                                .recipeId(recipe.getRecipeId())
                                .recipeCategoryId(recipe.getRecipeCategoryId())
                                .categoryName(categoryName)
                                .title(recipe.getTitle())
                                .description(recipe.getDescription())
                                .servings(recipe.getServings())
                                .cookingTime(recipe.getCookingTime())
                                .difficulty(recipe.getDifficulty())
                                .thumbnailUrl(recipe.getThumbnailUrl())
                                .likeCount(recipe.getLikeCount())
                                .cookedCount(recipe.getCookedCount())
                                .authorId(recipe.getUserId())
                                .authorNickname(authorNickname)
                                .authorTag(authorTag)
                                .isLiked(isLiked)
                                .isScrapped(isScrapped)
                                .createdAt(recipe.getCreatedAt())
                                .ingredients(ingredientDtos)
                                .steps(stepDtos)
                                .build();
        }

        /**
         * 레시피 신규 등록
         */
        @Transactional
        public RecipeSimpleResponseDto createRecipe(UUID userId, RecipeCreateRequestDto dto) {
                validateRecipePayload(dto);

                // 1. 레시피 마스터 저장
                Recipe recipe = Recipe.builder()
                                .userId(userId)
                                .recipeCategoryId(dto.getRecipeCategoryId())
                                .title(dto.getTitle())
                                .description(dto.getDescription())
                                .servings(dto.getServings())
                                .cookingTime(dto.getCookingTime())
                                .difficulty(dto.getDifficulty())
                                .thumbnailUrl(dto.getThumbnailUrl())
                                .build();
                recipeRepository.insert(recipe);

                // 2. 재료 목록 일괄 저장
                List<RecipeIngredient> ingredients = dto.getIngredients().stream()
                                .map(item -> RecipeIngredient.builder()
                                                .recipeId(recipe.getRecipeId())
                                                .masterIngredientId(item.getMasterIngredientId())
                                                .altIngredientId(item.getAltIngredientId())
                                                .categoryId(item.getCategoryId())
                                                .name(item.getName())
                                                .quantity(item.getQuantity())
                                                .unit(item.getUnit())
                                                .typeCode(item.getTypeCode())
                                                .isOptional(item.getIsOptional() != null && item.getIsOptional())
                                                .build())
                                .collect(Collectors.toList());
                recipeIngredientRepository.insertBatch(recipe.getRecipeId(), ingredients);

                // 3. 조리 단계 목록 일괄 저장
                List<RecipeStep> steps = dto.getSteps().stream()
                                .map(item -> RecipeStep.builder()
                                                .recipeId(recipe.getRecipeId())
                                                .stepNo(item.getStepNo())
                                                .description(item.getDescription())
                                                .imageUrl(item.getImageUrl())
                                                .build())
                                .collect(Collectors.toList());
                recipeStepRepository.insertBatch(recipe.getRecipeId(), steps);

                return RecipeSimpleResponseDto.builder()
                                .recipeId(recipe.getRecipeId())
                                .title(recipe.getTitle())
                                .build();
        }

        /**
         * 본인 작성 레시피 수정 (익명 레시피 또는 타인 레시피는 403 Forbidden 차단)
         */
        @Transactional
        public RecipeSimpleResponseDto updateRecipe(UUID userId, Long recipeId, RecipeCreateRequestDto dto) {
                Recipe existing = recipeRepository.findById(recipeId)
                                .orElseThrow(() -> new CustomException(ErrorCode.RECIPE_WARN_NOT_FOUND));

                // 작성자 검증: 탈퇴한 유저의 익명 레시피(user_id = null) 또는 타인 작성 레시피 수정 거부
                if (existing.getUserId() == null || !existing.getUserId().equals(userId)) {
                        throw new CustomException(ErrorCode.RECIPE_WARN_NOT_AUTHOR);
                }

                validateRecipePayload(dto);

                // 1. 기본 정보 업데이트
                existing.setRecipeCategoryId(dto.getRecipeCategoryId());
                existing.setTitle(dto.getTitle());
                existing.setDescription(dto.getDescription());
                existing.setServings(dto.getServings());
                existing.setCookingTime(dto.getCookingTime());
                existing.setDifficulty(dto.getDifficulty());
                existing.setThumbnailUrl(dto.getThumbnailUrl());
                recipeRepository.update(existing);

                // 2. 재료 삭제 후 재등록
                recipeIngredientRepository.deleteByRecipeId(recipeId);
                List<RecipeIngredient> ingredients = dto.getIngredients().stream()
                                .map(item -> RecipeIngredient.builder()
                                                .recipeId(recipeId)
                                                .masterIngredientId(item.getMasterIngredientId())
                                                .altIngredientId(item.getAltIngredientId())
                                                .categoryId(item.getCategoryId())
                                                .name(item.getName())
                                                .quantity(item.getQuantity())
                                                .unit(item.getUnit())
                                                .typeCode(item.getTypeCode())
                                                .isOptional(item.getIsOptional() != null && item.getIsOptional())
                                                .build())
                                .collect(Collectors.toList());
                recipeIngredientRepository.insertBatch(recipeId, ingredients);

                // 3. 조리 단계 삭제 후 재등록
                recipeStepRepository.deleteByRecipeId(recipeId);
                List<RecipeStep> steps = dto.getSteps().stream()
                                .map(item -> RecipeStep.builder()
                                                .recipeId(recipeId)
                                                .stepNo(item.getStepNo())
                                                .description(item.getDescription())
                                                .imageUrl(item.getImageUrl())
                                                .build())
                                .collect(Collectors.toList());
                recipeStepRepository.insertBatch(recipeId, steps);

                return RecipeSimpleResponseDto.builder()
                                .recipeId(recipeId)
                                .title(existing.getTitle())
                                .build();
        }

        /**
         * 본인 작성 레시피 삭제 (익명 레시피 또는 타인 레시피는 403 Forbidden 차단)
         */
        @Transactional
        public void deleteRecipe(UUID userId, Long recipeId) {
                Recipe existing = recipeRepository.findById(recipeId)
                                .orElseThrow(() -> new CustomException(ErrorCode.RECIPE_WARN_NOT_FOUND));

                if (existing.getUserId() == null || !existing.getUserId().equals(userId)) {
                        throw new CustomException(ErrorCode.RECIPE_WARN_NOT_AUTHOR);
                }

                // 하위 테이블 삭제 및 레시피 마스터 삭제
                recipeIngredientRepository.deleteByRecipeId(recipeId);
                recipeStepRepository.deleteByRecipeId(recipeId);
                recipeLikeRepository.delete(userId, recipeId);
                recipeScrapRepository.delete(userId, recipeId);
                recipeRepository.deleteById(recipeId);
        }

        /**
         * 레시피 좋아요 Toggle (원자적 카운트 증가/감소)
         */
        @Transactional
        public RecipeLikeResponseDto toggleLike(UUID userId, Long recipeId) {
                recipeRepository.findById(recipeId)
                                .orElseThrow(() -> new CustomException(ErrorCode.RECIPE_WARN_NOT_FOUND));

                boolean isLiked = recipeLikeRepository.exists(userId, recipeId);
                if (isLiked) {
                        recipeLikeRepository.delete(userId, recipeId);
                        recipeRepository.decrementLikeCount(recipeId);
                        int updatedCount = recipeRepository.findById(recipeId).map(Recipe::getLikeCount).orElse(0);
                        return RecipeLikeResponseDto.builder().liked(false).likeCount(updatedCount).build();
                } else {
                        recipeLikeRepository.insert(userId, recipeId);
                        recipeRepository.incrementLikeCount(recipeId);
                        int updatedCount = recipeRepository.findById(recipeId).map(Recipe::getLikeCount).orElse(1);
                        return RecipeLikeResponseDto.builder().liked(true).likeCount(updatedCount).build();
                }
        }

        /**
         * 레시피 스크랩 Toggle
         */
        @Transactional
        public RecipeScrapResponseDto toggleScrap(UUID userId, Long recipeId) {
                recipeRepository.findById(recipeId)
                                .orElseThrow(() -> new CustomException(ErrorCode.RECIPE_WARN_NOT_FOUND));

                boolean isScrapped = recipeScrapRepository.exists(userId, recipeId);
                if (isScrapped) {
                        recipeScrapRepository.delete(userId, recipeId);
                        return RecipeScrapResponseDto.builder().scrapped(false).build();
                } else {
                        recipeScrapRepository.insert(userId, recipeId);
                        return RecipeScrapResponseDto.builder().scrapped(true).build();
                }
        }

        /**
         * 레시피 등록 및 수정 요청 유효성 검증
         */
        private void validateRecipePayload(RecipeCreateRequestDto dto) {
                // 카테고리 존재 확인
                recipeRepository.findCategoryById(dto.getRecipeCategoryId())
                                .orElseThrow(() -> new CustomException(ErrorCode.COMMON_FIELD_INVALID_INPUT));

                // 식재료 필수 검증
                if (dto.getIngredients() == null || dto.getIngredients().isEmpty()) {
                        throw new CustomException(ErrorCode.RECIPE_FIELD_REQUIRED_INGREDIENTS);
                }

                // 표준 식재료 마스터 존재 여부 검증
                for (RecipeIngredientItemDto ing : dto.getIngredients()) {
                        if (ingredientMasterRepository.findById(ing.getMasterIngredientId()).isEmpty()) {
                                throw new CustomException(ErrorCode.COMMON_FIELD_INVALID_INPUT);
                        }
                        if (ing.getAltIngredientId() != null
                                        && ingredientMasterRepository.findById(ing.getAltIngredientId()).isEmpty()) {
                                throw new CustomException(ErrorCode.COMMON_FIELD_INVALID_INPUT);
                        }
                }
        }
}
