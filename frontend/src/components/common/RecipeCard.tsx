import { Clock, Heart, ChefHat } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { RecipeSummary } from '@/types/recipe';

interface RecipeCardProps {
  recipe: RecipeSummary;
  /** 냉장고 매칭률(%) - 있으면 민트 배지로 노출 */
  matchingRate?: number;
  /** carousel: 세로형 가로스크롤 카드 / list: 가로형 리스트 카드 */
  variant?: 'carousel' | 'list';
  className?: string;
}

function MatchBadge({ rate }: { rate: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-mint-500 px-2.5 py-1 text-xs font-extrabold text-mint-foreground shadow-sm">
      매칭 {rate}%
    </span>
  );
}

/** 레시피 카드 (홈 캐러셀 / 레시피 피드 공용) */
export function RecipeCard({ recipe, matchingRate, variant = 'list', className }: RecipeCardProps) {
  const meta = (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden />{recipe.cookingTime}분</span>
      <span>{recipe.difficulty}</span>
      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" aria-hidden />{recipe.likeCount}</span>
      <span className="flex items-center gap-1"><ChefHat className="h-3.5 w-3.5" aria-hidden />{recipe.cookedCount}</span>
    </div>
  );

  if (variant === 'carousel') {
    return (
      <article
        className={cn(
          'group w-56 shrink-0 snap-start overflow-hidden rounded-2xl border bg-card shadow-card transition-transform active:scale-[0.98] dark:border-white/10 dark:shadow-[0_2px_14px_rgba(0,0,0,0.5)]',
          className,
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={recipe.thumbnailUrl}
            alt={recipe.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {matchingRate !== undefined && <div className="absolute left-2 top-2"><MatchBadge rate={matchingRate} /></div>}
        </div>
        <div className="space-y-1.5 p-3">
          <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-300">{recipe.categoryName}</p>
          <h3 className="line-clamp-1 text-[15px] font-bold">{recipe.title}</h3>
          {meta}
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'group flex gap-3 overflow-hidden rounded-2xl border bg-card p-2.5 shadow-card transition-transform active:scale-[0.99] dark:border-white/10 dark:shadow-[0_2px_14px_rgba(0,0,0,0.5)]',
        className,
      )}
    >
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl">
        <img src={recipe.thumbnailUrl} alt={recipe.title} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-300">{recipe.categoryName}</p>
            {matchingRate !== undefined && <MatchBadge rate={matchingRate} />}
          </div>
          <h3 className="line-clamp-1 text-[15px] font-bold">{recipe.title}</h3>
          <p className="text-[11px] text-muted-foreground">by {recipe.authorNickname}#{recipe.authorTag}</p>
        </div>
        {meta}
      </div>
    </article>
  );
}
