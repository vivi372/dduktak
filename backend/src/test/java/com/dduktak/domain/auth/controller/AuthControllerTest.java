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
import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("[단위/슬라이스 테스트] AuthController Supabase API 명세 및 유효성 검증 테스트 (DoD)")
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private final UUID testUserId = UUID.fromString("3f7f754c-d561-4b93-b79b-9d73a4f29f2a");

    private final UserPrincipal mockPrincipal = UserPrincipal.builder()
            .userId(testUserId)
            .email("chef@dduktak.com")
            .userMetadata(Collections.singletonMap("nickname", "뚝딱셰프"))
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
    @DisplayName("POST /api/v1/auth/init - 첫 로그인 시점 지연 프로필 생성 및 200 OK 응답")
    void initProfile_Success() throws Exception {
        // given
        InitProfileResponseDto response = InitProfileResponseDto.builder()
                .userId(testUserId)
                .nickname("뚝딱셰프")
                .userTag("1024")
                .profileImage("https://image.url/avatar.png")
                .build();

        given(authService.initProfile(eq(testUserId), eq("chef@dduktak.com"), any())).willReturn(response);

        // when & then
        mockMvc.perform(post("/api/v1/auth/init"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("프로필 세션 동기화가 완료되었습니다."))
                .andExpect(jsonPath("$.data.userId").value(testUserId.toString()))
                .andExpect(jsonPath("$.data.nickname").value("뚝딱셰프"))
                .andExpect(jsonPath("$.data.userTag").value("1024"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me - 본인 프로필 정상 조회 시 200 OK 및 상세 데이터 반환")
    void getMyProfile_Success() throws Exception {
        // given
        UserProfileResponseDto response = UserProfileResponseDto.builder()
                .userId(testUserId)
                .email("chef@dduktak.com")
                .nickname("뚝딱셰프")
                .userTag("1024")
                .profileImage("https://image.url/avatar.png")
                .status("ACTIVE")
                .quietTimeStart(LocalTime.of(21, 0, 0))
                .quietTimeEnd(LocalTime.of(8, 0, 0))
                .build();

        given(authService.getMyProfile(testUserId)).willReturn(response);

        // when & then
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(testUserId.toString()))
                .andExpect(jsonPath("$.data.email").value("chef@dduktak.com"))
                .andExpect(jsonPath("$.data.nickname").value("뚝딱셰프"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.quietTimeStart").value("21:00:00"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me - 존재하지 않는 회원 조회 시 404 NOT_FOUND 반환")
    void getMyProfile_NotFound_Throws404() throws Exception {
        // given
        given(authService.getMyProfile(testUserId))
                .willThrow(new CustomException(ErrorCode.AUTH_WARN_USER_NOT_FOUND));

        // when & then
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isNotFound())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("AUTH_WARN_USER_NOT_FOUND"));
    }

    @Test
    @DisplayName("PATCH /api/v1/auth/me - 닉네임 및 프로필 이미지 수정 성공 시 200 OK 반환")
    void updateMyProfile_Success() throws Exception {
        // given
        UpdateProfileRequestDto request = UpdateProfileRequestDto.builder()
                .nickname("수정셰프")
                .profileImage("https://image.url/new.png")
                .build();

        UpdateProfileResponseDto response = UpdateProfileResponseDto.builder()
                .userId(testUserId)
                .nickname("수정셰프")
                .profileImage("https://image.url/new.png")
                .build();

        given(authService.updateMyProfile(eq(testUserId), any(UpdateProfileRequestDto.class))).willReturn(response);

        // when & then
        mockMvc.perform(patch("/api/v1/auth/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nickname").value("수정셰프"));
    }

    @Test
    @DisplayName("PATCH /api/v1/auth/me - 닉네임 길이 유효성 실패(1글자) 시 400 Bad Request 반환")
    void updateMyProfile_InvalidNicknameLength_Throws400() throws Exception {
        // given
        UpdateProfileRequestDto request = UpdateProfileRequestDto.builder()
                .nickname("A") // 최소 2자 미만
                .build();

        // when & then
        mockMvc.perform(patch("/api/v1/auth/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("COMMON_FIELD_INVALID_INPUT"));
    }

    @Test
    @DisplayName("PATCH /api/v1/auth/me - 중복된 닉네임+태그 변경 시도 시 409 Conflict 반환")
    void updateMyProfile_DuplicateNickname_Throws409() throws Exception {
        // given
        UpdateProfileRequestDto request = UpdateProfileRequestDto.builder()
                .nickname("중복셰프")
                .build();

        given(authService.updateMyProfile(eq(testUserId), any(UpdateProfileRequestDto.class)))
                .willThrow(new CustomException(ErrorCode.AUTH_FIELD_DUPLICATE_NICKNAME));

        // when & then
        mockMvc.perform(patch("/api/v1/auth/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("AUTH_FIELD_DUPLICATE_NICKNAME"));
    }

    @Test
    @DisplayName("PATCH /api/v1/auth/me/quiet-time - 야간 방해금지 시간 설정 성공 시 200 OK 반환")
    void updateQuietTime_Success() throws Exception {
        // given
        QuietTimeRequestDto request = QuietTimeRequestDto.builder()
                .quietTimeStart(LocalTime.of(22, 0, 0))
                .quietTimeEnd(LocalTime.of(7, 0, 0))
                .build();

        QuietTimeResponseDto response = QuietTimeResponseDto.builder()
                .quietTimeStart(LocalTime.of(22, 0, 0))
                .quietTimeEnd(LocalTime.of(7, 0, 0))
                .build();

        given(authService.updateQuietTime(eq(testUserId), any(QuietTimeRequestDto.class))).willReturn(response);

        // when & then
        mockMvc.perform(patch("/api/v1/auth/me/quiet-time")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.quietTimeStart").value("22:00:00"))
                .andExpect(jsonPath("$.data.quietTimeEnd").value("07:00:00"));
    }

    @Test
    @DisplayName("DELETE /api/v1/auth/withdraw - 회원 탈퇴 성공 시 200 OK 반환")
    void withdraw_Success() throws Exception {
        // given
        WithdrawRequestDto request = WithdrawRequestDto.builder()
                .password("Password123!")
                .build();

        doNothing().when(authService).withdraw(eq(testUserId), any(WithdrawRequestDto.class));

        // when & then
        mockMvc.perform(delete("/api/v1/auth/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("회원 탈퇴가 완료되었습니다."));
    }

    @Test
    @DisplayName("DELETE /api/v1/auth/withdraw - 비밀번호 불일치 시 400 Bad Request 반환")
    void withdraw_PasswordMismatch_Throws400() throws Exception {
        // given
        WithdrawRequestDto request = WithdrawRequestDto.builder()
                .password("WrongPassword123!")
                .build();

        doThrow(new CustomException(ErrorCode.AUTH_CONFIRM_WITHDRAWAL_FAILED))
                .when(authService).withdraw(eq(testUserId), any(WithdrawRequestDto.class));

        // when & then
        mockMvc.perform(delete("/api/v1/auth/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("AUTH_CONFIRM_WITHDRAWAL_FAILED"));
    }
}
