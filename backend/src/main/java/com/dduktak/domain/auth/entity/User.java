package com.dduktak.domain.auth.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;
import java.time.OffsetDateTime;

/**
 * 회원(users) 엔티티
 * DB public.users 테이블과 1:1 매핑됩니다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    /**
     * 회원 식별 고유 PK (BIGSERIAL)
     */
    private Long userId;

    /**
     * 회원 이메일 (로그인 ID)
     */
    private String email;

    /**
     * BCrypt 해싱된 비밀번호
     */
    private String password;

    /**
     * 회원 닉네임 (중복 가능)
     */
    private String nickname;

    /**
     * 4자리 난수 유저 식별 태그 (예: '1024')
     */
    private String userTag;

    /**
     * 프로필 이미지 URL (Supabase Storage 퍼블릭 URL)
     */
    private String profileImage;

    /**
     * 가입 방식 ('EMAIL', 'KAKAO', 'GOOGLE')
     */
    @Builder.Default
    private String provider = "EMAIL";

    /**
     * OAuth2 소셜 공급자 고유 식별자 (선택)
     */
    private String providerId;

    /**
     * 야간 방해금지 시작 시각 (기본 21:00:00)
     */
    @Builder.Default
    private LocalTime quietTimeStart = LocalTime.of(21, 0, 0);

    /**
     * 야간 방해금지 종료 시각 (기본 08:00:00)
     */
    @Builder.Default
    private LocalTime quietTimeEnd = LocalTime.of(8, 0, 0);

    /**
     * 계정 생성 일시
     */
    private OffsetDateTime createdAt;

    /**
     * 계정 수정 일시
     */
    private OffsetDateTime updatedAt;
}
