import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export type RecipeSortOption = 'latest' | 'matching' | 'popular' | 'cooked' | 'time';

interface RecipeSortDropdownProps {
  value: RecipeSortOption;
  onChange: (value: RecipeSortOption) => void;
  className?: string;
}

const SORT_OPTIONS: { value: RecipeSortOption; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'matching', label: '매칭률순' },
  { value: 'popular', label: '인기순 (좋아요)' },
  { value: 'cooked', label: '요리완료순' },
  { value: 'time', label: '조리시간 단축순' },
];

/**
 * 모던 라운드형 레시피 정렬 드롭다운 컴포넌트
 * - OS 네이티브 직사각형 셀렉트 대신 앱 디자인과 통일된 둥근 팝오버 UI
 * - 외부 클릭(Click Outside) 및 ESC 키 닫기 지원
 */
export function RecipeSortDropdown({
  value,
  onChange,
  className,
}: RecipeSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLabel =
    SORT_OPTIONS.find((opt) => opt.value === value)?.label || '최신순';

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative shrink-0', className)}>
      {/* 드롭다운 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="레시피 정렬 순서 선택"
        className={cn(
          'flex min-h-[44px] items-center gap-1.5 rounded-2xl border px-3 sm:px-4 text-xs sm:text-sm font-bold transition-all active:scale-95',
          isOpen
            ? 'border-brand-500 bg-accent text-foreground ring-2 ring-brand-500/20'
            : 'border-border/80 bg-card text-foreground hover:bg-accent/70 hover:border-border',
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="whitespace-nowrap">{currentLabel}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-brand-500',
          )}
        />
      </button>

      {/* 라운드 팝오버 메뉴 */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="정렬 옵션"
          className="absolute right-0 top-full mt-2 w-44 z-30 rounded-2xl border border-border/80 bg-card/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150 dark:border-white/10 dark:bg-card/95 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
        >
          {SORT_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs sm:text-sm font-bold transition-colors',
                  isSelected
                    ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 font-black'
                    : 'text-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-brand-500 stroke-[3] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
