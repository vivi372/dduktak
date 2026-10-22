import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  /** CTA 버튼 등 하단 액션 영역 */
  children?: ReactNode;
  className?: string;
}

/** 빈 상태 안내 카드 (데이터 없음 / 신규 유저) */
export function EmptyState({ emoji, title, description, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-3xl border border-dashed border-brand-300/70 bg-brand-50/60 px-6 py-10 text-center dark:border-brand-400/40 dark:bg-card/70 dark:shadow-[0_2px_14px_rgba(0,0,0,0.4)]',
        className,
      )}
    >
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-soft dark:bg-card" aria-hidden>
        {emoji}
      </div>
      <p className="text-base font-bold">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-5 w-full">{children}</div>}
    </div>
  );
}
