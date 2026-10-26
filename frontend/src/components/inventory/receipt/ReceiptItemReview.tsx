import { useState } from 'react';
import {
  CheckSquare,
  Square,
  Sparkles,
  Minus,
  Plus,
  Calendar,
  Check,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomDatePicker } from '@/components/common/CustomDatePicker';
import { DDayBadge } from '@/components/common/DDayBadge';
import type { OcrParsedItemWithRaw } from '@/mocks/ocr_scan.mock';
import type { InventoryItem } from '@/types/inventory';
import { cn } from '@/utils/cn';

interface ReceiptItemReviewProps {
  /** 검수 확정 후 상위 인벤토리에 일괄 등록할 콜백 */
  onConfirm: (newItems: Omit<InventoryItem, 'ingredientId'>[]) => void;
  /** 다시 촬영 / 영수증 사진 재선택 콜백 */
  onReupload: () => void;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 검수할 품목 초기 데이터 */
  initialItems?: OcrParsedItemWithRaw[];
}

/**
 * 3. 영수증 OCR 스캔 결과 수동 검수 컴포넌트
 * - 품목 체크박스 & 전체 선택 바
 * - 표준 마스터 매핑 배지 및 영수증 원문 대비 표기
 * - 접근성 표준 준수 + / - 수량 버튼 (44px+ 터치 타겟)
 * - CustomDatePicker 소비기한 캘린더 연동 및 D-Day 배지
 * - [선택한 재료 N개 넣기] 일괄 등록 CTA
 */
export function ReceiptItemReview({
  onConfirm,
  onReupload,
  onClose,
  initialItems = [],
}: ReceiptItemReviewProps) {
  const [items, setItems] = useState<OcrParsedItemWithRaw[]>(initialItems);

  // 선택된 항목 통계
  const selectedCount = items.filter((item) => item.selected).length;
  const totalCount = items.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  // 전체 선택/해제 토글
  const handleToggleAll = () => {
    const nextState = !isAllSelected;
    setItems((prev) => prev.map((item) => ({ ...item, selected: nextState })));
  };

  // 개별 품목 선택 토글
  const handleToggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  // 수량 증감 (- / +)
  const handleQuantityChange = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      })
    );
  };

  // 소비기한 직접 변경
  const handleDateChange = (id: string, newDate: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(newDate);
        target.setHours(0, 0, 0, 0);
        const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...item, recommendedExpireDate: newDate, dDay: diff };
      })
    );
  };

  // 일괄 등록 확정
  const handleConfirmBatch = () => {
    const selectedItems = items.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      toast.error('등록할 식재료를 1개 이상 선택해 주세요.');
      return;
    }

    const payload: Omit<InventoryItem, 'ingredientId'>[] = selectedItems.map((item) => ({
      masterIngredientId: item.masterIngredientId,
      categoryId: item.categoryId,
      name: item.name,
      // 육류/생선은 기본 냉장 보관
      storageType: item.categoryId === 2 ? 'REFRIGERATED' : 'REFRIGERATED',
      quantity: item.quantity,
      unit: item.unit,
      expireDate: item.recommendedExpireDate,
      dDay: item.dDay,
      memo: `영수증 OCR 자동인식 (${item.rawText})`,
    }));

    onConfirm(payload);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 1. 상단 컨트롤 바 (전체 선택 & 사진 재선택 버튼) */}
      <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2.5">
        <button
          type="button"
          onClick={handleToggleAll}
          className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-brand-600 transition-colors"
          aria-label="전체 선택 토글"
        >
          {isAllSelected ? (
            <CheckSquare className="h-4 w-4 text-brand-500" />
          ) : (
            <Square className="h-4 w-4 text-muted-foreground" />
          )}
          <span>
            전체 선택 ({selectedCount}/{totalCount}개)
          </span>
        </button>

        <button
          type="button"
          onClick={onReupload}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          <span>영수증 다시 찍기</span>
        </button>
      </div>

      {/* 2. 인식된 식재료 품목 리스트 */}
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'rounded-2xl border p-4 transition-all',
              item.selected
                ? 'border-brand-300 bg-card shadow-xs dark:border-brand-800'
                : 'border-border/60 bg-muted/20 opacity-60'
            )}
          >
            {/* 상단: 체크박스 + 품목명 + 수량 증감 버튼 */}
            <div className="flex items-center justify-between gap-3">
              {/* 왼쪽: 체크박스 및 품목 정보 */}
              <button
                type="button"
                onClick={() => handleToggleItem(item.id)}
                className="flex items-start gap-3 text-left flex-1 min-w-0"
                aria-checked={item.selected}
                role="checkbox"
              >
                <span className="mt-0.5">
                  {item.selected ? (
                    <CheckSquare className="h-5 w-5 shrink-0 text-brand-500" />
                  ) : (
                    <Square className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                </span>

                <div className="truncate flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-foreground truncate">
                      {item.name}
                    </span>
                    {/* 자동 분류 완료 배지 */}
                    <span className="inline-flex items-center gap-1 rounded-md bg-mint-100 px-1.5 py-0.5 text-[10px] font-bold text-mint-700 dark:bg-mint-400/20 dark:text-mint-300 dark:border dark:border-mint-500/30">
                      <Sparkles className="h-2.5 w-2.5" />
                      자동 분류 완료
                    </span>
                  </div>

                  {/* 영수증 인식 원문 표기 */}
                  <span className="block text-[11px] text-muted-foreground truncate mt-0.5">
                    영수증 원문: {item.rawText}
                  </span>
                </div>
              </button>

              {/* 오른쪽: + / - 수량 버튼 (44px+ 터치 타겟 준수) */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item.id, -1)}
                  disabled={!item.selected || item.quantity <= 1}
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border bg-background text-foreground shadow-xs transition-all hover:bg-accent active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={`${item.name} 수량 감소`}
                >
                  <Minus className="h-4 w-4" />
                </button>

                <span className="min-w-[48px] text-center text-xs font-bold tabular-nums">
                  {item.quantity} {item.unit}
                </span>

                <button
                  type="button"
                  onClick={() => handleQuantityChange(item.id, 1)}
                  disabled={!item.selected}
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border bg-background text-foreground shadow-xs transition-all hover:bg-accent active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={`${item.name} 수량 증가`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 하단: 소비기한 DatePicker & D-Day 영역 */}
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-accent/40 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-muted-foreground">권장 소비기한</span>
                <DDayBadge dDay={item.dDay} />
              </div>

              {/* 커스텀 데이트피커 컴포넌트 연동 */}
              <div className="w-[150px]">
                <CustomDatePicker
                  value={item.recommendedExpireDate}
                  onChange={(dateStr) => handleDateChange(item.id, dateStr)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. 하단 CTA 버튼 영역 */}
      <div className="border-t pt-3 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 min-h-[48px] rounded-xl border bg-background font-bold text-sm text-muted-foreground hover:bg-accent active:scale-98"
        >
          닫기
        </button>

        <button
          type="button"
          disabled={selectedCount === 0}
          onClick={handleConfirmBatch}
          className="flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-brand-500 font-bold text-sm text-white shadow-soft transition-all hover:bg-brand-600 active:scale-98 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
          <span>선택한 재료 {selectedCount}개 넣기</span>
        </button>
      </div>
    </div>
  );
}
