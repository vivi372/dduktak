package com.dduktak.domain.auth.controller;

import com.dduktak.domain.auth.dto.*;
import com.dduktak.domain.auth.service.AuthService;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import com.dduktak.global.error.GlobalExceptionHandler;
import com.dduktak.global.filter.TraceIdFilter;
import com.dduktak.global.security.UserPrincipal;
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
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("[단위/통합 테스트] AuthController API 명세 및 유효성 검증 테스트 (DoD)")
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private final UserPrincipal mockPrincipal = UserPrincipal.builder()
            .userId(1L)
            .email("chef@dduktak.com")
            .build();

    @BeforeEach
    void setUp() {
        MDC.clear();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        // @AuthenticationPrincipal 커스텀 ArgumentResolver 등록
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return mockPrincipal;
            }
        };

        this.mockMvc = MockMvcBuilders
                .standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(new TraceIdFilter())
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    @Test
    @DisplayName("POST /api/v1/auth/signup - 정상 가입 시 200 OK 및 ApiResponseDto 응답")
    void signup_Success() throws Exception {
        // given
        SignupRequestDto request = SignupRequestDto.builder()
                .email("chef@dduktak.com")
                .password("Password123!")
                .nickname("뚝딱셰프")
                .build();

        SignupResponseDto response = SignupResponseDto.builder()
                .userId(1L)
                .nickname("뚝딱셰프")
                .userTag("1024")
                .build();

        given(authService.signup(any(SignupRequestDto.class))).willReturn(response);

        // when & then
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists(TraceIdFilter.TRACE_ID_HEADER))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(1))
                .andExpect(jsonPath("$.data.nickname").value("뚝딱셰프"))
                .andExpect(jsonPath("$.data.userTag").value("1024"))
                .andExpect(jsonPath("$.message").value("회원가입이 완료되었습니다."));
    }

    @Test
    @DisplayName("POST /api/v1/auth/signup - 비밀번호 유효성(8자 미만, 특수문자 미포함) 위반 시 400 Bad Request")
    void signup_InvalidPassword_Returns400() throws Exception {
        // given: 특수문자가 없는 단순 비밀번호
        SignupRequestDto invalidRequest = SignupRequestDto.builder()
                .email("chef@dduktak.com")
                .password("short1")
                .nickname("뚝딱셰프")
                .build();

        // when & then
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(header().exists(TraceIdFilter.TRACE_ID_HEADER))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("COMMON_FIELD_INVALID_INPUT"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    @DisplayName("POST /api/v1/auth/signup - 이메일 중복 시 409 Conflict 및 에러 코드 반환")
    void signup_DuplicateEmail_Returns409() throws Exception {
        // given
        SignupRequestDto request = SignupRequestDto.builder()
                .email("duplicate@dduktak.com")
                .password("Password123!")
                .nickname("뚝딱셰프")
                .build();

        given(authService.signup(any(SignupRequestDto.class)))
                .willThrow(new CustomException(ErrorCode.AUTH_FIELD_DUPLICATE_EMAIL));

        // when & then
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(header().exists(TraceIdFilter.TRACE_ID_HEADER))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("AUTH_FIELD_DUPLICATE_EMAIL"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - 로그인 성공 시 200 OK 및 JWT 토큰 반환")
    void login_Success() throws Exception {
        // given
        LoginRequestDto request = LoginRequestDto.builder()
                .email("chef@dduktak.com")
                .password("Password123!")
                .build();

        TokenResponseDto response = TokenResponseDto.builder()
                .accessToken("mockAccessToken")
                .refreshToken("mockRefreshToken")
                .build();

        given(authService.login(any(LoginRequestDto.class))).willReturn(response);

        // when & then
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists(TraceIdFilter.TRACE_ID_HEADER))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("mockAccessToken"))
                .andExpect(jsonPath("$.data.refreshToken").value("mockRefreshToken"))
                .andExpect(jsonPath("$.message").value("로그인에 성공했습니다."));
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh - Refresh Token으로 토큰 재발급 성공")
    void refresh_Success() throws Exception {
        // given
        RefreshTokenRequestDto request = RefreshTokenRequestDto.builder()
                .refreshToken("validRefreshToken")
                .build();

        TokenResponseDto response = TokenResponseDto.builder()
                .accessToken("newAccessToken")
                .refreshToken("newRefreshToken")
                .build();

        given(authService.refresh(any(RefreshTokenRequestDto.class))).willReturn(response);

        // when & then
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists(TraceIdFilter.TRACE_ID_HEADER))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("newAccessToken"))
                .andExpect(jsonPath("$.data.refreshToken").value("newRefreshToken"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me - 본인 프로필 정보 조회 성공")
    void getMyProfile_Success() throws Exception {
        // given
        UserProfileResponseDto response = UserProfileResponseDto.builder()
                .userId(1L)
                .email("chef@dduktak.com")
                .nickname("뚝딱셰프")
                .userTag("1024")
                .profileImage("https://image.url/chef.png")
                .quietTimeStart(LocalTime.of(21, 0, 0))
                .quietTimeEnd(LocalTime.of(8, 0, 0))
                .build();

        given(authService.getMyProfile(1L)).willReturn(response);

        // when & then
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(header().exists(TraceIdFilter.TRACE_ID_HEADER))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(1))
                .andExpect(jsonPath("$.data.email").value("chef@dduktak.com"))
                .andExpect(jsonPath("$.data.nickname").value("뚝딱셰프"))
                .andExpect(jsonPath("$.data.userTag").value("1024"))
                .andExpect(jsonPath("$.data.quietTimeStart").value("21:00:00"))
                .andExpect(jsonPath("$.data.quietTimeEnd").value("08:00:00"));
    }

    @Test
    @DisplayName("PATCH /api/v1/auth/me - 프로필 정보 수정 성공")
    void updateMyProfile_Success() throws Exception {
        // given
        UpdateProfileRequestDto request = UpdateProfileRequestDto.builder()
                .nickname("수정셰프")
                .profileImage("https://image.url/new.png")
                .build();

        UpdateProfileResponseDto response = UpdateProfileResponseDto.builder()
                .userId(1L)
                .nickname("수정셰프")
                .profileImage("https://image.url/new.png")
                .build();

        given(authService.updateMyProfile(eq(1L), any(UpdateProfileRequestDto.class))).willReturn(response);

        // when & then
        mockMvc.perform(patch("/api/v1/auth/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists(TraceIdFilter.TRACE_ID_HEADER))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nickname").value("수정셰프"))
                .andExpect(jsonPath("$.message").value("프로필이 성공적으로 수정되었습니다."));
    }

    @Test
    @DisplayName("PATCH /api/v1/auth/me/quiet-time - 방해금지 시간대 수정 성공")
    void updateQuietTime_Success() throws Exception {
        // given
        QuietTimeRequestDto request = QuietTimeRequestDto.builder()
                .quietTimeStart(LocalTime.of(22, 0, 0))
                .quietTimeEnd(LocalTime.of(7, 30, 0))
                .build();

        QuietTimeResponseDto response = QuietTimeResponseDto.builder()
                .quietTimeStart(LocalTime.of(22, 0, 0))
                .quietTimeEnd(LocalTime.of(7, 30, 0))
                .build();

        given(authService.updateQuietTime(eq(1L), any(QuietTimeRequestDto.class))).willReturn(response);

        // when & then
        mockMvc.perform(patch("/api/v1/auth/me/quiet-time")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists(TraceIdFilter.TRACE_ID_HEADER))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.quietTimeStart").value("22:00:00"))
                .andExpect(jsonPath("$.data.quietTimeEnd").value("07:30:00"));
    }

    @Test
    @DisplayName("DELETE /api/v1/auth/withdraw - 회원 탈퇴 정상 처리 (USER-02)")
    void withdraw_Success() throws Exception {
        // given
        WithdrawRequestDto request = WithdrawRequestDto.builder()
                .password("Password123!")
                .build();

        doNothing().when(authService).withdraw(eq(1L), any(WithdrawRequestDto.class));

        // when & then
        mockMvc.perform(delete("/api/v1/auth/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists(TraceIdFilter.TRACE_ID_HEADER))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("회원 탈퇴가 완료되었습니다."));
    }
}
