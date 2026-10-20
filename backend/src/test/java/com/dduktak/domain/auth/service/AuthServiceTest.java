package com.dduktak.domain.auth.service;

import com.dduktak.domain.auth.dto.*;
import com.dduktak.domain.auth.entity.Profile;
import com.dduktak.domain.auth.repository.ProfileRepository;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("[단위 테스트] AuthService Supabase Lazy Profile & 프로필 비즈니스 로직 테스트 (DoD)")
class AuthServiceTest {

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private final UUID testUserId = UUID.fromString("3f7f754c-d561-4b93-b79b-9d73a4f29f2a");

    @Nested
    @DisplayName("TC-AUTH-01: 지연 프로필 생성 (initProfile) 및 멱등성 테스트")
    class InitProfileTest {

        @Test
        @DisplayName("신규 로그인 시 public.profiles 미존재 감지하여 4자리 userTag 자동 생성 및 저장 성공")
        void initProfile_NewUser_Success() {
            // given
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("nickname", "뚝딱셰프");
            metadata.put("avatar_url", "https://image.url/avatar.png");

            given(profileRepository.findById(testUserId)).willReturn(Optional.empty());
            given(profileRepository.existsByNicknameAndUserTag(eq("뚝딱셰프"), anyString())).willReturn(false);
            given(profileRepository.save(any(Profile.class))).willAnswer(invocation -> invocation.getArgument(0));

            // when
            InitProfileResponseDto response = authService.initProfile(testUserId, "chef@dduktak.com", metadata);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getUserId()).isEqualTo(testUserId);
            assertThat(response.getNickname()).isEqualTo("뚝딱셰프");
            assertThat(response.getUserTag()).matches("\\d{4}");
            assertThat(response.getProfileImage()).isEqualTo("https://image.url/avatar.png");
            verify(profileRepository, times(1)).save(any(Profile.class));
        }

