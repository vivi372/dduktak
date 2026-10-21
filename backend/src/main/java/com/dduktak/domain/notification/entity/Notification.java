package com.dduktak.domain.notification.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * 알림 센터(notification) 엔티티
 * DB public.notification 테이블과 매핑됩니다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    /**
     * 알림 고유 ID (PK, BIGSERIAL)
     */
    private Long notificationId;

    /**
     * 수신 회원 식별자 (FK -> public.profiles.id)
     */
    private UUID userId;

    /**
     * 알림 유형 (EXPIRE_WARN, LIKE_NOTICE, COOKED_NOTICE 등)
     */
    private NotificationType type;

    /**
     * 알림 제목
     */
    private String title;

    /**
     * 알림 본문 메시지
     */
    private String content;

    /**
     * 딥링크 이동용 타겟 리소스 식별자 (식재료 ID 또는 레시피 ID)
     */
    private Long targetId;

    /**
     * 읽음 여부 (기본값 FALSE)
     */
    @Builder.Default
    private Boolean isRead = false;

    /**
     * 알림 생성 일시 (TIMESTAMPTZ)
     */
    private OffsetDateTime createdAt;
}
