package com.dduktak.domain.auth.service;

import com.dduktak.domain.auth.dto.*;
import com.dduktak.domain.auth.entity.User;
import com.dduktak.domain.auth.repository.UserRepository;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import com.dduktak.global.util.JwtProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("[단위 테스트] AuthService 비즈니스 로직 테스트 (DoD)")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtProvider jwtProvider;

    @InjectMocks
    private AuthService authService;

    @Nested
    @DisplayName("TC-AUTH-01: 이메일 회원가입 및 중복 검증 테스트")
    class SignupTest {

        @Test
        @DisplayName("신규 이메일 가입 요청 시 4자리 userTag 자동 생성 및 저장 성공")
        void signup_Success() {
            // given
            SignupRequestDto request = SignupRequestDto.builder()
                    .email("chef@dduktak.com")
                    .password("Password123!")
                    .nickname("뚝딱셰프")
                    .build();

            given(userRepository.existsByEmail("chef@dduktak.com")).willReturn(false);
            given(userRepository.existsByNicknameAndUserTag(eq("뚝딱셰프"), anyString())).willReturn(false);
            given(passwordEncoder.encode("Password123!")).willReturn("encodedPasswordHash");
            given(userRepository.save(any(User.class))).willAnswer(invocation -> {
                User u = invocation.getArgument(0);
                u.setUserId(1L);
                return u;
            });

            // when
            SignupResponseDto response = authService.signup(request);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getUserId()).isEqualTo(1L);
            assertThat(response.getNickname()).isEqualTo("뚝딱셰프");
            assertThat(response.getUserTag()).matches("\\d{4}"); // 4자리 숫자
            verify(userRepository, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("이미 존재하는 이메일로 가입 시도 시 AUTH_FIELD_DUPLICATE_EMAIL 예외 발생")
        void signup_DuplicateEmail_ThrowsException() {
            // given
            SignupRequestDto request = SignupRequestDto.builder()
                    .email("already@dduktak.com")
                    .password("Password123!")
                    .nickname("중복셰프")
                    .build();

            given(userRepository.existsByEmail("already@dduktak.com")).willReturn(true);

            // when & then
            assertThatThrownBy(() -> authService.signup(request))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.AUTH_FIELD_DUPLICATE_EMAIL);

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("TC-AUTH-02: 로그인 및 토큰 발급 테스트")
    class LoginTest {

        @Test
        @DisplayName("올바른 이메일과 비밀번호로 로그인 시 Access/Refresh 토큰 정상 반환")
        void login_Success() {
            // given
            LoginRequestDto request = LoginRequestDto.builder()
                    .email("chef@dduktak.com")
                    .password("Password123!")
                    .build();

            User mockUser = User.builder()
                    .userId(1L)
                    .email("chef@dduktak.com")
                    .password("encodedPasswordHash")
                    .nickname("뚝딱셰프")
                    .build();

            given(userRepository.findByEmail("chef@dduktak.com")).willReturn(Optional.of(mockUser));
            given(passwordEncoder.matches("Password123!", "encodedPasswordHash")).willReturn(true);
            given(jwtProvider.createAccessToken(1L, "chef@dduktak.com")).willReturn("mockAccessToken");
            given(jwtProvider.createRefreshToken(1L)).willReturn("mockRefreshToken");

            // when
            TokenResponseDto response = authService.login(request);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("mockAccessToken");
            assertThat(response.getRefreshToken()).isEqualTo("mockRefreshToken");
        }

        @Test
        @DisplayName("존재하지 않는 이메일로 로그인 시 AUTH_WARN_INVALID_CREDENTIALS 예외 발생")
        void login_UserNotFound_ThrowsException() {
            // given
            LoginRequestDto request = LoginRequestDto.builder()
                    .email("notfound@dduktak.com")
                    .password("Password123!")
                    .build();

            given(userRepository.findByEmail("notfound@dduktak.com")).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.AUTH_WARN_INVALID_CREDENTIALS);
        }

        @Test
        @DisplayName("비밀번호가 불일치할 경우 AUTH_WARN_INVALID_CREDENTIALS 예외 발생")
        void login_WrongPassword_ThrowsException() {
            // given
            LoginRequestDto request = LoginRequestDto.builder()
                    .email("chef@dduktak.com")
                    .password("WrongPassword!")
                    .build();

            User mockUser = User.builder()
                    .userId(1L)
                    .email("chef@dduktak.com")
                    .password("encodedPasswordHash")
                    .build();

            given(userRepository.findByEmail("chef@dduktak.com")).willReturn(Optional.of(mockUser));
            given(passwordEncoder.matches("WrongPassword!", "encodedPasswordHash")).willReturn(false);

            // when & then
            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.AUTH_WARN_INVALID_CREDENTIALS);
        }
    }

    @Nested
    @DisplayName("TC-AUTH-03: Refresh Token 기반 토큰 재발급 테스트")
    class RefreshTest {

        @Test
        @DisplayName("유효한 Refresh Token으로 신규 토큰 세트 정상 재발급")
        void refresh_Success() {
            // given
            RefreshTokenRequestDto request = RefreshTokenRequestDto.builder()
                    .refreshToken("validRefreshToken")
                    .build();

            User mockUser = User.builder()
                    .userId(1L)
                    .email("chef@dduktak.com")
                    .build();

            given(jwtProvider.isRefreshToken("validRefreshToken")).willReturn(true);
            given(jwtProvider.getUserId("validRefreshToken")).willReturn(1L);
            given(userRepository.findById(1L)).willReturn(Optional.of(mockUser));
            given(jwtProvider.createAccessToken(1L, "chef@dduktak.com")).willReturn("newAccessToken");
            given(jwtProvider.createRefreshToken(1L)).willReturn("newRefreshToken");

            // when
            TokenResponseDto response = authService.refresh(request);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("newAccessToken");
            assertThat(response.getRefreshToken()).isEqualTo("newRefreshToken");
            verify(jwtProvider, times(1)).parseAndValidate("validRefreshToken");
        }

        @Test
        @DisplayName("Access Token을 Refresh 파라미터로 전달 시 AUTH_ALERT_INVALID_TOKEN 예외 발생")
        void refresh_NotRefreshToken_ThrowsException() {
            // given
            RefreshTokenRequestDto request = RefreshTokenRequestDto.builder()
                    .refreshToken("accessTokenPassedHere")
                    .build();

            given(jwtProvider.isRefreshToken("accessTokenPassedHere")).willReturn(false);

            // when & then
            assertThatThrownBy(() -> authService.refresh(request))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.AUTH_ALERT_INVALID_TOKEN);
        }
    }

    @Nested
    @DisplayName("TC-AUTH-04: 회원 탈퇴 및 데이터 생명주기 관리 (USER-02)")
    class WithdrawTest {

        @Test
        @DisplayName("이메일 회원 탈퇴 시 비밀번호 일치 확인 후 레시피 익명화(user_id=NULL) 및 회원 삭제 수행")
        void withdraw_Success() {
            // given
            Long userId = 1L;
            WithdrawRequestDto request = WithdrawRequestDto.builder()
                    .password("Password123!")
                    .build();

            User mockUser = User.builder()
                    .userId(userId)
                    .provider("EMAIL")
                    .password("encodedPasswordHash")
                    .build();

            given(userRepository.findById(userId)).willReturn(Optional.of(mockUser));
            given(passwordEncoder.matches("Password123!", "encodedPasswordHash")).willReturn(true);

            // when
            authService.withdraw(userId, request);

            // then
            // 1. 레시피 익명화가 선제 호출되었는지 검증
            verify(userRepository, times(1)).anonymizeRecipesByUserId(userId);
            // 2. 회원 삭제가 호출되었는지 검증
            verify(userRepository, times(1)).deleteById(userId);
        }

        @Test
        @DisplayName("회원 탈퇴 시 비밀번호가 틀리면 AUTH_CONFIRM_WITHDRAWAL_FAILED 예외 발생 및 삭제 중단")
        void withdraw_WrongPassword_ThrowsException() {
            // given
            Long userId = 1L;
            WithdrawRequestDto request = WithdrawRequestDto.builder()
                    .password("WrongPassword!")
                    .build();

            User mockUser = User.builder()
                    .userId(userId)
                    .provider("EMAIL")
                    .password("encodedPasswordHash")
                    .build();

            given(userRepository.findById(userId)).willReturn(Optional.of(mockUser));
            given(passwordEncoder.matches("WrongPassword!", "encodedPasswordHash")).willReturn(false);

            // when & then
            assertThatThrownBy(() -> authService.withdraw(userId, request))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.AUTH_CONFIRM_WITHDRAWAL_FAILED);

            verify(userRepository, never()).anonymizeRecipesByUserId(any());
            verify(userRepository, never()).deleteById(any());
        }
    }

    @Nested
    @DisplayName("마이페이지 프로필 및 환경설정 테스트")
    class ProfileTest {

        @Test
        @DisplayName("본인 프로필 정보 정상 조회")
        void getMyProfile_Success() {
            // given
            Long userId = 1L;
            User mockUser = User.builder()
                    .userId(userId)
                    .email("chef@dduktak.com")
                    .nickname("뚝딱셰프")
                    .userTag("1024")
                    .profileImage("https://image.url/profile.png")
                    .quietTimeStart(LocalTime.of(21, 0))
                    .quietTimeEnd(LocalTime.of(8, 0))
                    .build();

            given(userRepository.findById(userId)).willReturn(Optional.of(mockUser));

            // when
            UserProfileResponseDto profile = authService.getMyProfile(userId);

            // then
            assertThat(profile).isNotNull();
            assertThat(profile.getEmail()).isEqualTo("chef@dduktak.com");
            assertThat(profile.getNickname()).isEqualTo("뚝딱셰프");
            assertThat(profile.getUserTag()).isEqualTo("1024");
        }

        @Test
        @DisplayName("프로필 수정 시 중복되는 닉네임+태그 조합이 발생하면 AUTH_FIELD_DUPLICATE_NICKNAME 예외 발생")
        void updateMyProfile_DuplicateNickname_ThrowsException() {
            // given
            Long userId = 1L;
            UpdateProfileRequestDto request = UpdateProfileRequestDto.builder()
                    .nickname("새로운셰프")
                    .build();

            User mockUser = User.builder()
                    .userId(userId)
                    .nickname("원래셰프")
                    .userTag("1024")
                    .build();

            given(userRepository.findById(userId)).willReturn(Optional.of(mockUser));
            given(userRepository.existsByNicknameAndUserTag("새로운셰프", "1024")).willReturn(true);

            // when & then
            assertThatThrownBy(() -> authService.updateMyProfile(userId, request))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.AUTH_FIELD_DUPLICATE_NICKNAME);
        }

        @Test
        @DisplayName("방해금지 시간대 정상 수정")
        void updateQuietTime_Success() {
            // given
            Long userId = 1L;
            QuietTimeRequestDto request = QuietTimeRequestDto.builder()
                    .quietTimeStart(LocalTime.of(22, 0))
                    .quietTimeEnd(LocalTime.of(7, 30))
                    .build();

            User mockUser = User.builder()
                    .userId(userId)
                    .build();

            given(userRepository.findById(userId)).willReturn(Optional.of(mockUser));

            // when
            QuietTimeResponseDto response = authService.updateQuietTime(userId, request);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getQuietTimeStart()).isEqualTo(LocalTime.of(22, 0));
            assertThat(response.getQuietTimeEnd()).isEqualTo(LocalTime.of(7, 30));
            verify(userRepository, times(1)).updateQuietTime(userId, LocalTime.of(22, 0), LocalTime.of(7, 30));
        }
    }
}
