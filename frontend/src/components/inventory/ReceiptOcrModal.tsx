import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Receipt, Check, Minus, Plus, Sparkles, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';
import type { OcrParsedItem, InventoryItem } from '@/types/inventory';

interface ReceiptOcrModalProps {
  open: boolean;
  onClose: () => void;
  /** 선택된 검수 품목 일괄 등록 콜백 */
  onAddBatch: (newItems: Omit<InventoryItem, 'ingredientId'>[]) => void;
  /** 수동 등록 폼으로 직접 이동 */
  onManualSwitch: () => void;
}

/** 영수증 OCR 인식 결과 초기 모의 품목 데이터 */
const INITIAL_OCR_ITEMS: OcrParsedItem[] = [
  {
    id: 'ocr-1',
    masterIngredientId: 1, // 양파
    name: '양파',
    categoryId: 1,
    quantity: 1,
    unit: '망',
    recommendedExpireDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    dDay: 14,
    selected: true,
  },
  {
    id: 'ocr-2',
    masterIngredientId: 17, // 두부
    name: '두부',
    categoryId: 1,
    quantity: 1,
    unit: '모',
    recommendedExpireDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    dDay: 5,
    selected: true,
  },
  {
    id: 'ocr-3',
    masterIngredientId: 2, // 대파
    name: '대파',
    categoryId: 1,
    quantity: 1,
    unit: '단',
    recommendedExpireDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    dDay: 7,
    selected: true,
  },
  {
    id: 'ocr-4',
    masterIngredientId: 20, // 돼지고기 (삼겹살/목살)
    name: '돼지고기 (삼겹살/목살)',
    categoryId: 2,
    quantity: 400,
    unit: 'g',
    recommendedExpireDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    dDay: 3,
    selected: true,
  },
];

/**
 * 영수증 OCR 스캔 결과 수동 검수 팝업 (INV-01-3)
 * - Google AI Studio Gemini Flash 인식 결과 품목 리스트 검수 모달
 * - 품목 선택 체크박스, 권장 소비기한 D-Day 수정 input, 수량/단위 조절
 * - 인식 실패(빈 배열) 예외 복구 및 수동 전환 안내
 */
export function ReceiptOcrModal({
  open,
  onClose,
  onAddBatch,
  onManualSwitch,
}: ReceiptOcrModalProps) {
  const [items, setItems] = useState<OcrParsedItem[]>(INITIAL_OCR_ITEMS);

  if (!open) return null;

  // 선택된 항목 개수
  const selectedCount = items.filter((i) => i.selected).length;
  const isAllSelected = selectedCount === items.length && items.length > 0;

  // 전체 선택/해제 토글
  const handleToggleAll = () => {
    const nextState = !isAllSelected;
    setItems((prev) => prev.map((item) => ({ ...item, selected: nextState })));
  };

  // 개별 체크박스 토글
  const handleToggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    );
  };

  // 수량 증감
  const handleQuantityChange = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }),
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
      }),
    );
  };

  // 영수증 OCR 실패 시뮬레이션
  const handleSimulateEmpty = () => {
    setItems([]);
    toast.info('영수증 글자를 읽지 못했어요. 직접 재료를 등록해 볼까요? ✍️');
  };

  // 일괄 등록 확정
  const handleConfirmBatch = () => {
    const selectedItems = items.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      toast.error('등록할 식재료를 1개 이상 선택해 주세요.');
      return;
    }

    const newInventoryList: Omit<InventoryItem, 'ingredientId'>[] = selectedItems.map((item) => ({
      masterIngredientId: item.masterIngredientId,
      categoryId: item.categoryId,
      name: item.name,
      storageType: item.categoryId === 2 ? 'REFRIGERATED' : 'REFRIGERATED',
      quantity: item.quantity,
      unit: item.unit,
      expireDate: item.recommendedExpireDate,
      dDay: item.dDay,
      memo: '영수증 OCR 자동인식',
    }));

    onAddBatch(newInventoryList);
    toast.success(`영수증에서 ${selectedItems.length}개 재료를 냉장고에 넣었어요! 🧾`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        {/* 배경 딤 */}
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* 모달 본문 */}
        <motion.div
          className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border bg-card shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <Receipt className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">영수증 OCR 결과 검수</h2>
                <p className="text-xs text-muted-foreground">인식된 재료의 수량과 소비기한을 확인해 주세요.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent text-muted-foreground"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 본문 품목 리스트 영역 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-bold text-foreground">인식된 재료 품목이 없습니다</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  영수증이 흐릿하거나 손상되었을 수 있어요. 직접 추가해 볼까요?
                </p>
                <button
                  type="button"
                  onClick={onManualSwitch}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-soft"
                >
                  직접 재료 등록하기
                </button>
              </div>
            ) : (
              <>
                {/* 전체 선택 바 */}
                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2.5">
                  <button
                    type="button"
                    onClick={handleToggleAll}
                    className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-brand-600"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 text-brand-500" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>전체 선택 ({selectedCount}/{items.length}개)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateEmpty}
                    className="text-[11px] text-muted-foreground hover:underline"
                  >
                    (미인식 빈배열 테스트)
                  </button>
                </div>

                {/* 품목 카드 리스트 */}
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-3.5 transition-all ${
                      item.selected
                        ? 'border-brand-300 bg-card shadow-xs'
                        : 'border-border/60 bg-muted/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* 체크박스 & 품목명 */}
                      <button
                        type="button"
                        onClick={() => handleToggleItem(item.id)}
                        className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                      >
                        {item.selected ? (
                          <CheckSquare className="h-4 w-4 shrink-0 text-brand-500" />
                        ) : (
                          <Square className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="truncate">
                          <span className="text-sm font-bold text-foreground block truncate">{item.name}</span>
                          <span className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-300">
                            <Sparkles className="h-3 w-3" />
                            표준 매핑 완료
                          </span>
                        </div>
                      </button>

                      {/* 수량 조절 버튼 */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          disabled={!item.selected || item.quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border bg-background text-foreground hover:bg-accent disabled:opacity-30"
                          aria-label="수량 감소"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[40px] text-center text-xs font-bold tabular-nums">
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          disabled={!item.selected}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border bg-background text-foreground hover:bg-accent disabled:opacity-30"
                          aria-label="수량 증가"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 권장 소비기한 수정 input */}
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-accent/40 px-3 py-2 text-xs">
                      <span className="text-muted-foreground font-medium">권장 소비기한 (D-Day)</span>
                      <input
                        type="date"
                        disabled={!item.selected}
                        value={item.recommendedExpireDate}
                        onChange={(e) => handleDateChange(item.id, e.target.value)}
                        className="rounded-lg border bg-background px-2 py-1 text-xs font-semibold focus:border-brand-500 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* 푸터 액션 바 */}
          <div className="border-t bg-card px-6 py-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] rounded-xl border bg-background font-bold text-sm text-muted-foreground hover:bg-accent active:scale-95"
            >
              닫기
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleConfirmBatch}
              className="flex-1 min-h-[46px] flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 font-bold text-sm text-white shadow-soft transition-all hover:bg-brand-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              <span>선택한 {selectedCount}개 재료 넣기</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
