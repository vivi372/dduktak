package com.dduktak.domain.notification.mapper;

import com.dduktak.domain.notification.dto.ExpiringIngredientTargetVo;
import com.dduktak.domain.notification.entity.Notification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 알림 센터 MyBatis Mapper 인터페이스
 */
@Mapper
public interface NotificationMapper {

    /**
     * 유저별 알림 목록 최신순 페이징 조회
     */
    List<Notification> selectNotificationsByUserId(
            @Param("userId") UUID userId,
            @Param("offset") int offset,
            @Param("limit") int limit
    );

    /**
     * 유저의 읽지 않은 알림 개수 조회
     */
    int countUnreadByUserId(@Param("userId") UUID userId);

    /**
     * 알림 단건 조회
     */
    Optional<Notification> findById(@Param("notificationId") Long notificationId);

    /**
     * 신규 알림 레코드 삽입
     */
    int insert(Notification notification);

    /**
     * 단일 알림 읽음 상태 갱신
     */
    int updateReadStatus(@Param("notificationId") Long notificationId, @Param("isRead") boolean isRead);

    /**
     * 특정 유저의 모든 알림 읽음 처리
     */
    int updateReadAllByUserId(@Param("userId") UUID userId);

    /**
     * 단일 알림 삭제
     */
    int deleteById(@Param("notificationId") Long notificationId);

    /**
     * 특정 유저의 모든 알림 삭제
     */
    int deleteAllByUserId(@Param("userId") UUID userId);

    /**
     * 읽은 알림 중 N일 경과 레코드 일괄 정리(Cleanup)
     */
    int deleteReadNotificationsOlderThan(@Param("days") int days);

    /**
     * 당일(KST 기준) 특정 유저에게 이미 발송된 소비기한 임박 알림 존재 여부 확인 (멱등성)
     */
    boolean existsExpireWarnToday(@Param("userId") UUID userId);

    /**
     * 소비기한 임박(0 <= D-Day <= 3) 식재료 및 수신 대상 유저 목록 조회
     */
    List<ExpiringIngredientTargetVo> selectExpiringIngredientsForAlert();
}
