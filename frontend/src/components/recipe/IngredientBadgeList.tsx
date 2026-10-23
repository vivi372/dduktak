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
              className="flex items-center justify-between py-2.5 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="font-bold text-foreground truncate">{item.name}</span>
                <span className="font-medium text-brand-600 dark:text-brand-300 shrink-0">
                  {item.requiredQuantity} {item.unit}
                </span>
              </div>
              <IngredientStatusBadge status={item} />
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
                풍미 및 양념류 ({subList.length})
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">생략/대체 가능</span>
          </div>

          <ul className="divide-y divide-border/60">
            {subList.map((item) => (
              <li
                key={item.masterIngredientId}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="font-bold text-foreground truncate">{item.name}</span>
                  {item.isOptional && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground shrink-0">
                      선택
                    </span>
                  )}
                  <span className="font-medium text-muted-foreground shrink-0">
                    {item.requiredQuantity} {item.unit}
                  </span>
                </div>
                <IngredientStatusBadge status={item} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
