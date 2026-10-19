package com.dduktak.domain.auth.mapper;

import com.dduktak.domain.auth.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalTime;
import java.util.Optional;

/**
 * 회원(users) 도메인 MyBatis Mapper 인터페이스
 * SQL 매핑은 resources/mapper/auth/UserMapper.xml에 작성됩니다.
 */
@Mapper
public interface UserMapper {

    /**
     * 회원 식별자(PK)로 단건 조회
     */
    Optional<User> findById(@Param("userId") Long userId);

    /**
     * 이메일로 회원 단건 조회
     */
    Optional<User> findByEmail(@Param("email") String email);

    /**
     * 이메일 중복 여부 확인
     */
    boolean existsByEmail(@Param("email") String email);

    /**
     * 닉네임과 유저 태그 조합의 고유성 확인
     */
    boolean existsByNicknameAndUserTag(@Param("nickname") String nickname, @Param("userTag") String userTag);

    /**
     * 신규 회원 저장 (insert)
     */
    int insertUser(User user);

    /**
     * 회원 프로필(닉네임, 프로필 이미지) 수정
     */
    int updateProfile(User user);

    /**
     * 야간 방해금지 시간대 수정
     */
    int updateQuietTime(
            @Param("userId") Long userId,
            @Param("quietTimeStart") LocalTime quietTimeStart,
            @Param("quietTimeEnd") LocalTime quietTimeEnd
    );

    /**
     * 회원 탈퇴 시 작성 레시피의 user_id를 NULL로 익명화 처리 (USER-02)
     */
    int anonymizeRecipesByUserId(@Param("userId") Long userId);

    /**
     * 회원 레코드 삭제 (Cascade에 의해 개인 식재료/알림/스크랩/좋아요 삭제)
     */
    int deleteUserById(@Param("userId") Long userId);
}
