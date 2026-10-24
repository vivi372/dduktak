import { toast } from 'sonner';
import { EmptyState } from '@/components/common/EmptyState';
import { NotificationActionBar, NotificationCard } from '@/components/notification';
import { useNotificationStore } from '@/store/notificationStore';

/**
 * 알림 센터 화면 (/notifications)
 * - 소비기한 임박 및 소셜(좋아요, 요리완료) 알림 목록 고속 렌더링
 * - 읽음/미읽음 시각 대비, 단일 삭제, 모두 읽음, 모두 삭제 확인
 * - 카드 클릭 시 딥링크(/inventory, /recipes/:id) 이동 및 단일 읽음 처리
 */
export default function NotificationPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotificationStore();

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success('모든 알림을 읽음 처리했어요');
  };

  const handleDeleteAll = () => {
    deleteAllNotifications();
    toast.success('모든 알림을 삭제했어요');
  };

  const handleDeleteSingle = (id: number) => {
    deleteNotification(id);
    toast.success('알림을 삭제했어요');
  };

  return (
    <div className="space-y-4">
      {/* 상단 알림 액션 바 */}
      <NotificationActionBar
        totalCount={notifications.length}
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        onDeleteAll={handleDeleteAll}
      />

      {/* 알림 목록 영역 */}
      {notifications.length === 0 ? (
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
                onRead={markAsRead}
                onDelete={handleDeleteSingle}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
