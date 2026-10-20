package com.dduktak.domain.auth.service;

import com.dduktak.domain.auth.dto.*;
import com.dduktak.domain.auth.entity.Profile;
import com.dduktak.domain.auth.repository.ProfileRepository;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 회원 및 인증 비즈니스 로직 서비스
 * Supabase Auth 기반 Lazy Profile JIT Sync 및 프로필 관리 지원
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 첫 로그인 시점 세션 동기화 및 지연 프로필 생성 (Lazy Profile JIT Sync, AUTH-01-2, AUTH-02-2)
     * 이미 프로필이 존재하는 경우 기존 프로필을 반환합니다 (멱등성 보장).
     */
    @Transactional
    public InitProfileResponseDto initProfile(UUID userId, String email, Map<String, Object> metadata) {
        log.info("[AuthService] 프로필 세션 동기화 요청 - UserID: {}, Email: {}", userId, email);

        // 1. 기존 프로필 존재 여부 확인 (멱등성)
        Optional<Profile> existingOpt = profileRepository.findById(userId);
        if (existingOpt.isPresent()) {
            Profile existing = existingOpt.get();
            log.info("[AuthService] 기존 프로필 반환 - UserID: {}, Nickname: {}#{}",
                    userId, existing.getNickname(), existing.getUserTag());
            return InitProfileResponseDto.builder()
                    .userId(existing.getId())
                    .nickname(existing.getNickname())
                    .userTag(existing.getUserTag())
                    .profileImage(existing.getProfileImage())
                    .build();
        }

        // 2. 닉네임 결정 (metadata 우선 -> 이메일 아이디 -> 기본값)
        String nickname = extractNickname(metadata, email);

        // 3. 프로필 이미지 결정
        String profileImage = extractProfileImage(metadata);

        // 4. 4자리 고유 난수 userTag 생성 (중복 검증)
        String userTag = generateUserTag(nickname);

        // 5. 신규 Profile 엔티티 생성 및 DB 저장
        Profile profile = Profile.builder()
                .id(userId)
                .nickname(nickname)
                .userTag(userTag)
                .profileImage(profileImage)
                .quietTimeStart(LocalTime.of(21, 0, 0))
                .quietTimeEnd(LocalTime.of(8, 0, 0))
                .isExpireWarnEnabled(true)
                .isReactionNoticeEnabled(true)
                .build();

        profileRepository.save(profile);
        log.info("[AuthService] 지연 프로필 생성 완료 - UserID: {}, Nickname: {}#{}", userId, nickname, userTag);

        return InitProfileResponseDto.builder()
                .userId(profile.getId())
                .nickname(profile.getNickname())
                .userTag(profile.getUserTag())
                .profileImage(profile.getProfileImage())
                .build();
    }

    /**
     * 본인 프로필 정보 조회 (/api/v1/auth/me)
     */
    public UserProfileResponseDto getMyProfile(UUID userId) {
        return profileRepository.findProfileWithEmailById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_WARN_USER_NOT_FOUND));
    }

    /**
     * 본인 프로필 정보 수정 (USER-01-3)
     */
    @Transactional
    public UpdateProfileResponseDto updateMyProfile(UUID userId, UpdateProfileRequestDto requestDto) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_WARN_USER_NOT_FOUND));

        // 1. 닉네임 변경 요청이 있는 경우
        if (requestDto.getNickname() != null && !requestDto.getNickname().isBlank()) {
            String newNickname = requestDto.getNickname().trim();
            if (!newNickname.equals(profile.getNickname())) {
                // 기존 유저 태그 유지 하에 신규 닉네임과 태그 조합 중복 검사
                if (profileRepository.existsByNicknameAndUserTag(newNickname, profile.getUserTag())) {
                    log.warn("[AuthService] 닉네임+태그 조합 중복 발생: {}#{}", newNickname, profile.getUserTag());
                    throw new CustomException(ErrorCode.AUTH_FIELD_DUPLICATE_NICKNAME);
                }
                profile.setNickname(newNickname);
            }
        }

        // 2. 프로필 이미지 변경 요청이 있는 경우
        if (requestDto.getProfileImage() != null) {
            profile.setProfileImage(requestDto.getProfileImage());
        }

        profileRepository.updateProfile(profile);
        log.info("[AuthService] 프로필 수정 완료 - UserID: {}, Nickname: {}", userId, profile.getNickname());

        return UpdateProfileResponseDto.builder()
                .userId(profile.getId())
                .nickname(profile.getNickname())
                .profileImage(profile.getProfileImage())
                .build();
    }

    /**
     * 야간 방해금지 시간 설정 (USER-PAGE-04)
     */
    @Transactional
    public QuietTimeResponseDto updateQuietTime(UUID userId, QuietTimeRequestDto requestDto) {
        if (!profileRepository.existsById(userId)) {
            throw new CustomException(ErrorCode.AUTH_WARN_USER_NOT_FOUND);
        }

        profileRepository.updateQuietTime(
                userId,
                requestDto.getQuietTimeStart(),
                requestDto.getQuietTimeEnd()
        );

        log.info("[AuthService] 방해금지 시간 설정 변경 - UserID: {}, {} ~ {}",
                userId, requestDto.getQuietTimeStart(), requestDto.getQuietTimeEnd());

        return QuietTimeResponseDto.builder()
                .quietTimeStart(requestDto.getQuietTimeStart())
                .quietTimeEnd(requestDto.getQuietTimeEnd())
                .build();
    }

    /**
     * 회원 탈퇴 (USER-02)
     * 이메일 회원의 경우 비밀번호 검증, 작성 레시피 user_id = NULL 익명화, 개인 데이터 Cascade 파기
     */
    @Transactional
    public void withdraw(UUID userId, WithdrawRequestDto requestDto) {
        if (!profileRepository.existsById(userId)) {
            throw new CustomException(ErrorCode.AUTH_WARN_USER_NOT_FOUND);
        }

        // 1. 비밀번호가 전달되었거나 암호화 비밀번호가 존재하는 경우 검증
        if (requestDto != null && requestDto.getPassword() != null && !requestDto.getPassword().isBlank()) {
            String encryptedPassword = profileRepository.findEncryptedPasswordByUserId(userId);
            if (encryptedPassword != null && !passwordEncoder.matches(requestDto.getPassword(), encryptedPassword)) {
                log.warn("[AuthService] 회원 탈퇴 비밀번호 검증 실패 - UserID: {}", userId);
                throw new CustomException(ErrorCode.AUTH_CONFIRM_WITHDRAWAL_FAILED);
            }
        }

        // 2. 작성한 레시피의 user_id를 NULL로 익명 보존 처리 (USER-02-2)
        profileRepository.anonymizeRecipesByUserId(userId);

        // 3. 프로필 레코드 삭제 (user_ingredient, recipe_like, scrap, notification은 Cascade 삭제됨)
        profileRepository.deleteById(userId);

        // 4. auth.users 레코드 삭제 시도
        try {
            profileRepository.deleteAuthUserById(userId);
        } catch (Exception e) {
            log.debug("[AuthService] auth.users 레코드 삭제 생략 또는 완료: {}", e.getMessage());
        }

        log.info("[AuthService] 회원 탈퇴 완료 및 레시피 익명화 처리 - UserID: {}", userId);
    }

    /**
     * 메타데이터에서 닉네임 추출
     */
    private String extractNickname(Map<String, Object> metadata, String email) {
        if (metadata != null) {
            if (metadata.get("nickname") != null && !String.valueOf(metadata.get("nickname")).isBlank()) {
                return limitLength(String.valueOf(metadata.get("nickname")).trim(), 10);
            }
            if (metadata.get("name") != null && !String.valueOf(metadata.get("name")).isBlank()) {
                return limitLength(String.valueOf(metadata.get("name")).trim(), 10);
            }
            if (metadata.get("full_name") != null && !String.valueOf(metadata.get("full_name")).isBlank()) {
                return limitLength(String.valueOf(metadata.get("full_name")).trim(), 10);
            }
        }
        if (email != null && email.contains("@")) {
            String prefix = email.split("@")[0].trim();
            if (!prefix.isBlank()) {
                return limitLength(prefix, 10);
            }
        }
        return "뚝딱이";
    }

    /**
     * 메타데이터에서 프로필 이미지 URL 추출
     */
    private String extractProfileImage(Map<String, Object> metadata) {
        if (metadata != null) {
            if (metadata.get("profile_image") != null && !String.valueOf(metadata.get("profile_image")).isBlank()) {
                return String.valueOf(metadata.get("profile_image")).trim();
            }
            if (metadata.get("avatar_url") != null && !String.valueOf(metadata.get("avatar_url")).isBlank()) {
                return String.valueOf(metadata.get("avatar_url")).trim();
            }
        }
        return null;
    }

    /**
     * 4자리 난수 userTag 생성 (0000 ~ 9999)
     */
    private String generateUserTag(String nickname) {
        for (int i = 0; i < 10; i++) {
            String tag = String.format("%04d", ThreadLocalRandom.current().nextInt(10000));
            if (!profileRepository.existsByNicknameAndUserTag(nickname, tag)) {
                return tag;
            }
        }
        throw new CustomException(ErrorCode.AUTH_FIELD_DUPLICATE_NICKNAME, "태그 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }

    private String limitLength(String str, int maxLen) {
        return (str != null && str.length() > maxLen) ? str.substring(0, maxLen) : str;
    }
}
