package com.dduktak.domain.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 단일 알림 읽음 처리 완료 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationReadResponseDto {

    private Long notificationId;
    private Boolean isRead;
}
