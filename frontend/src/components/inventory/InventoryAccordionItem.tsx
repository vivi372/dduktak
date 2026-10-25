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
  /** 비동기 액션 진행 중 여부 (EDGE-03 광클릭 방지) */
  isActionPending?: boolean;
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
  isActionPending = false,
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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm sm:text-base font-extrabold tracking-tight">{group.name}</h2>
              <Badge variant="mint" className="shrink-0 text-[10px] sm:text-[11px] font-bold">
                {STORAGE_LABEL[group.storageType]}
              </Badge>
            </div>

            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <span className="whitespace-nowrap">총 {group.totalQuantity} {group.primaryUnit}</span>
              {group.categoryName && (
                <>
                  <span>·</span>
                  <span className="whitespace-nowrap">{group.categoryName}</span>
                </>
              )}
              {isMultiple && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-brand-600 dark:text-brand-300 whitespace-nowrap">
                    {group.items.length}개 보관 중
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* 가장 임박한 D-Day 배지 및 토글 아이콘 */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* 모바일 좁은 화면에서는 컴팩트 D-1 배지로 공간 확보, sm 이상에서는 verbose 노출 */}
          <div className="hidden sm:inline-flex">
            <DDayBadge dDay={group.mostUrgentDDay} verbose className="shadow-xs" />
          </div>
          <div className="inline-flex sm:hidden">
            <DDayBadge dDay={group.mostUrgentDDay} verbose={false} className="shadow-xs" />
          </div>
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
            <div className="space-y-2.5 p-3 sm:p-4">
              <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-muted-foreground">
                <span>보관 인스턴스 ({sortedItems.length}건)</span>
                <span>소비기한 임박순</span>
              </div>

              {sortedItems.map((item, idx) => (
                <div
                  key={item.ingredientId}
                  className="rounded-xl border bg-card p-2.5 sm:p-3 shadow-xs transition-all hover:border-brand-200"
                >
                  {/* 상단 1행: [수량 D-Day / 소비기한]  ---  [액션 버튼 3종] */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-xs font-bold text-foreground whitespace-nowrap">
                          {idx + 1}. {item.quantity} {item.unit}
                        </span>
                        <DDayBadge dDay={item.dDay} className="scale-90 origin-left shrink-0" />
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                        <span className="whitespace-nowrap font-medium">소비기한: {item.expireDate}</span>
                        <span>·</span>
                        <span className="whitespace-nowrap">{STORAGE_LABEL[item.storageType]}</span>
                      </div>
                    </div>

                    {/* 개별 액션 버튼 3종: 소비, 수정, 삭제 */}
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConsume(item);
                        }}
                        disabled={isActionPending}
                        aria-label={`${item.name} 소비`}
                        className="flex h-8 items-center gap-1 rounded-lg bg-brand-50 px-2 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-brand-950/60 dark:text-brand-300"
                      >
                        <Utensils className="h-3 w-3" />
                        <span className="text-[11px] sm:text-xs">소비</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
                        disabled={isActionPending}
                        aria-label={`${item.name} 수정`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item);
                        }}
                        disabled={isActionPending}
                        aria-label={`${item.name} 삭제`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/20 bg-background text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 하단 2행: 유저 개별 메모 (가로 100% Full Width를 온전히 활용하여 좁은 화면에서도 말줄임 없이 전체 노출) */}
                  {item.memo && (
                    <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-accent/60 px-2.5 py-1.5 text-xs font-medium text-foreground">
                      <MessageSquareQuote className="h-3.5 w-3.5 shrink-0 text-brand-500 mt-0.5" />
                      <span className="flex-1 break-words text-[11px] sm:text-xs leading-relaxed">{item.memo}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
