package com.dduktak.domain.auth.repository;

import com.dduktak.domain.auth.entity.User;
import com.dduktak.domain.auth.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.Optional;

/**
 * 회원(users) 도메인 Repository
 * Service와 MyBatis Mapper 사이 계층으로서 안전한 영속성 데이터 접근을 제공합니다.
 */
@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final UserMapper userMapper;

    /**
     * PK로 회원 단건 조회
     */
    public Optional<User> findById(Long userId) {
        return userMapper.findById(userId);
    }

    /**
     * 이메일로 회원 단건 조회
     */
    public Optional<User> findByEmail(String email) {
        return userMapper.findByEmail(email);
    }

    /**
     * 이메일 중복 여부 확인
     */
    public boolean existsByEmail(String email) {
        return userMapper.existsByEmail(email);
    }

    /**
     * 닉네임과 유저 태그 조합 중복 여부 확인
     */
    public boolean existsByNicknameAndUserTag(String nickname, String userTag) {
        return userMapper.existsByNicknameAndUserTag(nickname, userTag);
    }

    /**
     * 신규 회원 저장
     */
    public User save(User user) {
        userMapper.insertUser(user);
        return user;
    }

    /**
     * 프로필 정보 수정
     */
    public void updateProfile(User user) {
        userMapper.updateProfile(user);
    }

    /**
     * 야간 방해금지 시간 설정
     */
    public void updateQuietTime(Long userId, LocalTime start, LocalTime end) {
        userMapper.updateQuietTime(userId, start, end);
    }

    /**
     * 회원 탈퇴 시 레시피 익명화 (user_id = NULL)
     */
    public void anonymizeRecipesByUserId(Long userId) {
        userMapper.anonymizeRecipesByUserId(userId);
    }

    /**
     * 회원 레코드 삭제
     */
    public void deleteById(Long userId) {
        userMapper.deleteUserById(userId);
    }
}
