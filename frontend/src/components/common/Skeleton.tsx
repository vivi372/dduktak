import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

/**
 * 모던 스켈레톤 로더 컴포넌트 (Shadcn UI 스타일 + Shimmer 애니메이션)
 */
export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-muted/70',
        shimmer &&
          'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent dark:after:via-white/10',
        className,
      )}
      {...props}
    />
  );
}

/**
 * 인벤토리(내 냉장고) 2-Tier 아코디언 카드 스켈레톤
 */
export function InventoryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

/**
 * 레시피 피드 카드 스켈레톤
 */
export function RecipeCardSkeleton({ variant = 'list' }: { variant?: 'list' | 'grid' }) {
  if (variant === 'grid') {
    return (
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-card">
        <Skeleton className="h-36 w-full rounded-none" />
        <div className="p-3.5 space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-card">
      <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-12 rounded-full" />
          <Skeleton className="h-3.5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-center justify-between pt-0.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

/**
 * 홈 브리핑 배너 & 스마트 매칭 스켈레톤
 */
export function HomeBriefingSkeleton() {
  return (
    <div className="space-y-6">
      {/* 상단 브리핑 히어로 카드 */}
      <div className="rounded-3xl border border-brand-200/60 bg-gradient-to-br from-brand-50/80 to-card p-5 shadow-card dark:border-brand-900/40 dark:from-brand-950/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24 rounded-full" />
            <Skeleton className="h-6 w-44" />
          </div>
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
        <div className="rounded-2xl bg-card/80 p-3.5 border border-border/60 space-y-2">
          <Skeleton className="h-3 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-xl" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 스마트 매칭 1위 추천 레시피 섹션 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-card">
          <Skeleton className="h-48 w-full rounded-none" />
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 알림 센터 카드 스켈레톤
 */
export function NotificationCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-card">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    </div>
  );
}
