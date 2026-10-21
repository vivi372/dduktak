package com.dduktak.domain.home.controller;

import com.dduktak.domain.home.dto.BriefingTopRecipeDto;
import com.dduktak.domain.home.dto.HomeBriefingResponseDto;
import com.dduktak.domain.home.dto.ImminentIngredientDto;
import com.dduktak.domain.home.service.HomeService;
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
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 모듈 6 메인 화면 브리핑 컨트롤러 슬라이스 테스트
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("[단위/슬라이스 테스트] HomeController REST API 규격 검증")
class HomeControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private HomeService homeService;

    @InjectMocks
    private HomeController homeController;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userId.toString(), null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        mockMvc = MockMvcBuilders.standaloneSetup(homeController)
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
    @DisplayName("GET /api/v1/home/briefing: 메인 화면 종합 브리핑 정상 조회 성공 (200 OK)")
    void getBriefing_success() throws Exception {
        // given
        HomeBriefingResponseDto responseDto = HomeBriefingResponseDto.builder()
                .nickname("뚝딱이")
                .expiringIngredientsCount(2)
                .imminentIngredients(List.of(
                        ImminentIngredientDto.builder().ingredientId(10L).name("계란").dDay(1).build(),
                        ImminentIngredientDto.builder().ingredientId(11L).name("우유").dDay(2).build()
                ))
                .topRecipe(BriefingTopRecipeDto.builder()
                        .recipeId(1L)
                        .title("계란볶음밥")
                        .thumbnailUrl("https://example.com/thumb.jpg")
                        .cookingTime(15)
                        .difficulty("쉬움")
                        .matchingRate(90)
                        .build())
                .build();

        given(homeService.getBriefing(userId)).willReturn(responseDto);

        // when & then
        mockMvc.perform(get("/api/v1/home/briefing"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nickname").value("뚝딱이"))
                .andExpect(jsonPath("$.data.expiringIngredientsCount").value(2))
                .andExpect(jsonPath("$.data.imminentIngredients[0].ingredientId").value(10))
                .andExpect(jsonPath("$.data.imminentIngredients[0].name").value("계란"))
                .andExpect(jsonPath("$.data.imminentIngredients[0].dDay").value(1))
                .andExpect(jsonPath("$.data.topRecipe.recipeId").value(1))
                .andExpect(jsonPath("$.data.topRecipe.title").value("계란볶음밥"))
                .andExpect(jsonPath("$.data.topRecipe.matchingRate").value(90))
                .andExpect(jsonPath("$.message").value("메인 화면 종합 브리핑 조회가 완료되었습니다."));
    }

    @Test
    @DisplayName("GET /api/v1/home/briefing: 미인증 사용자 요청 시 401 Unauthorized 차단")
    void getBriefing_unauthorized() throws Exception {
        // given: 인증 정보 해제
        SecurityContextHolder.clearContext();

        // when & then
        mockMvc.perform(get("/api/v1/home/briefing"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("AUTH_ALERT_UNAUTHORIZED"));
    }
}
