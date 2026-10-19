package com.dduktak.domain.auth.service;

import com.dduktak.domain.auth.dto.*;
import com.dduktak.domain.auth.entity.User;
import com.dduktak.domain.auth.repository.UserRepository;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import com.dduktak.global.util.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 회원 및 인증 비즈니스 로직 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    /**
     * 이메일 회원가입 (AUTH-01-1, USER-01)
     * 중복 이메일 검증 및 4자리 고유 userTag 자동 부여
     */
    @Transactional
    public SignupResponseDto signup(SignupRequestDto requestDto) {
        String email = requestDto.getEmail().trim().toLowerCase();
        String nickname = requestDto.getNickname().trim();

        // 1. 이메일 중복 확인
        if (userRepository.existsByEmail(email)) {
            log.warn("[AuthService] 이미 존재하는 이메일 가입 시도: {}", email);
            throw new CustomException(ErrorCode.AUTH_FIELD_DUPLICATE_EMAIL);
        }

        // 2. 4자리 난수 userTag 생성 (중복 충돌 시 재생성)
        String userTag = generateUserTag(nickname);

        // 3. 비밀번호 BCrypt 암호화 및 유저 엔티티 생성
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(requestDto.getPassword()))
                .nickname(nickname)
                .userTag(userTag)
                .provider("EMAIL")
                .quietTimeStart(LocalTime.of(21, 0, 0))
                .quietTimeEnd(LocalTime.of(8, 0, 0))
                .build();

        userRepository.save(user);
        log.info("[AuthService] 회원가입 완료 - UserID: {}, Nickname: {}#{}", user.getUserId(), nickname, userTag);

        return SignupResponseDto.builder()
                .userId(user.getUserId())
                .nickname(user.getNickname())
                .userTag(user.getUserTag())
                .build();
    }

    /**
     * 이메일 로그인 및 Access / Refresh 토큰 발급 (AUTH-01-2)
     */
    public TokenResponseDto login(LoginRequestDto requestDto) {
        String email = requestDto.getEmail().trim().toLowerCase();

        // 1. 유저 조회
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_WARN_INVALID_CREDENTIALS));

        // 2. 비밀번호 일치 여부 검증
        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
            log.warn("[AuthService] 로그인 비밀번호 불일치: {}", email);
            throw new CustomException(ErrorCode.AUTH_WARN_INVALID_CREDENTIALS);
        }

        // 3. JWT 토큰 발급
        String accessToken = jwtProvider.createAccessToken(user.getUserId(), user.getEmail());
        String refreshToken = jwtProvider.createRefreshToken(user.getUserId());

        log.info("[AuthService] 로그인 성공 - UserID: {}", user.getUserId());
        return TokenResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    /**
     * Refresh Token을 활용한 Access/Refresh Token 재발급
     */
    public TokenResponseDto refresh(RefreshTokenRequestDto requestDto) {
        String token = requestDto.getRefreshToken();

        // 1. Refresh Token 유효성 및 서명/만료 검증
        jwtProvider.parseAndValidate(token);

        // 2. 토큰 타입 검증 (반드시 REFRESH 타입이어야 함)
        if (!jwtProvider.isRefreshToken(token)) {
            log.warn("[AuthService] 잘못된 토큰 타입 재발급 시도");
            throw new CustomException(ErrorCode.AUTH_ALERT_INVALID_TOKEN);
        }

        // 3. 유저 존재 여부 확인
        Long userId = jwtProvider.getUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_WARN_USER_NOT_FOUND));

        // 4. 신규 토큰 세트 발급
        String newAccessToken = jwtProvider.createAccessToken(user.getUserId(), user.getEmail());
        String newRefreshToken = jwtProvider.createRefreshToken(user.getUserId());

        log.info("[AuthService] 토큰 재발급 성공 - UserID: {}", user.getUserId());
        return TokenResponseDto.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    /**
     * 본인 프로필 정보 조회 (/api/v1/auth/me)
     */
    public UserProfileResponseDto getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_WARN_USER_NOT_FOUND));

        return UserProfileResponseDto.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .userTag(user.getUserTag())
                .profileImage(user.getProfileImage())
                .quietTimeStart(user.getQuietTimeStart())
                .quietTimeEnd(user.getQuietTimeEnd())
                .build();
    }

    /**
     * 본인 프로필 정보 수정 (USER-01-3)
     */
    @Transactional
    public UpdateProfileResponseDto updateMyProfile(Long userId, UpdateProfileRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_WARN_USER_NOT_FOUND));

        // 1. 닉네임 변경 요청이 있는 경우
        if (requestDto.getNickname() != null && !requestDto.getNickname().isBlank()) {
            String newNickname = requestDto.getNickname().trim();
            if (!newNickname.equals(user.getNickname())) {
                // 기존 유저 태그 유지 하에 신규 닉네임과 태그 조합 중복 검사
                if (userRepository.existsByNicknameAndUserTag(newNickname, user.getUserTag())) {
                    log.warn("[AuthService] 닉네임+태그 조합 중복 발생: {}#{}", newNickname, user.getUserTag());
                    throw new CustomException(ErrorCode.AUTH_FIELD_DUPLICATE_NICKNAME);
                }
                user.setNickname(newNickname);
            }
        }

        // 2. 프로필 이미지 변경 요청이 있는 경우
        if (requestDto.getProfileImage() != null) {
            user.setProfileImage(requestDto.getProfileImage());
        }

        userRepository.updateProfile(user);
        log.info("[AuthService] 프로필 수정 완료 - UserID: {}, Nickname: {}", userId, user.getNickname());

        return UpdateProfileResponseDto.builder()
                .userId(user.getUserId())
                .nickname(user.getNickname())
                .profileImage(user.getProfileImage())
                .build();
    }

    /**
     * 야간 방해금지 시간 설정 (USER-PAGE-04)
     */
    @Transactional
    public QuietTimeResponseDto updateQuietTime(Long userId, QuietTimeRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_WARN_USER_NOT_FOUND));

        userRepository.updateQuietTime(
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
    public void withdraw(Long userId, WithdrawRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_WARN_USER_NOT_FOUND));

        // 1. 이메일 가입 회원의 경우 비밀번호 일치 확인
        if ("EMAIL".equalsIgnoreCase(user.getProvider())) {
            if (requestDto == null || requestDto.getPassword() == null ||
                    !passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
                log.warn("[AuthService] 회원 탈퇴 비밀번호 검증 실패 - UserID: {}", userId);
                throw new CustomException(ErrorCode.AUTH_CONFIRM_WITHDRAWAL_FAILED);
            }
        }

        // 2. 작성한 레시피의 user_id를 NULL로 익명 보존 처리 (USER-02-2)
        userRepository.anonymizeRecipesByUserId(userId);

        // 3. 회원 레코드 삭제 (user_ingredient, recipe_like, recipe_scrap, notification은 Cascade 삭제됨)
        userRepository.deleteById(userId);

        log.info("[AuthService] 회원 탈퇴 완료 및 레시피 익명화 처리 - UserID: {}", userId);
    }

    /**
     * 4자리 난수 userTag 생성 (0000 ~ 9999)
     */
    private String generateUserTag(String nickname) {
        for (int i = 0; i < 10; i++) {
            String tag = String.format("%04d", ThreadLocalRandom.current().nextInt(10000));
            if (!userRepository.existsByNicknameAndUserTag(nickname, tag)) {
                return tag;
            }
        }
        throw new CustomException(ErrorCode.AUTH_FIELD_DUPLICATE_NICKNAME, "태그 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
}
