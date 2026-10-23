import { CheckCircle2, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import type { IngredientMatchStatus } from '@/types/matching';
import { cn } from '@/utils/cn';

interface IngredientBadgeListProps {
  ingredientStatuses: IngredientMatchStatus[];
  className?: string;
}

/** 상태별 뱃지 렌더러 */
function IngredientStatusBadge({ status }: { status: IngredientMatchStatus }) {
  switch (status.status) {
    case 'SAUCE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-black text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Sparkles className="h-3 w-3" />
          <span>양념류 · 상시 보유</span>
        </span>
      );
    case 'OWNED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-mint-500/15 px-2.5 py-1 text-[11px] font-black text-mint-700 dark:text-mint-300 border border-mint-500/30">
          <CheckCircle2 className="h-3 w-3" />
          <span>보유 · {status.ownedQuantity}{status.unit}</span>
        </span>
      );
    case 'ALTERNATIVE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-1 text-[11px] font-black text-yellow-700 dark:text-yellow-400 border border-yellow-500/30">
          <RefreshCw className="h-3 w-3" />
          <span>대체가능 ({status.altIngredientName})</span>
        </span>
      );
    case 'DEFICIENT':
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-black text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <AlertTriangle className="h-3 w-3" />
          <span>부족 · {status.deficitQuantity}{status.unit}</span>
        </span>
      );
  }
}

/**
 * 레시피 상세 식재료 현황 목록 (REC-02-2)
 * - 주재료(MAIN) vs 부재료(SUB) 분리 그룹핑
 * - 보유/부족/대체/양념류 4색 신호등 배지 선명 표기
 */
export function IngredientBadgeList({
  ingredientStatuses,
  className,
}: IngredientBadgeListProps) {
  const mainList = ingredientStatuses.filter((i) => i.typeCode === 'MAIN');
  const subList = ingredientStatuses.filter((i) => i.typeCode === 'SUB');

  return (
    <div className={cn('space-y-6', className)}>
      {/* 1. 주재료 (MAIN) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-brand-500 px-2 py-0.5 text-[11px] font-extrabold text-white">
              주재료
            </span>
            <span className="text-sm font-extrabold text-foreground">
              요리의 핵심 재료 ({mainList.length})
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">필수 조건</span>
        </div>

        <ul className="divide-y divide-border/60">
          {mainList.map((item) => (
            <li
              key={item.masterIngredientId}
              className="flex items-center justify-between py-2.5 text-sm gap-2"
            >
              <div className="flex flex-wrap items-center gap-1.5 min-w-0 pr-2">
                <span className="font-bold text-foreground truncate">{item.name}</span>
                <span className="font-semibold text-brand-600 dark:text-brand-300 shrink-0 text-xs">
                  {item.requiredQuantity} {item.unit}
                </span>
                {item.altIngredientName && (
                  <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 px-2 py-0.5 text-[10px] font-extrabold shrink-0">
                    {item.altIngredientName} 대체 가능
                  </span>
                )}
              </div>
              <div className="shrink-0">
                <IngredientStatusBadge status={item} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 2. 부재료 (SUB) */}
      {subList.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-extrabold text-muted-foreground border">
                부재료
              </span>
              <span className="text-sm font-extrabold text-foreground">
                풍미 및 부가 재료 ({subList.length})
              </span>
            </div>
          </div>

          <ul className="divide-y divide-border/60">
            {subList.map((item) => (
              <li
                key={item.masterIngredientId}
                className="flex items-center justify-between py-2.5 text-sm gap-2"
              >
                <div className="flex flex-wrap items-center gap-1.5 min-w-0 pr-2">
                  <span className="font-bold text-foreground truncate">{item.name}</span>
                  <span className="font-semibold text-muted-foreground shrink-0 text-xs">
                    {item.requiredQuantity} {item.unit}
                  </span>
                  {item.isOptional && (
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 text-[10px] font-extrabold shrink-0 border border-border/40">
                      생략 가능
                    </span>
                  )}
                  {item.altIngredientName && (
                    <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 px-2 py-0.5 text-[10px] font-extrabold shrink-0">
                      {item.altIngredientName} 대체 가능
                    </span>
                  )}
                </div>
                <div className="shrink-0">
                  <IngredientStatusBadge status={item} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
