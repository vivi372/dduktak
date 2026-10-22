import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Check, ChevronDown, Sparkles } from 'lucide-react';
import { mockMasterIngredients, mockCategories } from '@/mocks';
import { cn } from '@/utils/cn';
import type { MasterIngredient } from '@/types/inventory';

interface IngredientComboboxProps {
  /** 현재 선택된 마스터 재료 ID */
  value?: number | null;
  /** 재료 선택 시 호출되는 콜백 */
  onChange: (ingredient: MasterIngredient) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  className?: string;
}

/**
 * 74종 표준 식재료 검색 Searchable Select (Combobox)
 * - 자유 텍스트 입력을 방지하고 표준 마스터 재료 선택 유도 (INV-01-1)
 * - 6개 카테고리 탭 필터링 및 실시간 키워드 검색
 * - WAI-ARIA 키보드 접근성 및 44px 이상 터치 타겟 지원
 */
export function IngredientCombobox({
  value,
  onChange,
  disabled = false,
  className,
}: IngredientComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);

  // 현재 선택된 마스터 재료 객체
  const selectedIngredient = useMemo(
    () => mockMasterIngredients.find((item) => item.masterIngredientId === value) ?? null,
    [value],
  );

  // 검색어 및 카테고리에 따른 필터링 결과
  const filteredList = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    return mockMasterIngredients.filter((item) => {
      const matchCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchQuery =
        trimmed === '' ||
        item.name.toLowerCase().includes(trimmed) ||
        item.categoryName.toLowerCase().includes(trimmed);
      return matchCategory && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (ingredient: MasterIngredient) => {
    onChange(ingredient);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* 1. 트리거 버튼 */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex min-h-[48px] w-full items-center justify-between rounded-xl border border-input bg-card px-4 py-2.5 text-left text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50',
          selectedIngredient ? 'font-medium text-foreground' : 'text-muted-foreground',
          isOpen && 'border-brand-500 ring-2 ring-brand-500/20',
        )}
      >
        <span className="truncate">
          {selectedIngredient ? (
            <span className="flex items-center gap-2">
              <span className="font-bold text-foreground">{selectedIngredient.name}</span>
              <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs text-muted-foreground">
                {selectedIngredient.categoryName}
              </span>
            </span>
          ) : (
            '표준 식재료를 검색하여 선택하세요'
          )}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {/* 2. 드롭다운 팝업 레이어 */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 w-full overflow-hidden rounded-2xl border bg-popover p-2 shadow-xl animate-in fade-in-0 zoom-in-95"
        >
          {/* 검색창 */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="재료명 검색 (예: 양파, 계란, 삼겹살)"
              className="h-10 w-full rounded-xl border bg-muted/40 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:bg-background focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* 카테고리 탭 칩 */}
          <div className="mb-2 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={cn(
                'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
                selectedCategory === 'ALL'
                  ? 'bg-brand-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-accent',
              )}
            >
              전체
            </button>
            {mockCategories.map((cat) => (
              <button
                key={cat.categoryId}
                type="button"
                onClick={() => setSelectedCategory(cat.categoryId)}
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
                  selectedCategory === cat.categoryId
                    ? 'bg-brand-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-accent',
                )}
              >
                {cat.categoryName}
              </button>
            ))}
          </div>

          {/* 재료 리스트 */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
            {filteredList.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <p>일치하는 표준 식재료가 없어요 😢</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  마스터에 없는 재료는 커뮤니티 요청을 이용해 주세요.
                </p>
              </div>
            ) : (
              filteredList.map((item) => {
                const isSelected = item.masterIngredientId === value;
                return (
                  <button
                    key={item.masterIngredientId}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent active:scale-[0.99]',
                      isSelected && 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-bold',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {item.categoryName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Sparkles className="h-3 w-3 text-brand-400" />
                        권장 {item.defaultShelfDays}일
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-brand-500" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
