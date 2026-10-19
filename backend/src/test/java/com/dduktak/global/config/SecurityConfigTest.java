package com.dduktak.global.config;

import com.dduktak.domain.auth.controller.AuthController;
import com.dduktak.domain.auth.dto.LoginRequestDto;
import com.dduktak.domain.auth.dto.TokenResponseDto;
import com.dduktak.domain.auth.dto.UserProfileResponseDto;
import com.dduktak.domain.auth.service.AuthService;
import com.dduktak.global.filter.JwtAuthenticationFilter;
import com.dduktak.global.filter.TraceIdFilter;
import com.dduktak.global.security.JwtAccessDeniedHandler;
import com.dduktak.global.security.JwtAuthenticationEntryPoint;
import com.dduktak.global.util.JwtProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtAuthenticationEntryPoint.class,
        JwtAccessDeniedHandler.class,
        TraceIdFilter.class
})
@DisplayName("[통합 테스트] Spring Security 필터 체인 및 JWT 인가 검증")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtProvider jwtProvider;

    @Test
    @DisplayName("공개 엔드포인트(로그인)는 인증 토큰 없이도 200 OK 접근 허용")
    void publicEndpoint_PermitAll() throws Exception {
        LoginRequestDto request = LoginRequestDto.builder()
                .email("chef@dduktak.com")
                .password("Password123!")
                .build();

        given(authService.login(any(LoginRequestDto.class)))
                .willReturn(TokenResponseDto.builder()
                        .accessToken("validAccessToken")
                        .refreshToken("validRefreshToken")
                        .build());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("보호된 엔드포인트(/api/v1/auth/me)에 토큰 없이 접근 시 401 Unauthorized 및 AUTH_ALERT_UNAUTHORIZED 반환")
    void protectedEndpoint_WithoutToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("AUTH_ALERT_UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("로그인이 필요한 서비스입니다."));
    }

    @Test
    @DisplayName("보호된 엔드포인트(/api/v1/auth/me)에 유효한 Access Token 헤더 전달 시 정상 접근 허용")
    void protectedEndpoint_WithValidToken_Returns200() throws Exception {
        String token = "validAccessToken";

        given(jwtProvider.validateToken(token)).willReturn(true);
        given(jwtProvider.isAccessToken(token)).willReturn(true);
        given(jwtProvider.getUserId(token)).willReturn(1L);
        given(jwtProvider.getEmail(token)).willReturn("chef@dduktak.com");

        given(authService.getMyProfile(1L))
                .willReturn(UserProfileResponseDto.builder()
                        .userId(1L)
                        .email("chef@dduktak.com")
                        .nickname("뚝딱셰프")
                        .build());

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(1));
    }

    @Test
    @DisplayName("보호된 엔드포인트에 Refresh Token을 Bearer로 전달 시 401 Unauthorized 거부")
    void protectedEndpoint_WithRefreshToken_Returns401() throws Exception {
        String refreshToken = "refreshTokenPassedAsBearer";

        given(jwtProvider.validateToken(refreshToken)).willReturn(true);
        given(jwtProvider.isAccessToken(refreshToken)).willReturn(false); // Not an access token!

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + refreshToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_ALERT_UNAUTHORIZED"));
    }
}
