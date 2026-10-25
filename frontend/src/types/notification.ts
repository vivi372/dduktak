/**
 * 알림 유형 (백엔드 NotificationType enum 및 이전 호환 키 지원)
 */
export type NotificationType =
  | 'EXPIRE_WARN' // 소비기한 임박 알림 (D-3 ~ D-1)
  | 'EXPIRE_D_DAY' // 소비기한 당일 알림 (D-0)
  | 'LIKE_NOTICE' // 레시피 좋아요 소셜 알림
  | 'COOKED_NOTICE' // 레시피 요리완료 소셜 알림
  | 'SYSTEM' // 시스템 공지
  | 'RECIPE_LIKED' // 이전 호환
  | 'RECIPE_COOKED'; // 이전 호환

/**
 * 알림 목록 개별 항목 DTO (NotificationItemDto)
 */
export interface NotificationItemDto {
  notificationId: number;
  type: NotificationType;
  title: string;
  content: string;
  targetId?: number | null; // 딥링크 이동 대상 (재료 ID 또는 레시피 ID)
  isRead: boolean;
  createdAt: string; // ISO 8601 문자열
}

/**
 * 기존 UI 호환을 위한 Alias
 */
export type NotificationItem = NotificationItemDto;

/**
 * 알림 센터 목록 조회 응답 DTO (NotificationListResponseDto)
 */
export interface NotificationListResponseDto {
  unreadCount: number;
  hasUnread: boolean;
  notifications: NotificationItemDto[];
}

/**
 * 기존 UI 호환을 위한 Alias
 */
export type NotificationList = NotificationListResponseDto;

/**
 * 단일 알림 읽음 처리 응답 DTO (NotificationReadResponseDto)
 */
export interface NotificationReadResponseDto {
  notificationId: number;
  isRead: boolean;
}

/**
 * 모든 알림 일괄 읽음 처리 응답 DTO (NotificationReadAllResponseDto)
 */
export interface NotificationReadAllResponseDto {
  updatedCount: number;
}

/**
 * 모든 알림 일괄 삭제 응답 DTO (NotificationDeleteAllResponseDto)
 */
export interface NotificationDeleteAllResponseDto {
  deletedCount: number;
}

/**
 * 알림 통합 환경설정 변경 요청 DTO (NotificationSettingsRequestDto)
 */
export interface NotificationSettingsRequestDto {
  isExpireWarnEnabled?: boolean;
  isReactionNoticeEnabled?: boolean;
  quietTimeStart?: string; // HH:mm:ss (예: "21:00:00")
  quietTimeEnd?: string; // HH:mm:ss (예: "08:00:00")
}

/**
 * 알림 통합 환경설정 완료 응답 DTO (NotificationSettingsResponseDto)
 */
export interface NotificationSettingsResponseDto {
  isExpireWarnEnabled: boolean;
  isReactionNoticeEnabled: boolean;
  quietTimeStart: string; // HH:mm:ss
  quietTimeEnd: string; // HH:mm:ss
}

/**
 * 기존 UI 호환을 위한 Alias
 */
export type NotificationSettings = NotificationSettingsResponseDto;

