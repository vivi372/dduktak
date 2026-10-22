import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckCheck, Heart, ChefHat, Hourglass, Trash2, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { mockNotifications } from '@/mocks';
import { cn } from '@/utils/cn';
import type { NotificationType } from '@/types/notification';

const TYPE_ICON: Record<NotificationType, { Icon: LucideIcon; style: string }> = {
  EXPIRE_WARN: { Icon: Hourglass, style: 'bg-dday-urgent/10 text-dday-urgent' },
  RECIPE_LIKED: { Icon: Heart, style: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200' },
  RECIPE_COOKED: { Icon: ChefHat, style: 'bg-mint-100 text-mint-700 dark:bg-mint-700/30 dark:text-mint-300' },
};

/** 알림함 프레임 (읽음/삭제/딥링크 연동은 Step 3B-4) */
export default function NotificationPage() {
  const [items, setItems] = useState(mockNotifications.notifications);
  const unread = items.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('모든 알림을 읽었어요');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          읽지 않은 알림 <span className="font-extrabold text-brand-600 dark:text-brand-300">{unread}개</span>
        </p>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck /> 모두 읽음
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setItems([])}>
            <Trash2 /> 모두 삭제
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState emoji="🔔" title="새로운 알림이 없어요" description="소비기한 임박 소식이 생기면 알려드릴게요." />
      ) : (
        <ul className="space-y-2.5">
          {items.map((n) => {
            const { Icon, style } = TYPE_ICON[n.type];
            return (
              <li key={n.notificationId}>
                <article
                  className={cn(
                    'flex gap-3 rounded-2xl border p-3.5 shadow-card transition-colors',
                    n.isRead ? 'bg-card' : 'border-brand-300/70 bg-brand-50/70 dark:border-brand-700/60 dark:bg-brand-900/15',
                  )}
                >
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', style)}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[15px] font-bold">{n.title}</h2>
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-dday-urgent" aria-label="읽지 않음" />}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.content}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground/80">
                      {format(parseISO(n.createdAt), 'M월 d일 a h:mm', { locale: ko })}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
