import type { NotificationList } from '@/types/notification';

/** 목 데이터: 알림함 (unreadCount / hasUnread는 헤더 Red Dot 노출 기준) */
export const mockNotifications: NotificationList = {
  unreadCount: 2,
  hasUnread: true,
  notifications: [
    { notificationId: 1, type: 'EXPIRE_WARN', title: '소비기한 임박', content: '계란의 소비기한이 2일 남았어요. 오늘 뚝딱 요리해 볼까요? 🍳', targetId: 10, isRead: false, createdAt: '2026-10-22T09:00:00' },
    { notificationId: 2, type: 'RECIPE_LIKED', title: '좋아요가 눌렸어요', content: "'계란볶음밥' 레시피를 누군가 좋아해요! ❤️", targetId: 1, isRead: false, createdAt: '2026-10-22T08:20:00' },
    { notificationId: 3, type: 'RECIPE_COOKED', title: '요리 완성!', content: "'계란볶음밥'을 만든 사람이 늘었어요. 지금까지 54명이 요리했어요.", targetId: 1, isRead: true, createdAt: '2026-10-21T19:40:00' },
    { notificationId: 4, type: 'EXPIRE_WARN', title: '소비기한 지남', content: '삼겹살의 소비기한이 1일 지났어요. 상태를 확인해 주세요.', targetId: 16, isRead: true, createdAt: '2026-10-21T09:00:00' },
  ],
};
