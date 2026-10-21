package com.dduktak.domain.notification.repository;

import com.dduktak.domain.notification.dto.ExpiringIngredientTargetVo;
import com.dduktak.domain.notification.entity.Notification;
import com.dduktak.domain.notification.mapper.NotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 알림 센터 도메인 Repository
 * Service와 MyBatis Mapper 사이 계층으로서 안전한 영속성 데이터 접근을 제공합니다.
 */
@Repository
@RequiredArgsConstructor
public class NotificationRepository {

    private final NotificationMapper notificationMapper;

    /**
     * 유저별 알림 목록 최신순 페이징 조회
     */
    public List<Notification> findNotificationsByUserId(UUID userId, int offset, int limit) {
        return notificationMapper.selectNotificationsByUserId(userId, offset, limit);
    }

    /**
     * 유저의 읽지 않은 알림 개수 조회
     */
    public int countUnreadByUserId(UUID userId) {
        return notificationMapper.countUnreadByUserId(userId);
    }

    /**
     * 알림 단건 조회
     */
    public Optional<Notification> findById(Long notificationId) {
        return notificationMapper.findById(notificationId);
    }

    /**
     * 신규 알림 저장
     */
    public Notification save(Notification notification) {
        notificationMapper.insert(notification);
        return notification;
    }

    /**
     * 단일 알림 읽음 상태 갱신
     */
    public void updateReadStatus(Long notificationId, boolean isRead) {
        notificationMapper.updateReadStatus(notificationId, isRead);
    }

    /**
     * 특정 유저의 모든 알림 읽음 처리
     */
    public int markAllAsRead(UUID userId) {
        return notificationMapper.updateReadAllByUserId(userId);
    }

    /**
     * 단일 알림 삭제
     */
    public void deleteById(Long notificationId) {
        notificationMapper.deleteById(notificationId);
    }

    /**
     * 특정 유저의 모든 알림 삭제
     */
    public int deleteAllByUserId(UUID userId) {
        return notificationMapper.deleteAllByUserId(userId);
    }

    /**
     * 읽은 알림 중 N일 경과 레코드 일괄 정리(Cleanup)
     */
    public int deleteReadNotificationsOlderThan(int days) {
        return notificationMapper.deleteReadNotificationsOlderThan(days);
    }

    /**
     * 당일(KST) 특정 유저에게 이미 발송된 소비기한 임박 알림 존재 여부 확인 (멱등성)
     */
    public boolean existsExpireWarnToday(UUID userId) {
        return notificationMapper.existsExpireWarnToday(userId);
    }

    /**
     * 소비기한 임박(0 <= D-Day <= 3) 식재료 및 수신 대상 유저 목록 조회
     */
    public List<ExpiringIngredientTargetVo> findExpiringIngredientsForAlert() {
        return notificationMapper.selectExpiringIngredientsForAlert();
    }
}
