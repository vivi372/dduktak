package com.dduktak.domain.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 알림 센터 목록 조회 응답 DTO
 * 상단 뱃지 렌더링용 미읽음 수치와 최신 알림 목록을 포함합니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationListResponseDto {

    /**
     * 읽지 않은 알림 총 개수
     */
    private int unreadCount;

    /**
     * 읽지 않은 알림 존재 여부 (Red Dot 뱃지 표시용)
     */
    private boolean hasUnread;

    /**
     * 알림 목록
     */
    private List<NotificationItemDto> notifications;
}
