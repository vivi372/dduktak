package com.dduktak.domain.notification.scheduler;

import com.dduktak.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 알림 시스템 정기 배치 스케줄러
 * 1. 매일 09:00 KST 소비기한 임박(D-0 ~ D-3) 묶음 알림 생성
 * 2. 매일 03:00 KST 읽은 알림 중 30일 경과 레코드 자동 Cleanup
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private final NotificationService notificationService;

    /**
     * 매일 오전 09:00 소비기한 임박 묶음 알림 일괄 생성 및 푸시 발송
     * Cron: 초 분 시 일 월 요일 (Asia/Seoul)
     */
    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
    public void runDailyExpiringAlertsBatch() {
        log.info("[Scheduler Trigger] 매일 09:00 소비기한 임박 알림 배치 스케줄러 트리거");
        try {
            int count = notificationService.processDailyExpiringAlerts();
            log.info("[Scheduler Finished] 소비기한 임박 알림 배치 정상 종료: {}건 생성", count);
        } catch (Exception e) {
            log.error("[Scheduler Error] 소비기한 임박 알림 배치 수행 중 예외 발생", e);
        }
    }

    /**
     * 매일 새벽 03:00 읽은 알림(is_read = true) 중 30일 경과 레코드 자동 Cleanup
     */
    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Seoul")
    public void runCleanupOldNotificationsBatch() {
        log.info("[Scheduler Trigger] 매일 03:00 읽은 알림 30일 자동 Cleanup 스케줄러 트리거");
        try {
            int count = notificationService.cleanupOldReadNotifications(30);
            log.info("[Scheduler Finished] 30일 경과 알림 Cleanup 정상 종료: {}건 정리", count);
        } catch (Exception e) {
            log.error("[Scheduler Error] 알림 Cleanup 스케줄러 수행 중 예외 발생", e);
        }
    }
}
