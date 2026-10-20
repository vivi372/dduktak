package com.dduktak.domain.auth.mapper;

import com.dduktak.domain.auth.dto.UserProfileResponseDto;
import com.dduktak.domain.auth.entity.Profile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

/**
 * 회원 프로필(profiles) 도메인 MyBatis Mapper 인터페이스
 * SQL 매핑은 resources/mapper/auth/ProfileMapper.xml에 작성됩니다.
 */
@Mapper
public interface ProfileMapper {

    /**
     * 프로필 식별자(PK, UUID)로 단건 조회
     */
    Optional<Profile> findById(@Param("id") UUID id);

    /**
     * 프로필 식별자(PK, UUID)로 이메일(auth.users JOIN) 포함 단건 조회
     */
    Optional<UserProfileResponseDto> findProfileWithEmailById(@Param("id") UUID id);

    /**
     * 프로필 존재 여부 확인 (Lazy Profile 체크)
     */
    boolean existsById(@Param("id") UUID id);

    /**
     * 닉네임과 유저 태그 조합의 고유성 확인
     */
    boolean existsByNicknameAndUserTag(@Param("nickname") String nickname, @Param("userTag") String userTag);

    /**
     * 신규 프로필 저장 (insert)
     */
    int insertProfile(Profile profile);

    /**
     * 회원 프로필(닉네임, 프로필 이미지) 수정
     */
    int updateProfile(Profile profile);

    /**
     * 야간 방해금지 시간대 수정
     */
    int updateQuietTime(
            @Param("id") UUID id,
            @Param("quietTimeStart") LocalTime quietTimeStart,
            @Param("quietTimeEnd") LocalTime quietTimeEnd
    );

    /**
     * 회원 탈퇴 시 작성 레시피의 user_id를 NULL로 익명화 처리 (USER-02)
     */
    int anonymizeRecipesByUserId(@Param("userId") UUID userId);

    /**
     * 프로필 레코드 삭제 (Cascade에 의해 개인 식재료/알림/스크랩/좋아요 삭제)
     */
    int deleteProfileById(@Param("id") UUID id);

    /**
     * Supabase auth.users 레코드 삭제 (완전 탈퇴 처리)
     */
    int deleteAuthUserById(@Param("id") UUID id);

    /**
     * auth.users의 암호화된 비밀번호 조회 (이메일 회원 탈퇴 비밀번호 검증용)
     */
    String findEncryptedPasswordByUserId(@Param("id") UUID id);

    /**
     * auth.users의 raw_user_meta_data JSON 문자열 조회
     */
    String findRawUserMetaDataByUserId(@Param("id") UUID id);
}
