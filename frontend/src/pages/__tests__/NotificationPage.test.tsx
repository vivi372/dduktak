import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import NotificationPage from '@/pages/NotificationPage';
import * as notificationApi from '@/services/notificationApi';
import * as recipeApi from '@/services/recipeApi';
import { useAuthStore } from '@/store/useAuthStore';

vi.mock('@/services/notificationApi', () => ({
  getNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  deleteAllNotifications: vi.fn(),
  updateNotificationSettings: vi.fn(),
}));

vi.mock('@/services/recipeApi', () => ({
  getRecipeDetail: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

const mockNotificationList = {
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
    {
      notificationId: 2,
      type: 'LIKE_NOTICE' as const,
      title: '좋아요가 눌렸어요',
      content: '요리왕님이 내 레시피를 좋아합니다.',
      targetId: 999,
      isRead: false,
      createdAt: '2026-10-25T10:00:00Z',
    },
  ],
};

describe('NotificationPage 알림 센터 단위 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        userId: 'test-user',
        email: 'test@dduktak.com',
        nickname: '테스터',
        userTag: '0001',
        profileImage: '',
        status: 'ACTIVE',
        quietTimeStart: '21:00:00',
        quietTimeEnd: '08:00:00',
      },
    });
    vi.mocked(notificationApi.getNotifications).mockResolvedValue(mockNotificationList);
  });


  it('알림 목록 카드들과 상단 액션 바를 정상적으로 렌더링해야 한다', async () => {
    render(<NotificationPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('소비기한 임박')).toBeInTheDocument();
      expect(screen.getByText('좋아요가 눌렸어요')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /모두 읽음/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /모두 삭제/ })).toBeInTheDocument();
  });

  it('모두 읽음 버튼 클릭 시 markAllAsRead API를 호출하고 성공 토스트를 띄워야 한다', async () => {
    vi.mocked(notificationApi.markAllAsRead).mockResolvedValueOnce({ updatedCount: 2 });
    const user = userEvent.setup();

    render(<NotificationPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('소비기한 임박')).toBeInTheDocument();
    });

    const markAllButton = screen.getByRole('button', { name: /모두 읽음/ });
    await user.click(markAllButton);

    expect(notificationApi.markAllAsRead).toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('모든 알림을 읽음 처리했어요');
    });
  });

  it('단일 알림 삭제 버튼 클릭 시 deleteNotification API를 호출해야 한다', async () => {
    vi.mocked(notificationApi.deleteNotification).mockResolvedValueOnce();
    const user = userEvent.setup();

    render(<NotificationPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('소비기한 임박')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /알림 삭제/ });
    await user.click(deleteButtons[0]);

    expect(notificationApi.deleteNotification).toHaveBeenCalledWith(1);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('알림을 삭제했어요');
    });
  });

  it('모두 삭제 2차 확인 모달 승인 시 deleteAllNotifications API를 호출해야 한다', async () => {
    vi.mocked(notificationApi.deleteAllNotifications).mockResolvedValueOnce({ deletedCount: 2 });
    const user = userEvent.setup();

    render(<NotificationPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('소비기한 임박')).toBeInTheDocument();
    });

    const deleteAllButton = screen.getByRole('button', { name: /모두 삭제/ });
    await user.click(deleteAllButton);

    // 2차 확인 모달 내 '전체 삭제' 액션 버튼 클릭
    const confirmButton = screen.getByRole('button', { name: '전체 삭제' });
    await user.click(confirmButton);

    expect(notificationApi.deleteAllNotifications).toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('모든 알림을 삭제했어요');
    });
  });

  it('알림이 없을 때 EmptyState가 렌더링되어야 한다', async () => {
    vi.mocked(notificationApi.getNotifications).mockResolvedValueOnce({
      unreadCount: 0,
      hasUnread: false,
      notifications: [],
    });

    render(<NotificationPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('새로운 알림이 없어요')).toBeInTheDocument();
    });
  });

  it('레시피 딥링크 클릭 시 타겟 레시피가 삭제(404 에러)된 경우 Fallback 에러 토스트를 노출해야 한다', async () => {
    vi.mocked(recipeApi.getRecipeDetail).mockRejectedValueOnce(new Error('RECIPE_WARN_NOT_FOUND (404)'));
    vi.mocked(notificationApi.markAsRead).mockResolvedValueOnce({ notificationId: 2, isRead: true });
    const user = userEvent.setup();

    render(<NotificationPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('좋아요가 눌렸어요')).toBeInTheDocument();
    });

    // 레시피 좋아요 알림 카드 클릭
    const recipeNotificationCard = screen.getByText('좋아요가 눌렸어요').closest('article');
    expect(recipeNotificationCard).not.toBeNull();
    await user.click(recipeNotificationCard!);

    // 단일 읽음 처리 호출 확인
    expect(notificationApi.markAsRead).toHaveBeenCalledWith(2);
    // 레시피 조회 시도 확인
    expect(recipeApi.getRecipeDetail).toHaveBeenCalledWith(999);

    // 404 Fallback 토스트 노출 확인
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('삭제되었거나 더 이상 존재하지 않는 콘텐츠입니다');
    });
  });
});
