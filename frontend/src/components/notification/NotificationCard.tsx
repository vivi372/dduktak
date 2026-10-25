import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Heart, ChefHat, Hourglass, Trash2, ChevronRight, Bell, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/routes';
import { getRecipeDetail } from '@/services/recipeApi';
import { cn } from '@/utils/cn';
import type { NotificationItem, NotificationType } from '@/types/notification';

interface NotificationCardProps {
  notification: NotificationItem;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const TYPE_CONFIG: Record<
  NotificationType,
  { Icon: LucideIcon; style: string; badgeLabel: string }
> = {
  EXPIRE_WARN: {
    Icon: Hourglass,
    style: 'bg-dday-urgent/15 text-dday-urgent ring-1 ring-dday-urgent/30',
    badgeLabel: '소비기한',
  },
  EXPIRE_D_DAY: {
    Icon: Hourglass,
    style: 'bg-dday-urgent/25 text-dday-urgent ring-1 ring-dday-urgent/40',
    badgeLabel: '오늘만료',
  },
  LIKE_NOTICE: {
    Icon: Heart,
    style: 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 ring-1 ring-brand-300 dark:ring-brand-700/60',
    badgeLabel: '좋아요',
  },
  COOKED_NOTICE: {
    Icon: ChefHat,
    style: 'bg-mint-100 text-mint-700 dark:bg-mint-700/30 dark:text-mint-300 ring-1 ring-mint-300 dark:ring-mint-700/60',
    badgeLabel: '요리완료',
  },
  SYSTEM: {
    Icon: Bell,
    style: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-slate-700',
    badgeLabel: '공지',
  },
  RECIPE_LIKED: {
    Icon: Heart,
    style: 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 ring-1 ring-brand-300 dark:ring-brand-700/60',
    badgeLabel: '좋아요',
  },
  RECIPE_COOKED: {
    Icon: ChefHat,
    style: 'bg-mint-100 text-mint-700 dark:bg-mint-700/30 dark:text-mint-300 ring-1 ring-mint-300 dark:ring-mint-700/60',
    badgeLabel: '요리완료',
  },
};

/**
 * 알림 센터 단일 카드 컴포넌트
 * (유형별 아이콘, 읽음/미읽음 시각 차이, 딥링크 이동 및 404 Fallback, 단일 삭제)
 */
export function NotificationCard({ notification, onRead, onDelete }: NotificationCardProps) {
  const navigate = useNavigate();
  const { Icon, style, badgeLabel } = TYPE_CONFIG[notification.type] || TYPE_CONFIG.EXPIRE_WARN;

  const handleClickCard = async () => {
    // 1. 단일 읽음 처리
    if (!notification.isRead) {
      onRead(notification.notificationId);
    }

    // 2. 딥링크 타겟으로 이동 및 404 Fallback 처리
    const type = notification.type;
    if (type === 'EXPIRE_WARN' || type === 'EXPIRE_D_DAY') {
      navigate(ROUTES.INVENTORY);
      return;
    }

    if (
      type === 'LIKE_NOTICE' ||
      type === 'COOKED_NOTICE' ||
      type === 'RECIPE_LIKED' ||
      type === 'RECIPE_COOKED'
    ) {
      if (!notification.targetId) {
        navigate(ROUTES.RECIPES);
        return;
      }

      try {
        // 타겟 레시피 유효성 사전 검증 (파기/삭제 여부 확인)
        await getRecipeDetail(notification.targetId);
        navigate(`/recipes/${notification.targetId}`);
      } catch {
        // 레시피가 삭제되었거나 404 Not Found인 경우 안전한 Fallback 알림 토스트 노출 후 화면 유지
        toast.error('삭제되었거나 더 이상 존재하지 않는 콘텐츠입니다');
      }
      return;
    }

    // 기타 시스템 알림
    if (notification.targetId) {
      navigate(`/recipes/${notification.targetId}`);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.notificationId);
  };

  let formattedDate = '';
  try {
    formattedDate = format(parseISO(notification.createdAt), 'M월 d일 a h:mm', { locale: ko });
  } catch {
    formattedDate = notification.createdAt;
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleClickCard}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClickCard();
        }
      }}
      className={cn(
        'group relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 shadow-card transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
        notification.isRead
          ? 'border-border/70 bg-card text-foreground opacity-85'
          : 'border-brand-300/80 bg-brand-50/70 text-foreground dark:border-brand-700/60 dark:bg-brand-900/15',
      )}
    >
      {/* 알림 유형별 원형/스퀘어 심볼 아이콘 */}
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', style)}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>

      {/* 알림 본문 콘텐츠 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-bold text-muted-foreground ring-1 ring-border/60">
            {badgeLabel}
          </span>
          <h2 className="truncate text-[15px] font-bold tracking-tight">{notification.title}</h2>
          {!notification.isRead && (
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-dday-urgent animate-pulse"
              aria-label="읽지 않은 알림"
            />
          )}
        </div>

        <p className="mt-1 text-sm leading-relaxed text-muted-foreground break-keep">
          {notification.content}
        </p>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground/80">
          <span>{formattedDate}</span>
          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-300">
            바로가기 <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* 단일 삭제 버튼 (44px 터치 타겟 확보) */}
      <button
        type="button"
        onClick={handleDelete}
        aria-label={`${notification.title} 알림 삭제`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-destructive active:scale-95 dark:hover:bg-white/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </article>
  );
}
