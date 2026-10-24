import { create } from 'zustand';
import { mockNotifications } from '@/mocks/notifications.mock';
import type { NotificationItem, NotificationSettings } from '@/types/notification';

interface NotificationState {
  /** 알림 목록 */
  notifications: NotificationItem[];
  /** 읽지 않은 알림 개수 */
  unreadCount: number;
  /** 읽지 않은 알림 존재 여부 (헤더 Red Dot 뱃지 노출 기준) */
  hasUnread: boolean;
  /** 통합 알림 환경설정 (소비기한 알림, 소셜 알림, 야간 방해금지 시간) */
  settings: NotificationSettings;

  /** 단일 알림 읽음 처리 */
  markAsRead: (notificationId: number) => void;
  /** 모든 알림 읽음 처리 */
  markAllAsRead: () => void;
  /** 단일 알림 수동 삭제 */
  deleteNotification: (notificationId: number) => void;
  /** 모든 알림 일괄 삭제 */
  deleteAllNotifications: () => void;
  /** 알림 환경설정 수정 */
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  /** 목 데이터 초기화 (검수/테스트용) */
  resetNotifications: () => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  isExpireWarnEnabled: true,
  isReactionNoticeEnabled: true,
  quietTimeStart: '21:00:00',
  quietTimeEnd: '08:00:00',
};

const calcUnread = (list: NotificationItem[]) => {
  const count = list.filter((n) => !n.isRead).length;
  return {
    unreadCount: count,
    hasUnread: count > 0,
  };
};

/**
 * 알림 센터 및 헤더 Red Dot 뱃지 동기화를 위한 Zustand 전역 스토어
 */
export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: mockNotifications.notifications,
  unreadCount: mockNotifications.unreadCount,
  hasUnread: mockNotifications.hasUnread,
  settings: DEFAULT_SETTINGS,

  markAsRead: (notificationId: number) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n,
      );
      return {
        notifications: updated,
        ...calcUnread(updated),
      };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, isRead: true }));
      return {
        notifications: updated,
        unreadCount: 0,
        hasUnread: false,
      };
    });
  },

  deleteNotification: (notificationId: number) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.notificationId !== notificationId);
      return {
        notifications: updated,
        ...calcUnread(updated),
      };
    });
  },

  deleteAllNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      hasUnread: false,
    });
  },

  updateSettings: (newSettings: Partial<NotificationSettings>) => {
    set((state) => ({
      settings: {
        ...state.settings,
        ...newSettings,
      },
    }));
  },

  resetNotifications: () => {
    set({
      notifications: mockNotifications.notifications,
      unreadCount: mockNotifications.unreadCount,
      hasUnread: mockNotifications.hasUnread,
      settings: DEFAULT_SETTINGS,
    });
  },
}));
