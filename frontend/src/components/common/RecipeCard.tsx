import { Link } from 'react-router-dom';
import { Clock, Heart, ChefHat, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DEFAULT_RECIPE_THUMBNAIL_URL } from '@/constants/images';
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
  const displayRate = typeof rate === 'number' && !isNaN(rate) ? rate : 0;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-mint-500 px-2.5 py-1 text-[11px] font-black text-slate-950 dark:bg-mint-400 dark:text-slate-950 shadow-sm">
      <Sparkles className="h-3 w-3 stroke-[2.5]" />
      <span>{displayRate}% 뚝딱 매칭</span>
    </span>
  );
}

/** 레시피 카드 (홈 캐러셀 / 레시피 피드 공용) */
export function RecipeCard({ recipe, matchingRate, variant = 'list', className }: RecipeCardProps) {
  const meta = (
    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40 gap-1">
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <span className="flex items-center gap-0.5">
          <Clock className="h-3 w-3 shrink-0 text-muted-foreground/80" aria-hidden />
          <span>{recipe.cookingTime}분</span>
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span>{recipe.difficulty}</span>
      </div>
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="flex items-center gap-0.5">
          <Heart
            className={cn(
              "h-3 w-3 shrink-0",
              recipe.isLiked ? "fill-rose-500 text-rose-500" : "text-rose-500/80"
            )}
            aria-hidden
          />
          <span className={cn(recipe.isLiked && "font-semibold text-rose-500")}>{recipe.likeCount}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <ChefHat className="h-3 w-3 shrink-0 text-amber-500/80" aria-hidden />
          <span>{recipe.cookedCount}</span>
        </span>
      </div>
    </div>
  );

  const isAnonymous =
    !recipe.authorNickname ||
    recipe.authorNickname === '(알 수 없음)' ||
    recipe.authorNickname.trim() === '';
  const authorDisplay = isAnonymous
    ? '관리자'
    : `${recipe.authorNickname}${recipe.authorTag ? `#${recipe.authorTag}` : ''}`;

  const thumbnailSrc =
    recipe.thumbnailUrl && recipe.thumbnailUrl !== 'null' && recipe.thumbnailUrl.trim() !== ''
      ? recipe.thumbnailUrl
      : DEFAULT_RECIPE_THUMBNAIL_URL;

  if (variant === 'carousel') {
    return (
      <Link
        to={`/recipes/${recipe.recipeId}`}
        className={cn(
          'group block w-56 shrink-0 snap-start overflow-hidden rounded-2xl border bg-card shadow-card transition-all hover:border-brand-300 active:scale-[0.98] dark:border-white/10 dark:shadow-[0_2px_14px_rgba(0,0,0,0.5)]',
          className,
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={thumbnailSrc}
            alt={recipe.title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_RECIPE_THUMBNAIL_URL;
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {typeof matchingRate === 'number' && matchingRate > 0 && (
            <div className="absolute left-2 top-2">
              <MatchBadge rate={matchingRate} />
            </div>
          )}
        </div>
        <div className="space-y-1.5 p-3">
          <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-300">{recipe.categoryName}</p>
          <h3 className="line-clamp-1 text-[15px] font-bold">{recipe.title}</h3>
          <p className="text-[11px] text-muted-foreground truncate">{authorDisplay}</p>
          {meta}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/recipes/${recipe.recipeId}`}
      className={cn(
        'group flex gap-3 overflow-hidden rounded-2xl border bg-card p-2.5 shadow-card transition-all hover:border-brand-300 active:scale-[0.99] dark:border-white/10 dark:shadow-[0_2px_14px_rgba(0,0,0,0.5)]',
        className,
      )}
    >
      <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
        <img
          src={thumbnailSrc}
          alt={recipe.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_RECIPE_THUMBNAIL_URL;
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-brand-600 dark:text-brand-300 truncate">
              {recipe.categoryName}
            </span>
            {typeof matchingRate === 'number' && matchingRate > 0 && <MatchBadge rate={matchingRate} />}
          </div>
          <h3 className="line-clamp-1 text-sm sm:text-[15px] font-bold text-foreground group-hover:text-brand-600 transition-colors">
            {recipe.title}
          </h3>
          <p className="text-[11px] text-muted-foreground truncate">{authorDisplay}</p>
        </div>
        {meta}
      </div>
    </Link>
  );
}
