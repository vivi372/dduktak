package com.dduktak.domain.auth.repository;

import com.dduktak.domain.auth.dto.UserProfileResponseDto;
import com.dduktak.domain.auth.entity.Profile;
import com.dduktak.domain.auth.mapper.ProfileMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

/**
 * 회원 프로필(profiles) 도메인 Repository
 * Service와 MyBatis Mapper 사이 계층으로서 안전한 영속성 데이터 접근을 제공합니다.
 */
@Repository
@RequiredArgsConstructor
public class ProfileRepository {

    private final ProfileMapper profileMapper;

    /**
     * PK로 프로필 단건 조회
     */
    public Optional<Profile> findById(UUID id) {
        return profileMapper.findById(id);
    }

    /**
     * PK로 이메일 포함 프로필 단건 조회
     */
    public Optional<UserProfileResponseDto> findProfileWithEmailById(UUID id) {
        return profileMapper.findProfileWithEmailById(id);
    }

    /**
     * 프로필 존재 여부 확인
     */
    public boolean existsById(UUID id) {
        return profileMapper.existsById(id);
    }

    /**
     * 닉네임과 유저 태그 조합 중복 여부 확인
     */
    public boolean existsByNicknameAndUserTag(String nickname, String userTag) {
        return profileMapper.existsByNicknameAndUserTag(nickname, userTag);
    }

    /**
     * 신규 프로필 저장
     */
    public Profile save(Profile profile) {
        profileMapper.insertProfile(profile);
        return profile;
    }

    /**
     * 프로필 정보 수정
     */
    public void updateProfile(Profile profile) {
        profileMapper.updateProfile(profile);
    }

    /**
     * 야간 방해금지 시간 설정
     */
    public void updateQuietTime(UUID id, LocalTime start, LocalTime end) {
        profileMapper.updateQuietTime(id, start, end);
    }

    /**
     * 알림 통합 설정(소비기한 알림, 소셜 알림, 야간 방해금지 시간) 수정
     */
    public void updateNotificationSettings(UUID id, Boolean isExpireWarnEnabled, Boolean isReactionNoticeEnabled,
                                           LocalTime quietTimeStart, LocalTime quietTimeEnd) {
        profileMapper.updateNotificationSettings(id, isExpireWarnEnabled, isReactionNoticeEnabled,
                quietTimeStart, quietTimeEnd);
    }

    /**
     * 회원 탈퇴 시 레시피 익명화 (user_id = NULL)
     */
    public void anonymizeRecipesByUserId(UUID id) {
        profileMapper.anonymizeRecipesByUserId(id);
    }

    /**
     * 프로필 레코드 삭제
     */
    public void deleteById(UUID id) {
        profileMapper.deleteProfileById(id);
    }

    /**
     * auth.users 회원 레코드 삭제
     */
    public void deleteAuthUserById(UUID id) {
        profileMapper.deleteAuthUserById(id);
    }

    /**
     * auth.users 비밀번호 조회
     */
    public String findEncryptedPasswordByUserId(UUID id) {
        return profileMapper.findEncryptedPasswordByUserId(id);
    }

    /**
     * auth.users raw_user_meta_data 조회
     */
    public String findRawUserMetaDataByUserId(UUID id) {
        return profileMapper.findRawUserMetaDataByUserId(id);
    }
}
