import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Check, ChevronDown, Sparkles, X } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  // 모바일 가상 키보드 내리기
  const handleDismissKeyboard = () => {
    inputRef.current?.blur();
  };

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
        <div className="flex min-w-0 flex-1 items-center gap-2 mr-2">
          {selectedIngredient ? (
            <>
              <span className="min-w-0 flex-1 truncate font-bold text-foreground">
                {selectedIngredient.name}
              </span>
              <span className="shrink-0 whitespace-nowrap rounded-md bg-accent px-1.5 py-0.5 text-xs text-muted-foreground">
                {selectedIngredient.categoryName}
              </span>
            </>
          ) : (
            <span className="truncate text-muted-foreground">
              식재료를 검색하여 선택하세요
            </span>
          )}
        </div>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {/* 2. 드롭다운 팝업 레이어 (불투명 솔리드 배경 적용) */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl ring-1 ring-black/10 dark:ring-white/10 animate-in fade-in-0 zoom-in-95"
        >
          {/* 검색창 & 모바일 키보드 닫기 바 */}
          <div className="relative mb-2 flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    handleDismissKeyboard();
                  }
                }}
                placeholder="재료명 검색 (양파, 계란 등)"
                className="h-9 sm:h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 pl-8 sm:pl-9 pr-7 text-xs sm:text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  aria-label="검색어 지우기"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* 모바일 키보드 닫기 버튼 */}
            <button
              type="button"
              onClick={handleDismissKeyboard}
              className="shrink-0 flex items-center justify-center rounded-xl border border-border/80 bg-muted/60 px-2 sm:px-2.5 h-9 sm:h-10 text-[11px] sm:text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground active:scale-95 transition-colors whitespace-nowrap"
              title="키보드 내리고 목록 보기"
            >
              키보드 닫기
            </button>
          </div>

          {/* 카테고리 탭 칩 (터치 시 키보드 자동 blur) */}
          <div
            className="mb-2 flex gap-1 overflow-x-auto pb-1 scrollbar-none"
            onTouchStart={handleDismissKeyboard}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('ALL');
                handleDismissKeyboard();
              }}
              className={cn(
                'shrink-0 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-semibold transition-colors',
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
                onClick={() => {
                  setSelectedCategory(cat.categoryId);
                  handleDismissKeyboard();
                }}
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-semibold transition-colors',
                  selectedCategory === cat.categoryId
                    ? 'bg-brand-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-accent',
                )}
              >
                {cat.categoryName}
              </button>
            ))}
          </div>

          {/* 재료 리스트 (스크롤 및 터치 시 키보드 자동 blur) */}
          <div
            className="max-h-48 overflow-y-auto space-y-1 pr-1"
            onScroll={handleDismissKeyboard}
            onTouchStart={handleDismissKeyboard}
          >
            {filteredList.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <p>일치하는 식재료가 없어요 😢</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  찾으시는 재료가 없다면 다른 키워드로 검색해 보세요.
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
                      'flex min-h-[48px] w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent active:scale-[0.99] gap-2',
                      isSelected && 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-bold',
                    )}
                  >
                    {/* 좌측 정보: 1행(식재료명 100% 가로 확보) + 2행(카테고리 배지 & 권장일) */}
                    <div className="min-w-0 flex-1">
                      {/* 1행: 식재료명 (카테고리와 같은 줄에 두지 않아 절대 잘리지 않음) */}
                      <span className="block text-xs sm:text-sm font-bold text-foreground break-keep">
                        {item.name}
                      </span>

                      {/* 2행: 카테고리 배지 + 권장 소비기한 메타 캡션 */}
                      <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                        <span className="rounded bg-muted/90 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                          {item.categoryName}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">·</span>
                        <span className="flex items-center gap-1 text-[11px] whitespace-nowrap">
                          <Sparkles className="h-2.5 w-2.5 text-brand-400 shrink-0" />
                          권장 {item.defaultShelfDays}일
                        </span>
                      </div>
                    </div>

                    {/* 우측: 선택된 항목일 때 체크마크 */}
                    {isSelected && <Check className="h-4 w-4 text-brand-500 shrink-0 ml-1" />}
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
