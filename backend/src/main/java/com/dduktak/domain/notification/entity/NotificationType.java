package com.dduktak.domain.notification.entity;

/**
 * 알림 유형(Type) 열거형
 */
public enum NotificationType {
    EXPIRE_WARN,     // 소비기한 임박 알림 (D-3 ~ D-0)
    EXPIRE_D_DAY,    // 소비기한 당일 알림
    LIKE_NOTICE,     // 레시피 좋아요 소셜 알림
    COOKED_NOTICE,   // 레시피 요리완료 소셜 알림
    SYSTEM           // 시스템 공지 및 기타 알림
}
