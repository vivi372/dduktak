package com.dduktak.domain.notification.service;

import com.dduktak.domain.auth.entity.Profile;
import com.dduktak.domain.auth.repository.ProfileRepository;
import com.dduktak.domain.notification.dto.ExpiringIngredientTargetVo;
import com.dduktak.domain.notification.dto.NotificationDeleteAllResponseDto;
import com.dduktak.domain.notification.dto.NotificationItemDto;
import com.dduktak.domain.notification.dto.NotificationListResponseDto;
import com.dduktak.domain.notification.dto.NotificationReadAllResponseDto;
import com.dduktak.domain.notification.dto.NotificationReadResponseDto;
import com.dduktak.domain.notification.dto.NotificationSettingsRequestDto;
import com.dduktak.domain.notification.dto.NotificationSettingsResponseDto;
import com.dduktak.domain.notification.entity.Notification;
import com.dduktak.domain.notification.entity.NotificationType;
import com.dduktak.domain.notification.repository.NotificationRepository;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 알림 센터 및 배치 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ProfileRepository profileRepository;
    private final FcmService fcmService;

    /**
     * 알림 센터 목록 페이징 조회
     */
    @Transactional(readOnly = true)
    public NotificationListResponseDto getNotificationList(UUID userId, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = (size <= 0) ? 20 : size;
        int offset = safePage * safeSize;

        int unreadCount = notificationRepository.countUnreadByUserId(userId);
        boolean hasUnread = unreadCount > 0;

        List<Notification> notifications = notificationRepository.findNotificationsByUserId(userId, offset, safeSize);

        List<NotificationItemDto> itemDtos = notifications.stream()
                .map(n -> NotificationItemDto.builder()
                        .notificationId(n.getNotificationId())
                        .type(n.getType())
                        .title(n.getTitle())
                        .content(n.getContent())
                        .targetId(n.getTargetId())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return NotificationListResponseDto.builder()
                .unreadCount(unreadCount)
                .hasUnread(hasUnread)
                .notifications(itemDtos)
                .build();
    }

    /**
     * 단일 알림 읽음 처리
     */
    @Transactional
    public NotificationReadResponseDto markAsRead(UUID userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOTI_WARN_NOT_FOUND));

        // 타인의 알림 읽음 처리 방어
        if (!notification.getUserId().equals(userId)) {
            throw new CustomException(ErrorCode.AUTH_ALERT_ACCESS_DENIED);
        }

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notificationRepository.updateReadStatus(notificationId, true);
        }

        return NotificationReadResponseDto.builder()
                .notificationId(notificationId)
                .isRead(true)
                .build();
    }

    /**
     * 모든 알림 일괄 읽음 처리
     */
    @Transactional
    public NotificationReadAllResponseDto markAllAsRead(UUID userId) {
        int updatedCount = notificationRepository.markAllAsRead(userId);
        return NotificationReadAllResponseDto.builder()
                .updatedCount(updatedCount)
                .build();
    }

    /**
     * 단일 알림 수동 삭제
     */
    @Transactional
    public void deleteNotification(UUID userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOTI_WARN_NOT_FOUND));

        // 타인의 알림 삭제 방어
        if (!notification.getUserId().equals(userId)) {
            throw new CustomException(ErrorCode.AUTH_ALERT_ACCESS_DENIED);
        }

        notificationRepository.deleteById(notificationId);
    }

    /**
     * 모든 알림 일괄 삭제
     */
    @Transactional
    public NotificationDeleteAllResponseDto deleteAllNotifications(UUID userId) {
        int deletedCount = notificationRepository.deleteAllByUserId(userId);
        return NotificationDeleteAllResponseDto.builder()
                .deletedCount(deletedCount)
                .build();
    }

    /**
     * 알림 수신 및 야간 방해금지 시간 통합 설정 (USER-PAGE-04)
     */
    @Transactional
    public NotificationSettingsResponseDto updateSettings(UUID userId, NotificationSettingsRequestDto dto) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_ALERT_UNAUTHORIZED));

        Boolean isExpireWarnEnabled = dto.getIsExpireWarnEnabled() != null
                ? dto.getIsExpireWarnEnabled()
                : profile.getIsExpireWarnEnabled();
        Boolean isReactionNoticeEnabled = dto.getIsReactionNoticeEnabled() != null
                ? dto.getIsReactionNoticeEnabled()
                : profile.getIsReactionNoticeEnabled();
        LocalTime quietTimeStart = dto.getQuietTimeStart() != null
                ? dto.getQuietTimeStart()
                : profile.getQuietTimeStart();
        LocalTime quietTimeEnd = dto.getQuietTimeEnd() != null
                ? dto.getQuietTimeEnd()
                : profile.getQuietTimeEnd();

        profileRepository.updateNotificationSettings(
                userId, isExpireWarnEnabled, isReactionNoticeEnabled, quietTimeStart, quietTimeEnd);

        return NotificationSettingsResponseDto.builder()
                .isExpireWarnEnabled(isExpireWarnEnabled)
                .isReactionNoticeEnabled(isReactionNoticeEnabled)
                .quietTimeStart(quietTimeStart)
                .quietTimeEnd(quietTimeEnd)
                .build();
    }

    /**
     * 커뮤니티 소셜 알림 연동 및 발송 (자추 스킵, DB 우선 저장 & 비동기 FCM)
     */
    @Transactional
    public void sendSocialNotification(UUID recipientId, UUID actorId, NotificationType type,
            Long targetId, String recipeTitle, String actorNickname) {
        // 1. 자추(Self-action) 방어: 본인의 행위는 알림 생성 원천 제외 (REC-01-5)
        if (recipientId == null || recipientId.equals(actorId)) {
            log.debug("[Social Notification Skip] 자추(본인 액션)이므로 알림을 생성하지 않습니다: recipient={}, actor={}",
                    recipientId, actorId);
            return;
        }

        // 2. 메시지 타이틀 및 본문 빌드
        String title;
        String content;
        String cleanNickname = (actorNickname != null && !actorNickname.trim().isEmpty()) ? actorNickname : "어떤 요리사";
        String cleanTitle = (recipeTitle != null && !recipeTitle.trim().isEmpty()) ? recipeTitle : "레시피";

        if (type == NotificationType.LIKE_NOTICE) {
            title = "새로운 좋아요!";
            content = String.format("❤️ %s님이 회원님의 '%s' 레시피를 좋아합니다.", cleanNickname, cleanTitle);
        } else if (type == NotificationType.COOKED_NOTICE) {
            title = "요리 완성 소식!";
            content = String.format("🍳 %s님이 회원님의 '%s' 레시피로 요리를 완성했어요!", cleanNickname, cleanTitle);
        } else {
            title = "새로운 소식";
            content = String.format("%s님이 회원님의 '%s' 콘텐츠와 상호작용했습니다.", cleanNickname, cleanTitle);
        }

        // 3. 인앱 알림 DB 우선 저장 (기획 원칙: 앱 내 알림 센터와 모바일 푸시 팝업의 역할 분리)
        Notification notification = Notification.builder()
                .userId(recipientId)
                .type(type)
                .title(title)
                .content(content)
                .targetId(targetId)
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        // 4. 외부 모바일 푸시(FCM) 검증 (소셜 반응 알림 푸시 토글 OFF 또는 야간 방해금지 시간대에는 외부 푸시 팝업만 차단)
        Profile recipient = profileRepository.findById(recipientId).orElse(null);
        if (recipient == null || !Boolean.TRUE.equals(recipient.getIsReactionNoticeEnabled())) {
            log.info("[FCM Push Blocked] 수신자가 소셜 알림 푸시를 비활성화했습니다 (인앱 알림만 유지): recipient={}", recipientId);
            return;
        }

        boolean isQuiet = isQuietTime(LocalTime.now(), recipient.getQuietTimeStart(), recipient.getQuietTimeEnd());
        if (isQuiet) {
            log.info("[FCM Push Blocked] 야간 방해금지 시간대로 인해 푸시 발송이 차단되었습니다 (인앱 알림만 유지): recipient={}", recipientId);
            return;
        }

        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", type.name());
        data.put("targetId", targetId != null ? String.valueOf(targetId) : "");
        if (targetId != null && (type == NotificationType.LIKE_NOTICE || type == NotificationType.COOKED_NOTICE)) {
            data.put("route", "/recipes/" + targetId);
        } else {
            data.put("route", "/notifications");
        }
        fcmService.sendPushAsync(recipientId, title, content, data);
    }

    /**
     * 매일 09시 소비기한 임박 묶음 알림 일괄 생성 배치 실행
     */
    @Transactional
    public int processDailyExpiringAlerts() {
        log.info("[Batch Start] 매일 09시 소비기한 임박 묶음 알림 배치 작업을 시작합니다.");

        List<ExpiringIngredientTargetVo> targets = notificationRepository.findExpiringIngredientsForAlert();
        if (targets.isEmpty()) {
            log.info("[Batch End] 소비기한 임박 식재료를 보유한 알림 수신 대상 유저가 없습니다.");
            return 0;
        }

        // 유저별 식재료 그룹화
        Map<UUID, List<ExpiringIngredientTargetVo>> userGroupMap = targets.stream()
                .collect(Collectors.groupingBy(ExpiringIngredientTargetVo::getUserId));

        int createdCount = 0;

        for (Map.Entry<UUID, List<ExpiringIngredientTargetVo>> entry : userGroupMap.entrySet()) {
            UUID userId = entry.getKey();
            List<ExpiringIngredientTargetVo> userIngredients = entry.getValue();

            // 당일 멱등성(Idempotency) 검증: 오늘 이미 발송된 경우 중복 생성 방어
            if (notificationRepository.existsExpireWarnToday(userId)) {
                log.info("[Batch Idempotency Skip] 당일 이미 소비기한 알림이 발송된 유저입니다: userId={}", userId);
                continue;
            }

            if (userIngredients.isEmpty()) {
                continue;
            }

            // 대표 재료 (dDay가 가장 작은 재료)
            ExpiringIngredientTargetVo topIngredient = userIngredients.get(0);
            int count = userIngredients.size();
            String title = "소비기한 임박 안내";
            String content;
            Long targetId = topIngredient.getIngredientId();

            if (count == 1) {
                // 단일 재료 메시지 예: 🥛 [우유]의 소비기한이 3일 남았어요!
                int dDay = (topIngredient.getDDay() != null) ? topIngredient.getDDay() : 0;
                content = String.format("🥛 [%s]의 소비기한이 %d일 남았어요!", topIngredient.getIngredientName(), dDay);
            } else {
                // 다중 재료 묶음 메시지 예: 🥛 [우유] 외 3개 재료의 소비기한이 임박했어요!
                content = String.format("🥛 [%s] 외 %d개 재료의 소비기한이 임박했어요!",
                        topIngredient.getIngredientName(), count - 1);
            }

            // DB 우선 저장
            Notification notification = Notification.builder()
                    .userId(userId)
                    .type(NotificationType.EXPIRE_WARN)
                    .title(title)
                    .content(content)
                    .targetId(targetId)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
            createdCount++;

            // 푸시 발송 (09:00 배치는 기본 방해금지 시간(21:00~08:00) 밖, 소비기한 임박 푸시가 활성화된 경우에만 FCM 발송)
            if (Boolean.TRUE.equals(topIngredient.getIsExpireWarnEnabled())) {
                Map<String, String> data = new LinkedHashMap<>();
                data.put("type", NotificationType.EXPIRE_WARN.name());
                data.put("targetId", String.valueOf(targetId));
                data.put("route", "/notifications");
                fcmService.sendPushAsync(userId, title, content, data);
            } else {
                log.info("[FCM Push Blocked] 소비기한 임박 푸시 알림 비활성화 유저이므로 푸시 발송을 건너뜁니다 (인앱 알림만 유지): userId={}", userId);
            }
        }

        log.info("[Batch Completed] 소비기한 임박 알림 일괄 생성 완료: 총 {}명의 유저에게 알림 생성", createdCount);
        return createdCount;
    }

    /**
     * 읽은 알림 N일 경과 자동 Cleanup
     */
    @Transactional
    public int cleanupOldReadNotifications(int days) {
        log.info("[Batch Cleanup] 읽은 알림 중 {}일 경과 레코드 자동 정리를 시작합니다.", days);
        int deletedCount = notificationRepository.deleteReadNotificationsOlderThan(days);
        log.info("[Batch Cleanup Completed] 읽은 알림 정리 완료: 총 {}건 삭제", deletedCount);
        return deletedCount;
    }

    /**
     * 유저의 FCM 디바이스 토큰 등록 (DB 영속화 및 FCM 서비스 캐싱)
     */
    @Transactional
    public void registerFcmToken(UUID userId, String token) {
        if (userId != null && token != null && !token.trim().isEmpty()) {
            profileRepository.updateFcmToken(userId, token.trim());
            fcmService.registerUserToken(userId, token.trim());
            log.info("[FCM Token Saved] 유저 디바이스 토큰 DB 및 캐시 저장 완료: userId={}", userId);
        }
    }

    /**
     * 야간 방해금지 시간대 여부 판정 유틸
     */
    public boolean isQuietTime(LocalTime now, LocalTime start, LocalTime end) {
        if (start == null || end == null) {
            return false;
        }
        if (start.isAfter(end)) {
            // 자정을 걸치는 시간대 (예: 21:00 ~ 08:00)
            return !now.isBefore(start) || now.isBefore(end);
        } else if (start.isBefore(end)) {
            // 자정을 넘지 않는 시간대 (예: 01:00 ~ 06:00)
            return !now.isBefore(start) && now.isBefore(end);
        } else {
            return false;
        }
    }
}
