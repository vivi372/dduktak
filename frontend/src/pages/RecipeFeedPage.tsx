import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { RecipeCard } from '@/components/common/RecipeCard';
import { mockRecipeCategories, mockRecipes } from '@/mocks';
import { cn } from '@/utils/cn';

/** 레시피 피드 프레임 (매칭/상세/등록 UI는 Step 3A-4) */
export default function RecipeFeedPage() {
  const [categoryId, setCategoryId] = useState(0);
  const [matchOn, setMatchOn] = useState(false);

  const recipes = useMemo(() => {
    const filtered = mockRecipes.filter((r) => categoryId === 0 || r.recipeCategoryId === categoryId);
    // 매칭 토글 ON: 매칭률 높은 순
    return matchOn ? [...filtered].sort((a, b) => b.matchingRate - a.matchingRate) : filtered;
  }, [categoryId, matchOn]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">뚝딱 레시피</h1>
        <p className="mt-1 text-sm text-muted-foreground">다른 사람들의 자취 레시피를 구경해 보세요.</p>
      </div>

      {/* 내 냉장고 뚝딱 매칭 토글 */}
      <button
        type="button"
        role="switch"
        aria-checked={matchOn}
        onClick={() => setMatchOn((v) => !v)}
        className={cn(
          'flex min-h-14 w-full items-center justify-between rounded-2xl border px-4 text-left transition-all active:scale-[0.99]',
          matchOn ? 'border-mint-500 bg-mint-50 dark:bg-mint-700/15' : 'bg-card',
        )}
      >
        <span>
          <span className="block text-sm font-bold">🟢 내 냉장고 뚝딱 매칭</span>
          <span className="block text-xs text-muted-foreground">
            {matchOn ? '가진 재료로 만들 수 있는 순서로 보여드려요' : '켜면 내 재료와 맞는 레시피를 먼저 보여드려요'}
          </span>
        </span>
        <span className={cn('flex h-7 w-12 items-center rounded-full p-1 transition-colors', matchOn ? 'bg-mint-500' : 'bg-border')} aria-hidden>
          <span className={cn('h-5 w-5 rounded-full bg-white shadow transition-transform', matchOn && 'translate-x-5')} />
        </span>
      </button>

      {/* 카테고리 칩 */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="레시피 카테고리">
        {mockRecipeCategories.map((c) => (
          <button
            key={c.recipeCategoryId}
            type="button"
            role="tab"
            aria-selected={categoryId === c.recipeCategoryId}
            onClick={() => setCategoryId(c.recipeCategoryId)}
            className={cn(
              'min-h-11 shrink-0 rounded-full px-4 text-sm font-bold transition-all active:scale-95',
              categoryId === c.recipeCategoryId
                ? 'bg-brand-500 text-brand-foreground shadow-soft'
                : 'border bg-card text-muted-foreground hover:bg-accent',
            )}
          >
            {c.categoryName}
          </button>
        ))}
      </div>

      {recipes.length === 0 ? (
        <EmptyState emoji="🍽" title="이 카테고리엔 아직 레시피가 없어요" description="다른 카테고리를 살펴보세요." />
      ) : (
        <div className="space-y-3">
          {recipes.map((r) => (
            <RecipeCard key={r.recipeId} recipe={r} matchingRate={matchOn ? r.matchingRate : undefined} variant="list" />
          ))}
        </div>
      )}
    </div>
  );
}
