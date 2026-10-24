import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NotificationPage from '@/pages/NotificationPage';
import { useNotificationStore } from '@/store/notificationStore';

describe('NotificationPage 알림 센터 단위 테스트', () => {
  beforeEach(() => {
    // 각 테스트 시작 전 알림 상태 리셋
    useNotificationStore.getState().resetNotifications();
  });

  it('알림 목록 카드들과 상단 액션 바를 정상적으로 렌더링해야 한다', () => {
    render(
      <MemoryRouter>
        <NotificationPage />
      </MemoryRouter>,
    );

    // 알림 제목 및 내용 확인
    expect(screen.getByText('소비기한 임박')).toBeInTheDocument();
    expect(screen.getByText('좋아요가 눌렸어요')).toBeInTheDocument();
    expect(screen.getByText('요리 완성!')).toBeInTheDocument();

    // 상단 액션 바 버튼 확인
    expect(screen.getByRole('button', { name: /모두 읽음/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /모두 삭제/ })).toBeInTheDocument();
  });

  it('모두 읽음 버튼 클릭 시 unreadCount가 0이 되고 읽지 않음 뱃지가 사라져야 한다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <NotificationPage />
      </MemoryRouter>,
    );

    expect(useNotificationStore.getState().unreadCount).toBeGreaterThan(0);

    const markAllButton = screen.getByRole('button', { name: /모두 읽음/ });
    await user.click(markAllButton);

    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useNotificationStore.getState().hasUnread).toBe(false);
  });

  it('단일 알림 삭제 버튼 클릭 시 해당 알림이 목록에서 제거되어야 한다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <NotificationPage />
      </MemoryRouter>,
    );

    const initialLength = useNotificationStore.getState().notifications.length;
    const deleteButtons = screen.getAllByRole('button', { name: /알림 삭제/ });

    await user.click(deleteButtons[0]);

    expect(useNotificationStore.getState().notifications.length).toBe(initialLength - 1);
  });

  it('모두 삭제를 확인하면 알림이 모두 지워지고 EmptyState가 렌더링되어야 한다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <NotificationPage />
      </MemoryRouter>,
    );

    const deleteAllButton = screen.getByRole('button', { name: /모두 삭제/ });
    await user.click(deleteAllButton);

    // 2차 확인 모달 내 '전체 삭제' 액션 버튼 클릭
    const confirmButton = screen.getByRole('button', { name: '전체 삭제' });
    await user.click(confirmButton);

    expect(useNotificationStore.getState().notifications.length).toBe(0);
    expect(screen.getByText('새로운 알림이 없어요')).toBeInTheDocument();
  });
});
