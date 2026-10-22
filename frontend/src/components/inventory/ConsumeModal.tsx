import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, Utensils, X, AlertTriangle } from 'lucide-react';
import { STORAGE_LABEL } from '@/utils/dday';
import type { InventoryItem } from '@/types/inventory';

interface ConsumeModalProps {
  /** 소비 대상 인벤토리 레코드 */
  item: InventoryItem | null;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 소비 확정 콜백 (차감 수량 전달) */
  onConfirm: (item: InventoryItem, consumeQuantity: number) => void;
}

/**
 * 식재료 수동 소비 차감 팝업 (Consume Modal)
 * - 보유 수량 초과 차감 원천 방지 (06_UI_UX_GUIDELINES 4.7절)
 * - max={quantity} 속성 및 실시간 유효성 검증 적용
 * - 초과 입력 시 제출 버튼 비활성화 및 경고 문구 안내
 */
export function ConsumeModal({ item, onClose, onConfirm }: ConsumeModalProps) {
  if (!item) return null;

  // 기본 차감 수량은 1 또는 보유 수량
  const [quantity, setQuantity] = useState<number>(1);

  // 유효성 검사: 0 이하이거나 보유 수량 초과 여부
  const isOverQuantity = quantity > item.quantity;
  const isInvalid = quantity <= 0 || isOverQuantity;

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAll = () => {
    setQuantity(item.quantity);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) return;
    onConfirm(item, quantity);
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
          className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border bg-card p-6 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <Utensils className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold">재료 소비 완료</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent text-muted-foreground"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* 대상 재료 정보 */}
            <div className="rounded-2xl bg-muted/50 p-3.5 text-sm">
              <div className="flex items-center justify-between font-semibold">
                <span>{item.name}</span>
                <span className="text-xs text-muted-foreground">{STORAGE_LABEL[item.storageType]}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>현재 보유 수량</span>
                <span className="font-bold text-foreground">
                  {item.quantity} {item.unit}
                </span>
              </div>
              {item.memo && <p className="mt-1 text-xs text-brand-600 dark:text-brand-300">"{item.memo}"</p>}
            </div>

            {/* 소비 수량 조절 인터랙션 */}
            <div>
              <label htmlFor="consume-quantity-input" className="block text-xs font-semibold text-muted-foreground mb-2">
                소비할 수량을 입력하세요
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecrease}
                  disabled={quantity <= 1}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-background text-foreground transition-all hover:bg-accent active:scale-95 disabled:opacity-40"
                  aria-label="1개 감소"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <div className="relative flex-1">
                  <input
                    id="consume-quantity-input"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={item.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border bg-background px-3 text-center text-lg font-bold tabular-nums focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {item.unit}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleIncrease}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-background text-foreground transition-all hover:bg-accent active:scale-95"
                  aria-label="1개 증가"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* 전체 소비 숏컷 버튼 */}
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAll}
                  className="text-xs font-bold text-brand-600 hover:underline dark:text-brand-400"
                >
                  전체 소비 ({item.quantity} {item.unit})
                </button>
              </div>

              {/* 보유 수량 초과 경고 피드백 */}
              {isOverQuantity && (
                <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-destructive/10 p-2.5 text-xs font-semibold text-destructive animate-in fade-in-0">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>현재 보유 수량({item.quantity} {item.unit}) 이하로 입력해 주세요.</span>
                </div>
              )}
            </div>

            {/* 하단 액션 버튼 */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[44px] rounded-xl border bg-background font-bold text-sm text-muted-foreground hover:bg-accent active:scale-95"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isInvalid}
                className="flex-1 min-h-[44px] rounded-xl bg-brand-500 font-bold text-sm text-white shadow-soft transition-all hover:bg-brand-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                소비 완료
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
