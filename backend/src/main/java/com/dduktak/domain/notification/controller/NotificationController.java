package com.dduktak.domain.notification.controller;

import com.dduktak.domain.notification.dto.NotificationDeleteAllResponseDto;
import com.dduktak.domain.notification.dto.NotificationListResponseDto;
import com.dduktak.domain.notification.dto.NotificationReadAllResponseDto;
import com.dduktak.domain.notification.dto.NotificationReadResponseDto;
import com.dduktak.domain.notification.dto.NotificationSettingsRequestDto;
import com.dduktak.domain.notification.dto.NotificationSettingsResponseDto;
import com.dduktak.domain.notification.service.NotificationService;
import com.dduktak.global.error.ApiResponseDto;
import com.dduktak.global.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * 알림 센터 및 알림 설정 REST 컨트롤러 (/api/v1/notifications)
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 알림 센터 목록 및 미읽음 뱃지 조회 (GET /api/v1/notifications)
     */
    @GetMapping
    public ResponseEntity<ApiResponseDto<NotificationListResponseDto>> getNotifications(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        NotificationListResponseDto response = notificationService.getNotificationList(userId, page, size);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    /**
     * 단일 알림 읽음 처리 (PATCH /api/v1/notifications/{notificationId}/read)
     */
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponseDto<NotificationReadResponseDto>> markAsRead(
            @PathVariable("notificationId") Long notificationId
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        NotificationReadResponseDto response = notificationService.markAsRead(userId, notificationId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    /**
     * 모든 알림 일괄 읽음 처리 (PATCH /api/v1/notifications/read-all)
     */
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponseDto<NotificationReadAllResponseDto>> markAllAsRead() {
        UUID userId = SecurityUtil.getCurrentUserId();
        NotificationReadAllResponseDto response = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    /**
     * 단일 알림 수동 삭제 (DELETE /api/v1/notifications/{notificationId})
     */
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<ApiResponseDto<Void>> deleteNotification(
            @PathVariable("notificationId") Long notificationId
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        notificationService.deleteNotification(userId, notificationId);
        return ResponseEntity.ok(ApiResponseDto.success(null));
    }

    /**
     * 모든 알림 일괄 삭제 (DELETE /api/v1/notifications/all)
     */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponseDto<NotificationDeleteAllResponseDto>> deleteAllNotifications() {
        UUID userId = SecurityUtil.getCurrentUserId();
        NotificationDeleteAllResponseDto response = notificationService.deleteAllNotifications(userId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    /**
     * 알림 수신 토글 및 방해금지 시간 통합 설정 (PATCH /api/v1/notifications/settings)
     */
    @PatchMapping("/settings")
    public ResponseEntity<ApiResponseDto<NotificationSettingsResponseDto>> updateSettings(
            @RequestBody NotificationSettingsRequestDto dto
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        NotificationSettingsResponseDto response = notificationService.updateSettings(userId, dto);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }
}
