package com.dduktak.domain.recipe.controller;

import com.dduktak.domain.recipe.dto.*;
import com.dduktak.domain.recipe.service.RecipeService;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import com.dduktak.global.error.GlobalExceptionHandler;
import com.dduktak.global.filter.TraceIdFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("[단위/슬라이스 테스트] RecipeController REST API 규격 검증")
class RecipeControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private RecipeService recipeService;

    @InjectMocks
    private RecipeController recipeController;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userId.toString(), null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(recipeController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(new TraceIdFilter())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        MDC.clear();
    }

    @Test
    @DisplayName("GET /api/v1/recipes/categories: 카테고리 목록 조회 성공 (200 OK)")
    void getCategories_success() throws Exception {
        // given
        given(recipeService.getCategories()).willReturn(List.of(
                RecipeCategoryResponseDto.builder().recipeCategoryId(1L).categoryName("국/찌개/탕").displayOrder(1).build()
        ));

        // when & then
        mockMvc.perform(get("/api/v1/recipes/categories"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].categoryName").value("국/찌개/탕"));
    }

    @Test
    @DisplayName("GET /api/v1/recipes: 레시피 목록 조회 성공 (200 OK)")
    void getRecipes_success() throws Exception {
        // given
        RecipeSummaryResponseDto item = RecipeSummaryResponseDto.builder()
                .recipeId(1L)
                .title("버터 간장계란밥")
                .authorNickname("셰프")
                .authorTag("1024")
                .likeCount(5)
                .cookedCount(2)
                .build();
        RecipeListResponseDto responseDto = RecipeListResponseDto.builder()
                .recipes(List.of(item))
                .totalPages(1)
                .totalElements(1)
                .currentPage(0)
                .build();

        given(recipeService.getRecipes(eq(userId), any(), eq("ALL"), any(), eq("latest"), eq(0), eq(10)))
                .willReturn(responseDto);

        // when & then
        mockMvc.perform(get("/api/v1/recipes")
                        .param("filter", "ALL")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.recipes[0].title").value("버터 간장계란밥"))
                .andExpect(jsonPath("$.data.totalPages").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/recipes/{recipeId}: 레시피 상세 조회 성공 (200 OK)")
    void getRecipeDetail_success() throws Exception {
        // given
        Long recipeId = 1L;
        RecipeDetailResponseDto detailDto = RecipeDetailResponseDto.builder()
                .recipeId(recipeId)
                .title("버터 간장계란밥")
                .servings(1)
                .cookingTime(5)
                .difficulty("쉬움")
                .isLiked(true)
                .isScrapped(false)
                .ingredients(List.of(
                        RecipeIngredientResponseDto.builder()
                                .recipeIngId(10L)
                                .name("계란")
                                .quantity(new BigDecimal("1.00"))
                                .unit("개")
                                .typeCode("MAIN")
                                .isSauce(false)
                                .build()
                ))
                .steps(List.of(
                        RecipeStepResponseDto.builder().stepId(1L).stepNo(1).description("계란을 굽는다.").build()
                ))
                .build();

        given(recipeService.getRecipeDetail(userId, recipeId)).willReturn(detailDto);

        // when & then
        mockMvc.perform(get("/api/v1/recipes/{recipeId}", recipeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("버터 간장계란밥"))
                .andExpect(jsonPath("$.data.isLiked").value(true))
                .andExpect(jsonPath("$.data.ingredients[0].name").value("계란"))
                .andExpect(jsonPath("$.data.steps[0].description").value("계란을 굽는다."));
    }

    @Test
    @DisplayName("POST /api/v1/recipes: 레시피 신규 등록 성공 (201 Created)")
    void createRecipe_success() throws Exception {
        // given
        RecipeCreateRequestDto requestDto = RecipeCreateRequestDto.builder()
                .recipeCategoryId(1L)
                .title("버터 간장계란밥")
                .servings(1)
                .cookingTime(5)
                .difficulty("쉬움")
                .ingredients(List.of(
                        RecipeIngredientItemDto.builder()
                                .masterIngredientId(1L)
                                .categoryId(2L)
                                .name("계란")
                                .quantity(new BigDecimal("1.00"))
                                .unit("개")
                                .typeCode("MAIN")
                                .build()
                ))
                .steps(List.of(
                        RecipeStepItemDto.builder().stepNo(1).description("밥에 계란을 올린다.").build()
                ))
                .build();

        given(recipeService.createRecipe(eq(userId), any(RecipeCreateRequestDto.class)))
                .willReturn(RecipeSimpleResponseDto.builder().recipeId(10L).title("버터 간장계란밥").build());

        // when & then
        mockMvc.perform(post("/api/v1/recipes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.recipeId").value(10))
                .andExpect(jsonPath("$.data.title").value("버터 간장계란밥"));
    }

    @Test
    @DisplayName("POST /api/v1/recipes: @Valid 유효성 검증 실패 시 400 Bad Request")
    void createRecipe_validationFailure() throws Exception {
        // given: title이 빈 문자열
        RecipeCreateRequestDto requestDto = RecipeCreateRequestDto.builder()
                .recipeCategoryId(1L)
                .title("")
                .servings(0)
                .cookingTime(0)
                .difficulty("이상함")
                .ingredients(List.of())
                .steps(List.of())
                .build();

        // when & then
        mockMvc.perform(post("/api/v1/recipes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("COMMON_FIELD_INVALID_INPUT"));
    }

    @Test
    @DisplayName("PUT /api/v1/recipes/{recipeId}: 타인 작성 레시피 수정 시 403 Forbidden")
    void updateRecipe_notAuthor_forbidden() throws Exception {
        // given
        Long recipeId = 99L;
        RecipeCreateRequestDto requestDto = RecipeCreateRequestDto.builder()
                .recipeCategoryId(1L)
                .title("수정 레시피")
                .servings(1)
                .cookingTime(5)
                .difficulty("쉬움")
                .ingredients(List.of(
                        RecipeIngredientItemDto.builder()
                                .masterIngredientId(1L)
                                .categoryId(2L)
                                .name("계란")
                                .quantity(new BigDecimal("1.00"))
                                .unit("개")
                                .typeCode("MAIN")
                                .build()
                ))
                .steps(List.of(RecipeStepItemDto.builder().stepNo(1).description("설명").build()))
                .build();

        given(recipeService.updateRecipe(eq(userId), eq(recipeId), any(RecipeCreateRequestDto.class)))
                .willThrow(new CustomException(ErrorCode.RECIPE_WARN_NOT_AUTHOR));

        // when & then
        mockMvc.perform(put("/api/v1/recipes/{recipeId}", recipeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("RECIPE_WARN_NOT_AUTHOR"));
    }

    @Test
    @DisplayName("POST /api/v1/recipes/{recipeId}/like: 좋아요 토글 성공 (200 OK)")
    void toggleLike_success() throws Exception {
        // given
        Long recipeId = 5L;
        given(recipeService.toggleLike(userId, recipeId))
                .willReturn(RecipeLikeResponseDto.builder().liked(true).likeCount(10).build());

        // when & then
        mockMvc.perform(post("/api/v1/recipes/{recipeId}/like", recipeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.liked").value(true))
                .andExpect(jsonPath("$.data.likeCount").value(10));
    }

    @Test
    @DisplayName("POST /api/v1/recipes/{recipeId}/scrap: 스크랩 토글 성공 (200 OK)")
    void toggleScrap_success() throws Exception {
        // given
        Long recipeId = 5L;
        given(recipeService.toggleScrap(userId, recipeId))
                .willReturn(RecipeScrapResponseDto.builder().scrapped(true).build());

        // when & then
        mockMvc.perform(post("/api/v1/recipes/{recipeId}/scrap", recipeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.scrapped").value(true));
    }
}
