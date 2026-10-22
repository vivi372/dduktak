import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, Trash2, Utensils, CalendarPlus } from 'lucide-react';
import { DDayBadge } from '@/components/common/DDayBadge';
import { STORAGE_LABEL } from '@/utils/dday';
import type { InventoryItem } from '@/types/inventory';

interface ExpiredIngredientsSectionProps {
  /** 소비기한이 도과한 재료 목록 (dDay < 0) */
  items: InventoryItem[];
  /** 폐기(삭제) 콜백 */
  onDiscard: (item: InventoryItem) => void;
  /** 먹음(소비) 콜백 */
  onConsume: (item: InventoryItem) => void;
  /** 소비기한 연장 콜백 */
  onExtend: (item: InventoryItem) => void;
}

/**
 * 소비기한 만료 영역 컴포넌트 (INV-02-4)
 * - 소비기한이 도과한 재료(dDay < 0)를 메인 카드 목록에서 격리하여 하단 접이식 아코디언으로 표시
 * - Deep Red 신호등 배지 적용
 * - [버리기(폐기)], [먹음(소비)], [소비기한 연장] 액션 제공
 */
export function ExpiredIngredientsSection({
  items,
  onDiscard,
  onConsume,
  onExtend,
}: ExpiredIngredientsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-destructive/30 bg-destructive/5 shadow-xs">
      {/* 아코디언 헤더 토글 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-destructive/10 active:bg-destructive/15"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-destructive tracking-tight">
              소비기한이 지난 재료 {items.length}개
            </h2>
            <p className="text-[11px] text-muted-foreground break-keep">버리거나 뒤늦게 소비하셨다면 정리해 주세요.</p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-destructive"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* 만료 목록 (Framer Motion) */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="expired-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-destructive/20 bg-background/60 p-3 sm:p-4 space-y-2.5"
          >
            {items.map((item) => (
              <div
                key={item.ingredientId}
                className="rounded-xl border border-destructive/20 bg-card p-2.5 sm:p-3 shadow-xs"
              >
                {/* 1행: [이름 + 수량 + (보관)]  ---  [3가지 관리 액션: 연장, 먹음, 폐기] */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground truncate">{item.name}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.quantity} {item.unit}
                      </span>
                      <span className="text-[11px] text-muted-foreground/80 whitespace-nowrap">
                        ({STORAGE_LABEL[item.storageType]})
                      </span>
                    </div>
                  </div>

                  {/* 3가지 관리 액션: 폐기, 먹음, 연장 */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onExtend(item)}
                      title="소비기한 연장"
                      aria-label={`${item.name} 소비기한 연장`}
                      className="flex h-8 items-center gap-1 rounded-lg border bg-background px-2 text-xs font-semibold text-foreground hover:bg-accent active:scale-95"
                    >
                      <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">연장</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onConsume(item)}
                      title="먹음 (소비 완료)"
                      aria-label={`${item.name} 먹음 처리`}
                      className="flex h-8 items-center gap-1 rounded-lg bg-brand-50 px-2 text-xs font-bold text-brand-700 hover:bg-brand-100 active:scale-95 dark:bg-brand-950/60 dark:text-brand-300"
                    >
                      <Utensils className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">먹음</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDiscard(item)}
                      title="버리기 (폐기)"
                      aria-label={`${item.name} 버리기`}
                      className="flex h-8 items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2 text-xs font-bold text-destructive hover:bg-destructive/20 active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">폐기</span>
                    </button>
                  </div>
                </div>

                {/* 2행: [DDayBadge (모바일 컴팩트 / PC verbose)] + [메모] */}
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  <div className="inline-flex sm:hidden">
                    <DDayBadge dDay={item.dDay} verbose={false} className="shrink-0" />
                  </div>
                  <div className="hidden sm:inline-flex">
                    <DDayBadge dDay={item.dDay} verbose={true} className="shrink-0" />
                  </div>
                  {item.memo && (
                    <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                      · {item.memo}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
