package com.dduktak.domain.auth.mapper;

import com.dduktak.domain.auth.entity.User;
import com.dduktak.global.config.DotenvTestInitializer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@ContextConfiguration(initializers = DotenvTestInitializer.class)
@DisplayName("[통합 테스트] UserMapper MyBatis SQL 매핑 및 DB 연동 검증")
class UserMapperIntegrationTest {

    @Autowired
    private UserMapper userMapper;

    @Test
    @DisplayName("UserMapper를 통한 회원 등록, 조회, 수정 및 삭제 전체 생명주기 검증")
    void userCrudLifecycleTest() {
        // 1. 회원 등록 (insertUser)
        User newUser = User.builder()
                .email("mybatis_test@dduktak.com")
                .password("hashed_password_123")
                .nickname("마이바티스")
                .userTag("9999")
                .profileImage("https://image.url/test.png")
                .provider("EMAIL")
                .quietTimeStart(LocalTime.of(21, 0, 0))
                .quietTimeEnd(LocalTime.of(8, 0, 0))
                .build();

        int inserted = userMapper.insertUser(newUser);
        assertThat(inserted).isEqualTo(1);
        assertThat(newUser.getUserId()).isNotNull();

        Long generatedId = newUser.getUserId();

        // 2. PK로 조회 (findById)
        Optional<User> foundById = userMapper.findById(generatedId);
        assertThat(foundById).isPresent();
        assertThat(foundById.get().getEmail()).isEqualTo("mybatis_test@dduktak.com");
        assertThat(foundById.get().getNickname()).isEqualTo("마이바티스");
        assertThat(foundById.get().getUserTag()).isEqualTo("9999");

        // 3. 이메일로 조회 (findByEmail)
        Optional<User> foundByEmail = userMapper.findByEmail("mybatis_test@dduktak.com");
        assertThat(foundByEmail).isPresent();
        assertThat(foundByEmail.get().getUserId()).isEqualTo(generatedId);

        // 4. 이메일 및 닉네임+태그 중복 확인
        assertThat(userMapper.existsByEmail("mybatis_test@dduktak.com")).isTrue();
        assertThat(userMapper.existsByEmail("non_existent@dduktak.com")).isFalse();
        assertThat(userMapper.existsByNicknameAndUserTag("마이바티스", "9999")).isTrue();
        assertThat(userMapper.existsByNicknameAndUserTag("마이바티스", "0000")).isFalse();

        // 5. 프로필 수정 (updateProfile)
        User toUpdate = foundById.get();
        toUpdate.setNickname("수정바티스");
        toUpdate.setProfileImage("https://image.url/updated.png");
        int updated = userMapper.updateProfile(toUpdate);
        assertThat(updated).isEqualTo(1);

        User updatedUser = userMapper.findById(generatedId).orElseThrow();
        assertThat(updatedUser.getNickname()).isEqualTo("수정바티스");
        assertThat(updatedUser.getProfileImage()).isEqualTo("https://image.url/updated.png");

        // 6. 방해금지 시간대 수정 (updateQuietTime)
        int quietUpdated = userMapper.updateQuietTime(generatedId, LocalTime.of(23, 30, 0), LocalTime.of(6, 30, 0));
        assertThat(quietUpdated).isEqualTo(1);

        User quietUser = userMapper.findById(generatedId).orElseThrow();
        assertThat(quietUser.getQuietTimeStart()).isEqualTo(LocalTime.of(23, 30, 0));
        assertThat(quietUser.getQuietTimeEnd()).isEqualTo(LocalTime.of(6, 30, 0));

        // 7. 회원 삭제 (deleteUserById)
        int deleted = userMapper.deleteUserById(generatedId);
        assertThat(deleted).isEqualTo(1);
        assertThat(userMapper.findById(generatedId)).isEmpty();
    }
}
