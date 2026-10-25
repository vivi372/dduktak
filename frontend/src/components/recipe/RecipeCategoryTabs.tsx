import { useRecipeCategories } from '@/hooks/useRecipe';
import { cn } from '@/utils/cn';

interface RecipeCategoryTabsProps {
  /** 현재 선택된 카테고리 ID (0 = 전체) */
  selectedId: number;
  /** 카테고리 변경 콜백 */
  onSelect: (categoryId: number) => void;
  className?: string;
}

/**
 * 8대 표준 카테고리 + 전체 탭바 (REC-01-1 / MATCH-01-3)
 * - useRecipeCategories 훅 연동으로 서버 카테고리 동적 바인딩
 * - 44px 이상 터치 타겟 확보 및 스크롤바 없는 수평 스와이프
 * - 브랜드 코랄 핑크(#FF8A7A) 포인트 테마
 */
export function RecipeCategoryTabs({
  selectedId,
  onSelect,
  className,
}: RecipeCategoryTabsProps) {
  const { data: categories = [] } = useRecipeCategories();

  return (
    <div
      className={cn('no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1', className)}
      role="tablist"
      aria-label="레시피 8대 카테고리 목록"
    >
      {categories.map((category) => {
        const isSelected = selectedId === category.recipeCategoryId;
        return (
          <button
            key={category.recipeCategoryId}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(category.recipeCategoryId)}
            className={cn(
              'min-h-[44px] shrink-0 rounded-full px-4 text-xs sm:text-sm font-bold transition-all active:scale-95 whitespace-nowrap',
              isSelected
                ? 'bg-brand-500 text-white shadow-soft dark:bg-brand-500'
                : 'border border-border/80 bg-card text-muted-foreground hover:bg-accent hover:text-foreground dark:border-white/10',
            )}
          >
            {category.categoryName}
          </button>
        );
      })}
    </div>
  );
}
