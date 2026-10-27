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
 * 인벤토리(내 냉장고) 2-Tier 아코디언 카드 스켈레톤 (InventoryAccordionItem 1차 뷰와 100% 동일한 컨테이너/치수 유지)
 */
export function InventoryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card min-h-[64px] p-4 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4.5 w-24 sm:w-28 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Skeleton className="h-6 w-12 sm:w-16 rounded-full" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
    </div>
  );
}

/**
 * 레시피 피드 및 캐러셀 카드 스켈레톤 (RecipeCard와 100% 동일한 외형/치수 유지)
 */
export function RecipeCardSkeleton({ variant = 'list' }: { variant?: 'list' | 'grid' | 'carousel' }) {
  if (variant === 'carousel') {
    return (
      <div className="w-56 shrink-0 snap-start overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
        <Skeleton className="aspect-[4/3] w-full rounded-none" />
        <div className="space-y-1.5 p-3">
          <Skeleton className="h-3 w-14 rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
          <div className="flex items-center justify-between pt-1 border-t border-border/40">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    );
  }

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
    <div className="flex gap-3 overflow-hidden rounded-2xl border border-border/80 bg-card p-2.5 shadow-card">
      <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-xl" />
      <div className="flex-1 min-w-0 space-y-1.5 py-0.5">
        <Skeleton className="h-3 w-14 rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

/**
 * 메인 홈 냉장고 브리핑 단일 위젯 카드 스켈레톤 (HomePage 브리핑 Card와 100% 동일한 컨테이너 유지)
 */
export function HomeBriefingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted/60" />
          <Skeleton className="h-3.5 w-28 rounded-md" />
        </div>
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-7 w-44 rounded-lg" />
      <div className="flex flex-wrap gap-2 pt-1">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
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

/**
 * 레시피 상세 페이지 스켈레톤 (상세 로딩 중 레이아웃 시프트 및 깜빡임 방지)
 */
export function RecipeDetailSkeleton() {
  return (
    <div className="space-y-6 pb-6">
      {/* 1. 상단 히어로 이미지 영역 */}
      <div className="relative -mx-4 -mt-4 overflow-hidden aspect-[16/10] sm:aspect-[2/1] sm:rounded-3xl sm:mx-0 sm:mt-0 bg-muted">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      {/* 2. 카테고리, 제목, 작성자 영역 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20 rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
        <Skeleton className="h-7 w-3/4 rounded-xl" />
        <div className="flex items-center gap-3 pt-1">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>

      {/* 3. 인분 계산기 카드 영역 */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      {/* 4. 필요 재료 리스트 영역 */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-card space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </div>

      {/* 5. 조리 순서(스텝) 영역 */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="space-y-2.5">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
