package com.dduktak.domain.notification.dto;

import com.dduktak.domain.notification.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * 알림 목록 개별 항목 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationItemDto {

    private Long notificationId;
    private NotificationType type;
    private String title;
    private String content;
    private Long targetId;
    private Boolean isRead;
    private OffsetDateTime createdAt;
}
