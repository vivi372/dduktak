import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Check, ChevronDown, Sparkles, X, Loader2 } from 'lucide-react';
import { useMasterIngredients } from '@/hooks/useInventory';
import { mockCategories } from '@/mocks';
import { cn } from '@/utils/cn';
import type { MasterIngredient } from '@/types/inventory';

export interface MasterComboboxProps {
  /** 현재 선택된 마스터 재료 ID */
  value?: number | null;
  /** 재료 선택 시 호출되는 콜백 */
  onChange: (ingredient: MasterIngredient) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  className?: string;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
}

/**
 * 74종 표준 식재료 검색 Searchable Select (MasterCombobox)
 * - 자유 텍스트 입력을 방지하고 74종 표준 마스터 재료 선택 유도 (INV-01-1)
 * - React Query useMasterIngredients 훅을 통한 표준 마스터 실시간 데이터 바인딩
 * - 카테고리 탭 필터링 및 실시간 키워드 검색
 * - WAI-ARIA 키보드 접근성 및 44px 이상 터치 타겟 지원
 */
export function MasterCombobox({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = '식재료를 검색하여 선택하세요',
}: MasterComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 백엔드 API에서 74종 표준 마스터 식재료 조회 (30분 장기 캐싱)
  const { data: masterIngredients = [], isLoading } = useMasterIngredients();

  // 모바일 가상 키보드 내리기
  const handleDismissKeyboard = () => {
    inputRef.current?.blur();
  };

  // 현재 선택된 마스터 재료 객체
  const selectedIngredient = useMemo(
    () => masterIngredients.find((item) => item.masterIngredientId === value) ?? null,
    [masterIngredients, value],
  );

  // 검색어 및 카테고리에 따른 필터링 결과
  const filteredList = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    return masterIngredients.filter((item) => {
      const matchCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchQuery =
        trimmed === '' ||
        item.name.toLowerCase().includes(trimmed) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(trimmed));
      return matchCategory && matchQuery;
    });
  }, [masterIngredients, searchQuery, selectedCategory]);

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
              <span className="shrink-0 whitespace-nowrap text-xs text-brand-600 font-semibold dark:text-brand-400">
                기본 {selectedIngredient.defaultShelfDays}일 보관
              </span>
            </>
          ) : (
            <span className="truncate">{isLoading ? '식재료 목록 불러오는 중...' : placeholder}</span>
          )}
        </div>
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180 text-brand-500',
            )}
          />
        )}
      </button>

      {/* 2. 드롭다운 팝오버 */}
      {isOpen && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 flex max-h-[380px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95"
          role="listbox"
        >
          {/* 2-1. 검색창 */}
          <div className="relative border-b border-border/80 p-2.5 bg-muted/30">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="재료명 검색 (예: 계란, 양파, 돼지고기)"
              className="h-10 w-full rounded-xl bg-card pl-9 pr-8 text-xs font-medium placeholder:text-muted-foreground/80 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 2-2. 카테고리 필터 칩 (가로 스크롤 없이 한눈에 들어오는 랩핑 구조) */}
          <div className="flex flex-wrap gap-1.5 border-b border-border/60 bg-muted/20 p-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                selectedCategory === 'ALL'
                  ? 'bg-brand-500 text-white shadow-xs font-bold'
                  : 'bg-card text-muted-foreground hover:bg-accent border border-border/40',
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
                  'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                  selectedCategory === cat.categoryId
                    ? 'bg-brand-500 text-white shadow-xs font-bold'
                    : 'bg-card text-muted-foreground hover:bg-accent border border-border/40',
                )}
              >
                {cat.categoryName}
              </button>
            ))}
          </div>

          {/* 2-3. 식재료 선택 리스트 (44px 이상 터치 타겟) */}
          <div
            className="flex-1 overflow-y-auto p-1 divide-y divide-border/30"
            onScroll={handleDismissKeyboard}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                <span>표준 식재료를 불러오는 중입니다...</span>
              </div>
            ) : filteredList.length > 0 ? (
              filteredList.map((item) => {
                const isSelected = item.masterIngredientId === value;
                return (
                  <button
                    key={item.masterIngredientId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'flex min-h-[44px] w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors rounded-lg',
                      isSelected
                        ? 'bg-brand-50 text-brand-900 font-bold dark:bg-brand-950/40 dark:text-brand-200'
                        : 'hover:bg-accent text-foreground',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {item.categoryName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {item.defaultUnit} · {item.defaultShelfDays}일 권장
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-brand-500 shrink-0" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground px-4">
                <Sparkles className="h-6 w-6 text-brand-400 mb-1" />
                <p className="font-semibold text-foreground">검색 결과가 없어요</p>
                <p className="mt-1 text-[11px] break-keep">
                  마스터에 없는 재료는 커뮤니티 요청 게시판을 통해 등록을 건의해 주세요.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
