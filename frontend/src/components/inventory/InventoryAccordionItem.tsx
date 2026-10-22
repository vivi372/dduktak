import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Utensils, Trash2, Edit3, MessageSquareQuote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DDayBadge } from '@/components/common/DDayBadge';
import { STORAGE_LABEL } from '@/utils/dday';
import type { GroupedInventoryItem, InventoryItem } from '@/types/inventory';


interface InventoryAccordionItemProps {
  /** 2-Tier 그룹화된 식재료 데이터 */
  group: GroupedInventoryItem;
  /** 소비 클릭 콜백 */
  onConsume: (item: InventoryItem) => void;
  /** 수정 클릭 콜백 */
  onEdit: (item: InventoryItem) => void;
  /** 삭제 클릭 콜백 */
  onDelete: (item: InventoryItem) => void;
}

/**
 * 2-Tier 아코디언 식재료 카드 컴포넌트
 * - 1차 뷰: 동일 마스터 식재료 대표 카드 (가장 임박한 D-Day 기준 정렬 및 배지 노출, 기본 접힘)
 * - 2차 뷰: 클릭 시 Framer Motion으로 펼쳐지는 개별 구매/인스턴스 레코드 목록
 * - 개별 레코드별 [소비 완료], [수정], [삭제] 액션 지원
 */
export function InventoryAccordionItem({
  group,
  onConsume,
  onEdit,
  onDelete,
}: InventoryAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 인스턴스가 1개인지 복수개인지 구분
  const isMultiple = group.items.length > 1;

  // 소비기한 임박순 정렬된 개별 인스턴스
  const sortedItems = [...group.items].sort((a, b) => a.dDay - b.dDay);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card transition-all hover:border-brand-200">
      {/* 1. 대표 카드 (1차 뷰) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex min-h-[64px] w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-accent/40 active:bg-accent/70"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-extrabold tracking-tight">{group.name}</h2>
              <Badge variant="mint" className="text-[11px] font-bold">
                {STORAGE_LABEL[group.storageType]}
              </Badge>
              {isMultiple && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                  {group.items.length}개 보관 중
                </span>
              )}
            </div>

            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <span>총 {group.totalQuantity} {group.primaryUnit}</span>
              {group.categoryName && (
                <>
                  <span>·</span>
                  <span>{group.categoryName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* 가장 임박한 D-Day 배지 및 토글 아이콘 */}
        <div className="flex shrink-0 items-center gap-2">
          <DDayBadge dDay={group.mostUrgentDDay} verbose className="shadow-xs" />
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </div>
      </button>

      {/* 2. 세부 레코드 아코디언 (2차 뷰: Framer Motion 전개) */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="accordion-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t bg-muted/20"
          >
            <div className="space-y-2.5 p-3.5 sm:p-4">
              <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-muted-foreground">
                <span>보관 인스턴스 ({sortedItems.length}건)</span>
                <span>소비기한 임박순</span>
              </div>

              {sortedItems.map((item, idx) => (
                <div
                  key={item.ingredientId}
                  className="rounded-xl border bg-card p-3 shadow-xs transition-all hover:border-brand-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {idx + 1}. {item.quantity} {item.unit}
                        </span>
                        <DDayBadge dDay={item.dDay} className="scale-90 origin-left" />
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        <span>소비기한: {item.expireDate}</span>
                        <span className="mx-1.5">·</span>
                        <span>{STORAGE_LABEL[item.storageType]}</span>
                      </div>

                      {/* 유저 개별 메모 (존재할 경우 말풍선 UI) */}
                      {item.memo && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-accent/60 px-2.5 py-1 text-xs font-medium text-foreground">
                          <MessageSquareQuote className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                          <span className="truncate">{item.memo}</span>
                        </div>
                      )}
                    </div>

                    {/* 개별 액션 버튼 3종: 소비, 수정, 삭제 */}
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConsume(item);
                        }}
                        aria-label={`${item.name} 소비`}
                        className="flex h-9 items-center gap-1 rounded-lg bg-brand-50 px-2.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100 active:scale-95 dark:bg-brand-950/60 dark:text-brand-300"
                      >
                        <Utensils className="h-3.5 w-3.5" />
                        <span>소비</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
                        aria-label={`${item.name} 수정`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item);
                        }}
                        aria-label={`${item.name} 삭제`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/20 bg-background text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
