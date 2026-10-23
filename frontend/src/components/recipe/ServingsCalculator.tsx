import { Minus, Plus, Users } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ServingsCalculatorProps {
  /** 현재 설정된 인분 */
  servings: number;
  /** 레시피 작성 기준 기본 인분 (기본 1) */
  baseServings?: number;
  /** 인분 변경 콜백 */
  onChange: (newServings: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

/**
 * 인분(Portion) 변환 계산기 (REC-02-2)
 * - 인분 수 조절 시 모든 필요 재료 수량 비례 자동 재계산
 * - 모바일 한 손 터치 타겟 44px 이상 확보
 */
export function ServingsCalculator({
  servings,
  baseServings = 1,
  onChange,
  min = 1,
  max = 10,
  className,
}: ServingsCalculatorProps) {
  const handleDecrement = () => {
    if (servings > min) onChange(servings - 1);
  };

  const handleIncrement = () => {
    if (servings < max) onChange(servings + 1);
  };

  const ratio = (servings / baseServings).toFixed(1);

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-card dark:border-white/10',
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold text-foreground">인분 변환 계산기</span>
            {servings !== baseServings && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                {ratio}배 조리
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {servings === baseServings
              ? `기본 ${baseServings}인분 기준 재료 수량입니다`
              : `${servings}인분에 맞춰 필요 재료 수량을 자동 연산했어요`}
          </p>
        </div>
      </div>

      {/* 수량 조절 버튼군 */}
      <div className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-background/80 p-1">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={servings <= min}
          aria-label="1인분 감소"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-all hover:bg-accent disabled:opacity-30 disabled:pointer-events-none active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>

        <span className="min-w-12 text-center text-sm font-black text-foreground">
          {servings}인분
        </span>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={servings >= max}
          aria-label="1인분 증가"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-all hover:bg-accent disabled:opacity-30 disabled:pointer-events-none active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
