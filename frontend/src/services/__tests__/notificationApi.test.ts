import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as notificationApi from '@/services/notificationApi';
import { apiClient } from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('notificationApi 서비스 단위 테스트 (05_API_SPECIFICATION.md 3.5절)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getNotifications는 GET /api/v1/notifications를 호출하고 알림 목록과 unreadCount/hasUnread를 반환해야 한다', async () => {
    const mockData = {
      unreadCount: 2,
      hasUnread: true,
      notifications: [
        {
          notificationId: 1,
          type: 'EXPIRE_WARN' as const,
          title: '소비기한 임박',
          content: '계란의 소비기한이 2일 남았습니다.',
          targetId: 10,
          isRead: false,
          createdAt: '2026-10-25T09:00:00Z',
        },
      ],
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: mockData,
        message: '알림 목록 조회가 완료되었습니다.',
      },
    });

    const result = await notificationApi.getNotifications(0, 20);

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/notifications', {
      params: { page: 0, size: 20 },
    });
    expect(result).toEqual(mockData);
  });

  it('markAsRead는 PATCH /api/v1/notifications/:id/read를 호출하고 읽음 응답을 반환해야 한다', async () => {
    const mockData = { notificationId: 1, isRead: true };

    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      data: {
        success: true,
        data: mockData,
        message: '알림이 읽음 처리되었습니다.',
      },
    });

    const result = await notificationApi.markAsRead(1);

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/notifications/1/read');
    expect(result).toEqual(mockData);
  });

  it('markAllAsRead는 PATCH /api/v1/notifications/read-all을 호출하고 일괄 읽음 개수를 반환해야 한다', async () => {
    const mockData = { updatedCount: 5 };

    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      data: {
        success: true,
        data: mockData,
        message: '모든 알림이 읽음 처리되었습니다.',
      },
    });

    const result = await notificationApi.markAllAsRead();

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/notifications/read-all');
    expect(result).toEqual(mockData);
  });

  it('deleteNotification은 DELETE /api/v1/notifications/:id를 호출해야 한다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({
      data: {
        success: true,
        data: null,
        message: '알림이 삭제되었습니다.',
      },
    });

    await notificationApi.deleteNotification(10);

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/notifications/10');
  });

  it('deleteAllNotifications는 DELETE /api/v1/notifications/all을 호출하고 삭제 개수를 반환해야 한다', async () => {
    const mockData = { deletedCount: 8 };

    vi.mocked(apiClient.delete).mockResolvedValueOnce({
      data: {
        success: true,
        data: mockData,
        message: '모든 알림이 삭제되었습니다.',
      },
    });

    const result = await notificationApi.deleteAllNotifications();

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/notifications/all');
    expect(result).toEqual(mockData);
  });

  it('updateNotificationSettings는 PATCH /api/v1/notifications/settings를 호출하고 변경된 설정을 반환해야 한다', async () => {
    const requestDto = {
      isExpireWarnEnabled: true,
      isReactionNoticeEnabled: false,
      quietTimeStart: '22:00:00',
      quietTimeEnd: '07:00:00',
    };
    const responseDto = { ...requestDto };

    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      data: {
        success: true,
        data: responseDto,
        message: '알림 설정이 변경되었습니다.',
      },
    });

    const result = await notificationApi.updateNotificationSettings(requestDto);

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/notifications/settings', requestDto);
    expect(result).toEqual(responseDto);
  });
});
