import { toast } from 'sonner';
import { EmptyState } from '@/components/common/EmptyState';
import { NotificationCardSkeleton } from '@/components/common/Skeleton';
import { NotificationActionBar, NotificationCard } from '@/components/notification';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from '@/hooks/useNotification';

/**
 * 알림 센터 화면 (/notifications)
 * - 소비기한 임박 및 소셜(좋아요, 요리완료) 알림 목록 고속 렌더링
 * - 읽음/미읽음 시각 대비, 단일 삭제, 모두 읽음, 모두 삭제 확인
 * - 카드 클릭 시 딥링크(/inventory, /recipes/:id) 이동 및 단일 읽음 처리 (404 Fallback 가드)
 */
export default function NotificationPage() {
  const { data, isLoading } = useNotifications(0, 50);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();
  const deleteAllMutation = useDeleteAllNotifications();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('모든 알림을 읽음 처리했어요');
      },
      onError: () => {
        toast.error('읽음 처리에 실패했습니다. 잠시 후 다시 시도해주세요.');
      },
    });
  };

  const handleDeleteAll = () => {
    deleteAllMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('모든 알림을 삭제했어요');
      },
      onError: () => {
        toast.error('알림 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
      },
    });
  };

  const handleDeleteSingle = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('알림을 삭제했어요');
      },
      onError: () => {
        toast.error('알림 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
      },
    });
  };

  const handleMarkAsRead = (id: number) => {
    markReadMutation.mutate(id);
  };

  return (
    <div className="space-y-4">
      {/* 상단 알림 액션 바 - 항상 형태를 유지하여 레이아웃 시프트 원천 차단 */}
      <NotificationActionBar
        totalCount={isLoading ? 0 : notifications.length}
        unreadCount={isLoading ? 0 : unreadCount}
        onMarkAllRead={handleMarkAllRead}
        onDeleteAll={handleDeleteAll}
      />

      {/* 알림 목록 영역 */}
      {isLoading ? (
        <div className="space-y-2.5 pt-1">
          <NotificationCardSkeleton />
          <NotificationCardSkeleton />
          <NotificationCardSkeleton />
          <NotificationCardSkeleton />
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-8">
          <EmptyState
            emoji="🔔"
            title="새로운 알림이 없어요"
            description="소비기한 임박 소식이나 내 레시피에 대한 소식이 생기면 알려드릴게요."
          />
        </div>
      ) : (
        <ul className="space-y-2.5" aria-label="알림 목록">
          {notifications.map((item) => (
            <li key={item.notificationId}>
              <NotificationCard
                notification={item}
                onRead={handleMarkAsRead}
                onDelete={handleDeleteSingle}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

