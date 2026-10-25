/**
 * 알림 센터 및 환경설정 도메인 API 클라이언트 (05_API_SPECIFICATION.md 3.5절)
 *
 * 알림 목록 조회, 단일/전체 읽음, 단일/전체 삭제, 알림 통합 환경설정 조작을 담당합니다.
 */

import { apiClient } from '@/services/apiClient';
import type { ApiResponseDto } from '@/types/auth';
import type {
  NotificationListResponseDto,
  NotificationReadResponseDto,
  NotificationReadAllResponseDto,
  NotificationDeleteAllResponseDto,
  NotificationSettingsRequestDto,
  NotificationSettingsResponseDto,
} from '@/types/notification';

/**
 * 1. 알림 센터 목록 및 미읽음 뱃지 조회 (GET /api/v1/notifications)
 *
 * @param page 페이지 번호 (기본값: 0)
 * @param size 페이지 크기 (기본값: 20)
 * @returns 미읽음 개수, 미읽음 여부, 알림 목록 DTO
 */
export async function getNotifications(
  page: number = 0,
  size: number = 20,
): Promise<NotificationListResponseDto> {
  const response = await apiClient.get<ApiResponseDto<NotificationListResponseDto>>(
    '/api/v1/notifications',
    {
      params: { page, size },
    },
  );
  return response.data.data;
}

/**
 * 2. 단일 알림 읽음 처리 (PATCH /api/v1/notifications/{notificationId}/read)
 *
 * @param notificationId 대상 알림 ID
 * @returns 읽음 처리 완료 응답 DTO
 */
export async function markAsRead(
  notificationId: number,
): Promise<NotificationReadResponseDto> {
  const response = await apiClient.patch<ApiResponseDto<NotificationReadResponseDto>>(
    `/api/v1/notifications/${notificationId}/read`,
  );
  return response.data.data;
}

/**
 * 3. 모든 알림 일괄 읽음 처리 (PATCH /api/v1/notifications/read-all)
 *
 * @returns 일괄 읽음 처리된 개수 DTO
 */
export async function markAllAsRead(): Promise<NotificationReadAllResponseDto> {
  const response = await apiClient.patch<ApiResponseDto<NotificationReadAllResponseDto>>(
    '/api/v1/notifications/read-all',
  );
  return response.data.data;
}

/**
 * 4. 단일 알림 수동 삭제 (DELETE /api/v1/notifications/{notificationId})
 *
 * @param notificationId 대상 알림 ID
 */
export async function deleteNotification(
  notificationId: number,
): Promise<void> {
  await apiClient.delete<ApiResponseDto<null>>(
    `/api/v1/notifications/${notificationId}`,
  );
}

/**
 * 5. 모든 알림 일괄 삭제 (DELETE /api/v1/notifications/all)
 *
 * @returns 일괄 삭제된 알림 개수 DTO
 */
export async function deleteAllNotifications(): Promise<NotificationDeleteAllResponseDto> {
  const response = await apiClient.delete<ApiResponseDto<NotificationDeleteAllResponseDto>>(
    '/api/v1/notifications/all',
  );
  return response.data.data;
}

/**
 * 6. 알림 통합 환경설정 변경 (PATCH /api/v1/notifications/settings)
 *
 * @param dto 소비기한 알림, 소셜 알림, 야간 방해금지 시간 설정 DTO
 * @returns 변경 완료된 알림 설정 DTO
 */
export async function updateNotificationSettings(
  dto: NotificationSettingsRequestDto,
): Promise<NotificationSettingsResponseDto> {
  const response = await apiClient.patch<ApiResponseDto<NotificationSettingsResponseDto>>(
    '/api/v1/notifications/settings',
    dto,
  );
  return response.data.data;
}

/**
 * notificationApi 네임스페이스 객체 export
 */
export const notificationApi = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  updateNotificationSettings,
};
