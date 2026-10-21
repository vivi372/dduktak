package com.dduktak.domain.matching.controller;

import com.dduktak.domain.matching.dto.CookRequestDto;
import com.dduktak.domain.matching.dto.CookResponseDto;
import com.dduktak.domain.matching.dto.DeductedIngredientDto;
import com.dduktak.domain.matching.dto.MatchingRecommendationResponseDto;
import com.dduktak.domain.matching.service.MatchingService;
import com.dduktak.global.error.GlobalExceptionHandler;
import com.dduktak.global.filter.TraceIdFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("[단위/슬라이스 테스트] MatchingController REST API 규격 검증")
class MatchingControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private MatchingService matchingService;

    @InjectMocks
    private MatchingController matchingController;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userId.toString(), null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);

        objectMapper = new ObjectMapper();

        mockMvc = MockMvcBuilders.standaloneSetup(matchingController)
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
    @DisplayName("GET /api/v1/matching/recommendations: 스마트 매칭 추천 목록 조회 성공 (200 OK)")
    void getRecommendations_success() throws Exception {
        // given
        MatchingRecommendationResponseDto item = MatchingRecommendationResponseDto.builder()
                .recipeId(1L)
                .title("버터 간장계란밥")
                .cookingTime(5)
                .difficulty("쉬움")
                .matchingRate(85)
                .matchIngredients(List.of("계란", "밥"))
                .missingIngredients(List.of("버터"))
                .build();

        given(matchingService.getRecommendations(eq(userId), any(), eq(0), eq(10)))
                .willReturn(List.of(item));

        // when & then
        mockMvc.perform(get("/api/v1/matching/recommendations")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].title").value("버터 간장계란밥"))
                .andExpect(jsonPath("$.data[0].matchingRate").value(85));
    }

    @Test
    @DisplayName("POST /api/v1/matching/cook/{recipeId}: 요리 완료 및 재료 차감 성공 (200 OK)")
    void cookRecipe_withDeduction_success() throws Exception {
        // given
        Long recipeId = 1L;
        CookRequestDto requestDto = CookRequestDto.builder()
                .deductInventory(true)
                .servings(2)
                .build();

        CookResponseDto responseDto = CookResponseDto.builder()
                .recipeId(recipeId)
                .isDeducted(true)
                .cookedCount(6)
                .deductedIngredients(List.of(
                        DeductedIngredientDto.builder()
                                .name("계란")
                                .deductedQuantity(new BigDecimal("2.00"))
                                .remainingQuantity(new BigDecimal("8.00"))
                                .build()
                ))
                .build();

        given(matchingService.cookRecipe(eq(userId), eq(recipeId), any(CookRequestDto.class)))
                .willReturn(responseDto);

        // when & then
        mockMvc.perform(post("/api/v1/matching/cook/{recipeId}", recipeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.recipeId").value(1))
                .andExpect(jsonPath("$.data.isDeducted").value(true))
                .andExpect(jsonPath("$.data.cookedCount").value(6))
                .andExpect(jsonPath("$.data.deductedIngredients[0].name").value("계란"))
                .andExpect(jsonPath("$.data.deductedIngredients[0].deductedQuantity").value(2.00));
    }
}
