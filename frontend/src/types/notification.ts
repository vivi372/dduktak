/** 알림 유형 */
export type NotificationType = 'EXPIRE_WARN' | 'RECIPE_LIKED' | 'RECIPE_COOKED';

/** 알림 항목 (GET /api/v1/notifications) */
export interface NotificationItem {
  notificationId: number;
  type: NotificationType;
  title: string;
  content: string;
  targetId: number; // 딥링크 이동 대상 (재료 ID 또는 레시피 ID)
  isRead: boolean;
  createdAt: string; // ISO 8601
}

export interface NotificationList {
  unreadCount: number;
  hasUnread: boolean;
  notifications: NotificationItem[];
}

/** 알림 환경설정 (PATCH /api/v1/notifications/settings) */
export interface NotificationSettings {
  isExpireWarnEnabled: boolean;
  isReactionNoticeEnabled: boolean;
  quietTimeStart: string; // HH:mm:ss (예: "21:00:00")
  quietTimeEnd: string; // HH:mm:ss (예: "08:00:00")
}
