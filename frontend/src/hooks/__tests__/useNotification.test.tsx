import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
  useUpdateNotificationSettings,
} from '@/hooks/useNotification';
import * as notificationApi from '@/services/notificationApi';
import { useAuthStore } from '@/store/useAuthStore';

vi.mock('@/services/notificationApi', () => ({
  getNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  deleteAllNotifications: vi.fn(),
  updateNotificationSettings: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useNotification React Query 훅 단위 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ isAuthenticated: true });
  });

  it('useNotifications는 로그인 상태일 때 알림 목록을 성공적으로 조회해야 한다', async () => {
    const mockList = {
      unreadCount: 3,
      hasUnread: true,
      notifications: [
        {
          notificationId: 101,
          type: 'EXPIRE_WARN' as const,
          title: '소비기한 임박',
          content: '우유의 소비기한이 3일 남았어요!',
          targetId: 5,
          isRead: false,
          createdAt: '2026-10-25T10:00:00Z',
        },
      ],
    };

    vi.mocked(notificationApi.getNotifications).mockResolvedValueOnce(mockList);

    const { result } = renderHook(() => useNotifications(0, 20), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.unreadCount).toBe(3);
      expect(result.current.data?.hasUnread).toBe(true);
      expect(result.current.data?.notifications).toHaveLength(1);
    });
  });

  it('useNotifications는 비로그인 상태일 때 API를 호출하지 않고 기본값을 유지해야 한다', async () => {
    useAuthStore.setState({ isAuthenticated: false });

    const { result } = renderHook(() => useNotifications(0, 20), {
      wrapper: createWrapper(),
    });

    expect(notificationApi.getNotifications).not.toHaveBeenCalled();
    expect(result.current.data?.unreadCount).toBe(0);
    expect(result.current.data?.hasUnread).toBe(false);
  });


  it('useMarkNotificationRead는 단일 알림을 읽음 처리하고 성공해야 한다', async () => {
    vi.mocked(notificationApi.markAsRead).mockResolvedValueOnce({
      notificationId: 101,
      isRead: true,
    });

    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(101);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(notificationApi.markAsRead).toHaveBeenCalledWith(101);
  });

  it('useMarkAllNotificationsRead는 모든 알림을 읽음 처리해야 한다', async () => {
    vi.mocked(notificationApi.markAllAsRead).mockResolvedValueOnce({
      updatedCount: 4,
    });

    const { result } = renderHook(() => useMarkAllNotificationsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(notificationApi.markAllAsRead).toHaveBeenCalled();
  });

  it('useDeleteNotification은 단일 알림을 삭제해야 한다', async () => {
    vi.mocked(notificationApi.deleteNotification).mockResolvedValueOnce();

    const { result } = renderHook(() => useDeleteNotification(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(101);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(notificationApi.deleteNotification).toHaveBeenCalledWith(101);
  });

  it('useDeleteAllNotifications는 모든 알림을 일괄 삭제해야 한다', async () => {
    vi.mocked(notificationApi.deleteAllNotifications).mockResolvedValueOnce({
      deletedCount: 10,
    });

    const { result } = renderHook(() => useDeleteAllNotifications(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(notificationApi.deleteAllNotifications).toHaveBeenCalled();
  });

  it('useUpdateNotificationSettings는 알림 환경설정을 변경해야 한다', async () => {
    const newSettings = {
      isExpireWarnEnabled: false,
      isReactionNoticeEnabled: true,
      quietTimeStart: '23:00:00',
      quietTimeEnd: '06:00:00',
    };

    vi.mocked(notificationApi.updateNotificationSettings).mockResolvedValueOnce(newSettings);

    const { result } = renderHook(() => useUpdateNotificationSettings(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newSettings);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(notificationApi.updateNotificationSettings).toHaveBeenCalledWith(newSettings);
  });

});
