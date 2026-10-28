package com.dduktak.domain.auth.mapper;

import com.dduktak.domain.auth.dto.UserProfileResponseDto;
import com.dduktak.domain.auth.entity.Profile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@DisplayName("[통합 테스트] ProfileMapper MyBatis SQL 매핑 및 DB 연동 검증")
class ProfileMapperIntegrationTest {

    @Autowired
    private ProfileMapper profileMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private UUID testUserId;
    private final String testEmail = "profile_test@dduktak.com";

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        // auth.users 외래키 충족을 위해 테스트용 auth.users 레코드 사전 주입
        jdbcTemplate.update(
                "INSERT INTO auth.users (id, aud, role, email, encrypted_password, created_at, updated_at) " +
                        "VALUES (?, 'authenticated', 'authenticated', ?, '$2a$10$hashedpassword', NOW(), NOW())",
                testUserId, testEmail
        );
    }

    @Test
    @DisplayName("ProfileMapper를 통한 프로필 등록, 조회, 수정 및 삭제 전체 생명주기 검증")
    void profileCrudLifecycleTest() {
        // 1. 프로필 등록 (insertProfile)
        Profile newProfile = Profile.builder()
                .id(testUserId)
                .nickname("마이바티스")
                .userTag("9999")
                .profileImage("https://image.url/test.png")
                .quietTimeStart(LocalTime.of(21, 0, 0))
                .quietTimeEnd(LocalTime.of(8, 0, 0))
                .isExpireWarnEnabled(true)
                .isReactionNoticeEnabled(true)
                .build();

        int inserted = profileMapper.insertProfile(newProfile);
        assertThat(inserted).isEqualTo(1);

        // 2. PK로 단건 조회 (findById)
        Optional<Profile> foundById = profileMapper.findById(testUserId);
        assertThat(foundById).isPresent();
        assertThat(foundById.get().getNickname()).isEqualTo("마이바티스");
        assertThat(foundById.get().getUserTag()).isEqualTo("9999");
        assertThat(foundById.get().getProfileImage()).isEqualTo("https://image.url/test.png");

        // 3. auth.users LEFT JOIN 조회 (findProfileWithEmailById)
        Optional<UserProfileResponseDto> foundWithEmail = profileMapper.findProfileWithEmailById(testUserId);
        assertThat(foundWithEmail).isPresent();
        assertThat(foundWithEmail.get().getUserId()).isEqualTo(testUserId);
        assertThat(foundWithEmail.get().getEmail()).isEqualTo(testEmail);
        assertThat(foundWithEmail.get().getNickname()).isEqualTo("마이바티스");
        assertThat(foundWithEmail.get().getStatus()).isEqualTo("ACTIVE");

        // 4. 존재 여부 및 닉네임+태그 중복 확인
        assertThat(profileMapper.existsById(testUserId)).isTrue();
        assertThat(profileMapper.existsById(UUID.randomUUID())).isFalse();
        assertThat(profileMapper.existsByNicknameAndUserTag("마이바티스", "9999")).isTrue();
        assertThat(profileMapper.existsByNicknameAndUserTag("마이바티스", "0000")).isFalse();

        // 5. 프로필 수정 (updateProfile)
        Profile toUpdate = foundById.get();
        toUpdate.setNickname("수정바티스");
        toUpdate.setProfileImage("https://image.url/updated.png");
        int updated = profileMapper.updateProfile(toUpdate);
        assertThat(updated).isEqualTo(1);

        Profile updatedProfile = profileMapper.findById(testUserId).orElseThrow();
        assertThat(updatedProfile.getNickname()).isEqualTo("수정바티스");
        assertThat(updatedProfile.getProfileImage()).isEqualTo("https://image.url/updated.png");

        // 6. 방해금지 시간대 수정 (updateQuietTime)
        int quietUpdated = profileMapper.updateQuietTime(testUserId, LocalTime.of(23, 30, 0), LocalTime.of(6, 30, 0));
        assertThat(quietUpdated).isEqualTo(1);

        Profile quietProfile = profileMapper.findById(testUserId).orElseThrow();
        assertThat(quietProfile.getQuietTimeStart()).isEqualTo(LocalTime.of(23, 30, 0));
        assertThat(quietProfile.getQuietTimeEnd()).isEqualTo(LocalTime.of(6, 30, 0));

        // 7. 암호화된 비밀번호 조회
        String password = profileMapper.findEncryptedPasswordByUserId(testUserId);
        assertThat(password).isEqualTo("$2a$10$hashedpassword");

        // 8. 프로필 삭제 (deleteProfileById)
        int deleted = profileMapper.deleteProfileById(testUserId);
        assertThat(deleted).isEqualTo(1);
        assertThat(profileMapper.findById(testUserId)).isEmpty();
    }
}
