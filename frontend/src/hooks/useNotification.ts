/**
 * 알림 센터 및 환경설정 도메인 React Query 커스텀 훅 (02_ARCHITECTURE_AND_CONVENTIONS.md 3.3절)
 *
 * 알림 목록 조회(미읽음 뱃지 동기화), 단일/전체 읽음, 단일/전체 삭제, 알림 통합 환경설정 뮤테이션을 제공합니다.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  updateNotificationSettings,
} from '@/services/notificationApi';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  NotificationListResponseDto,
  NotificationReadResponseDto,
  NotificationReadAllResponseDto,
  NotificationDeleteAllResponseDto,
  NotificationSettingsRequestDto,
  NotificationSettingsResponseDto,
} from '@/types/notification';

/** 알림 쿼리 키 상수 */
export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: (page: number = 0, size: number = 20) => ['notifications', 'list', { page, size }] as const,
};

/** 비로그인 또는 기본 상태 안전 폴백 객체 */
const EMPTY_NOTIFICATION_LIST: NotificationListResponseDto = {
  unreadCount: 0,
  hasUnread: false,
  notifications: [],
};

/**
 * 1. 알림 센터 목록 및 헤더 Red Dot 뱃지 동기화 훅 (GET /api/v1/notifications)
 *
 * @param page 페이지 번호 (기본값: 0)
 * @param size 페이지 크기 (기본값: 20)
 * @returns 알림 목록 쿼리 결과 (unreadCount, hasUnread, notifications)
 */
export function useNotifications(page: number = 0, size: number = 20) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<NotificationListResponseDto>({
    queryKey: NOTIFICATION_QUERY_KEYS.list(page, size),
    queryFn: async () => {
      try {
        return await getNotifications(page, size);
      } catch (error) {
        // 네트워크 장애 시 안전한 기본값 반환
        return EMPTY_NOTIFICATION_LIST;
      }
    },
    enabled: isAuthenticated,
    placeholderData: (previousData) => {
      if (previousData) return previousData;
      if (!isAuthenticated) return EMPTY_NOTIFICATION_LIST;
      return undefined;
    },
    staleTime: 1000 * 60 * 3, // 3분 캐싱 (화면 전환 시 플리커 방지)
  });
}


/**
 * 2. 단일 알림 읽음 처리 뮤테이션 훅 (PATCH /api/v1/notifications/{id}/read)
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<NotificationReadResponseDto, Error, number>({
    mutationFn: (notificationId: number) => markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

/**
 * 3. 모든 알림 일괄 읽음 처리 뮤테이션 훅 (PATCH /api/v1/notifications/read-all)
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<NotificationReadAllResponseDto, Error, void>({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

/**
 * 4. 단일 알림 수동 삭제 뮤테이션 훅 (DELETE /api/v1/notifications/{id})
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (notificationId: number) => deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

/**
 * 5. 모든 알림 일괄 삭제 뮤테이션 훅 (DELETE /api/v1/notifications/all)
 */
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation<NotificationDeleteAllResponseDto, Error, void>({
    mutationFn: () => deleteAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

/**
 * 6. 알림 통합 환경설정 변경 뮤테이션 훅 (PATCH /api/v1/notifications/settings)
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation<NotificationSettingsResponseDto, Error, NotificationSettingsRequestDto>({
    mutationFn: (dto: NotificationSettingsRequestDto) => updateNotificationSettings(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}