        @Test
        @DisplayName("기존 프로필이 이미 존재하는 경우 재저장 없이 기존 프로필 정보 반환 (멱등성 보장)")
        void initProfile_ExistingUser_ReturnsExisting() {
            // given
            Profile existingProfile = Profile.builder()
                    .id(testUserId)
                    .nickname("기존셰프")
                    .userTag("9999")
                    .profileImage("https://image.url/existing.png")
                    .build();

            given(profileRepository.findById(testUserId)).willReturn(Optional.of(existingProfile));

            // when
            InitProfileResponseDto response = authService.initProfile(testUserId, "chef@dduktak.com", null);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getUserId()).isEqualTo(testUserId);
            assertThat(response.getNickname()).isEqualTo("기존셰프");
            assertThat(response.getUserTag()).isEqualTo("9999");
            verify(profileRepository, never()).save(any(Profile.class));
        }
    }

    @Nested
    @DisplayName("TC-AUTH-02: 본인 프로필 조회 (getMyProfile) 테스트")
    class GetMyProfileTest {

        @Test
        @DisplayName("정상 조회 시 auth.users 이메일 포함된 UserProfileResponseDto 반환")
        void getMyProfile_Success() {
            // given
            UserProfileResponseDto dto = UserProfileResponseDto.builder()
                    .userId(testUserId)
                    .email("chef@dduktak.com")
                    .nickname("뚝딱셰프")
                    .userTag("1024")
                    .profileImage("https://image.url/avatar.png")
                    .status("ACTIVE")
                    .quietTimeStart(LocalTime.of(21, 0, 0))
                    .quietTimeEnd(LocalTime.of(8, 0, 0))
                    .build();

            given(profileRepository.findProfileWithEmailById(testUserId)).willReturn(Optional.of(dto));

            // when
            UserProfileResponseDto result = authService.getMyProfile(testUserId);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getUserId()).isEqualTo(testUserId);
            assertThat(result.getEmail()).isEqualTo("chef@dduktak.com");
            assertThat(result.getNickname()).isEqualTo("뚝딱셰프");
            assertThat(result.getStatus()).isEqualTo("ACTIVE");
        }

        @Test
        @DisplayName("미등록 프로필 조회 시 AUTH_WARN_USER_NOT_FOUND 예외 발생")
        void getMyProfile_NotFound_ThrowsException() {
            // given
            given(profileRepository.findProfileWithEmailById(testUserId)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> authService.getMyProfile(testUserId))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.AUTH_WARN_USER_NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("TC-AUTH-03: 프로필 수정 (updateMyProfile) 테스트")
    class UpdateProfileTest {

        @Test
        @DisplayName("닉네임 및 프로필 이미지 수정 성공")
        void updateMyProfile_Success() {
            // given
            Profile profile = Profile.builder()
                    .id(testUserId)
                    .nickname("과거셰프")
                    .userTag("1024")
                    .profileImage("https://image.url/old.png")
                    .build();

            UpdateProfileRequestDto request = UpdateProfileRequestDto.builder()
                    .nickname("새셰프")
                    .profileImage("https://image.url/new.png")
                    .build();

            given(profileRepository.findById(testUserId)).willReturn(Optional.of(profile));
            given(profileRepository.existsByNicknameAndUserTag("새셰프", "1024")).willReturn(false);

            // when
            UpdateProfileResponseDto response = authService.updateMyProfile(testUserId, request);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getNickname()).isEqualTo("새셰프");
            assertThat(response.getProfileImage()).isEqualTo("https://image.url/new.png");
            verify(profileRepository, times(1)).updateProfile(profile);
        }

        @Test
        @DisplayName("신규 닉네임과 기존 태그 조합이 이미 중복되는 경우 AUTH_FIELD_DUPLICATE_NICKNAME 예외 발생")
        void updateMyProfile_DuplicateNicknameAndTag_ThrowsException() {
            // given
            Profile profile = Profile.builder()
                    .id(testUserId)
                    .nickname("과거셰프")
                    .userTag("1024")
                    .build();

            UpdateProfileRequestDto request = UpdateProfileRequestDto.builder()
                    .nickname("중복셰프")
                    .build();

            given(profileRepository.findById(testUserId)).willReturn(Optional.of(profile));
            given(profileRepository.existsByNicknameAndUserTag("중복셰프", "1024")).willReturn(true);

            // when & then
            assertThatThrownBy(() -> authService.updateMyProfile(testUserId, request))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.AUTH_FIELD_DUPLICATE_NICKNAME);

            verify(profileRepository, never()).updateProfile(any(Profile.class));
        }
    }

    @Nested
    @DisplayName("TC-AUTH-04: 야간 방해금지 시간 설정 (updateQuietTime) 테스트")
    class UpdateQuietTimeTest {

        @Test
        @DisplayName("방해금지 시간대 수정 성공")
        void updateQuietTime_Success() {
            // given
            QuietTimeRequestDto request = QuietTimeRequestDto.builder()
                    .quietTimeStart(LocalTime.of(22, 0, 0))
                    .quietTimeEnd(LocalTime.of(7, 0, 0))
                    .build();

            given(profileRepository.existsById(testUserId)).willReturn(true);

            // when
            QuietTimeResponseDto response = authService.updateQuietTime(testUserId, request);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getQuietTimeStart()).isEqualTo(LocalTime.of(22, 0, 0));
            assertThat(response.getQuietTimeEnd()).isEqualTo(LocalTime.of(7, 0, 0));
            verify(profileRepository, times(1)).updateQuietTime(testUserId, LocalTime.of(22, 0, 0), LocalTime.of(7, 0, 0));
        }
    }

    @Nested
    @DisplayName("TC-AUTH-05: 회원 탈퇴 및 데이터 처리 (withdraw) 테스트 (USER-02)")
    class WithdrawTest {

        @Test
        @DisplayName("비밀번호 검증 후 작성 레시피 익명화(NULL) 및 프로필 삭제 성공")
        void withdraw_Success() {
            // given
            WithdrawRequestDto request = WithdrawRequestDto.builder()
                    .password("Password123!")
                    .build();

            given(profileRepository.existsById(testUserId)).willReturn(true);
            given(profileRepository.findEncryptedPasswordByUserId(testUserId)).willReturn("hashedPassword");
            given(passwordEncoder.matches("Password123!", "hashedPassword")).willReturn(true);

            // when
            authService.withdraw(testUserId, request);

            // then
            verify(profileRepository, times(1)).anonymizeRecipesByUserId(testUserId);
            verify(profileRepository, times(1)).deleteById(testUserId);
            verify(profileRepository, times(1)).deleteAuthUserById(testUserId);
        }

        @Test
        @DisplayName("비밀번호 불일치 시 AUTH_CONFIRM_WITHDRAWAL_FAILED 예외 발생 및 삭제 중단")
        void withdraw_PasswordMismatch_ThrowsException() {
            // given
            WithdrawRequestDto request = WithdrawRequestDto.builder()
                    .password("WrongPassword123!")
                    .build();

            given(profileRepository.existsById(testUserId)).willReturn(true);
            given(profileRepository.findEncryptedPasswordByUserId(testUserId)).willReturn("hashedPassword");
            given(passwordEncoder.matches("WrongPassword123!", "hashedPassword")).willReturn(false);

            // when & then
            assertThatThrownBy(() -> authService.withdraw(testUserId, request))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.AUTH_CONFIRM_WITHDRAWAL_FAILED);

            verify(profileRepository, never()).anonymizeRecipesByUserId(any(UUID.class));
            verify(profileRepository, never()).deleteById(any(UUID.class));
        }
    }
}
