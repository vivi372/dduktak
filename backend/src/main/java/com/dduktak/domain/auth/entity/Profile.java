package com.dduktak.domain.auth.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * 회원 프로필(profiles) 엔티티
 * DB public.profiles 테이블과 1:1 매핑되며, auth.users(id)를 UUID PK로 참조합니다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Profile {

    /**
     * 회원 고유 식별자 (auth.users.id UUID)
     */
    private UUID id;

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
     * 소비기한 임박 알림 활성화 여부
     */
    @Builder.Default
    private Boolean isExpireWarnEnabled = true;

    /**
     * 소셜 반응(좋아요 등) 알림 활성화 여부
     */
    @Builder.Default
    private Boolean isReactionNoticeEnabled = true;

    /**
     * 모바일 디바이스 FCM 푸시 토큰
     */
    private String fcmToken;

    /**
     * 프로필 생성 일시
     */
    private OffsetDateTime createdAt;

    /**
     * 프로필 수정 일시
     */
    private OffsetDateTime updatedAt;
}
