import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
 * - PC 웹 환경을 위한 좌/우 네비게이션 스크롤 버튼 제공
 * - 브랜드 코랄 핑크(#FF8A7A) 포인트 테마
 */
export function RecipeCategoryTabs({
  selectedId,
  onSelect,
  className,
}: RecipeCategoryTabsProps) {
  const { data: categories = [] } = useRecipeCategories();
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 스크롤 가능 여부 체크
  const updateScrollButtons = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [categories]);

  // 좌우 버튼 클릭 시 부드럽게 스크롤
  const scrollBy = (offset: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className={cn('relative group', className)}>
      {/* 좌측 스크롤 화살표 버튼 (PC 웹 스크롤 보조) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-180)}
          aria-label="이전 카테고리 보기"
          className="absolute -left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/95 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-accent hover:scale-110 active:scale-95 dark:border-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* 우측 스크롤 화살표 버튼 (PC 웹 스크롤 보조) */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(180)}
          aria-label="다음 카테고리 보기"
          className="absolute -right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/95 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-accent hover:scale-110 active:scale-95 dark:border-white/10"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* 카테고리 탭 리스트 */}
      <div
        ref={containerRef}
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 scroll-smooth"
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
    </div>
  );
}
