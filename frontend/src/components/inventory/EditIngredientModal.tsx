import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, AlertTriangle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { STORAGE_LABEL } from '@/utils/dday';
import { cn } from '@/utils/cn';
import { useBodyScrollLock } from '@/hooks';
import type { InventoryItem, StorageType } from '@/types/inventory';

interface EditIngredientModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  /** 수정 완료 콜백 */
  onSave: (updatedItem: InventoryItem) => void;
}

const STORAGE_OPTIONS: StorageType[] = ['REFRIGERATED', 'FROZEN', 'ROOM_TEMP'];

/**
 * 개별 식재료 인스턴스 수정 모달 (INV-03-1)
 * - 특정 개별 레코드의 수량, 소비기한, 보관장소, 메모 수정 가능
 * - 표준 식재료 및 단위는 요리 차감 호환을 위해 고정
 */
export function EditIngredientModal({ item, onClose, onSave }: EditIngredientModalProps) {
  useBodyScrollLock(!!item);

  if (!item) return null;

  const [quantity, setQuantity] = useState<number>(item.quantity);
  const [storageType, setStorageType] = useState<StorageType>(item.storageType);
  const [expireDate, setExpireDate] = useState<string>(item.expireDate);
  const [memo, setMemo] = useState<string>(item.memo ?? '');

  const isInvalidQuantity = quantity <= 0;

  // 빠른 소비기한 세팅 핸들러
  const handleQuickExpire = (days: number) => {
    setExpireDate(format(addDays(new Date(), days), 'yyyy-MM-dd'));
  };

  // 실시간 D-Day 계산
  const currentDDay = (() => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(expireDate);
      targetDate.setHours(0, 0, 0, 0);
      return Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalidQuantity) return;

    onSave({
      ...item,
      quantity,
      unit: item.unit,
      storageType,
      expireDate,
      dDay: currentDDay,
      memo: memo.trim() || undefined,
    });

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
          className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl border bg-card p-4 sm:p-6 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">재료 정보 수정</h2>
              <p className="text-xs text-muted-foreground break-keep">보관 장소, 수량, 소비기한을 수정할 수 있어요.</p>
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

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* 표준 재료명 (고정 읽기 전용) */}
            <div className="rounded-xl bg-muted/50 p-3">
              <span className="text-[11px] font-bold text-muted-foreground block">재료명 (수정 불가)</span>
              <span className="text-base font-extrabold text-foreground">{item.name}</span>
            </div>

            {/* 보관 장소 세그먼트 */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">보관 장소</label>
              <div className="grid grid-cols-3 gap-2">
                {STORAGE_OPTIONS.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setStorageType(type)}
                    className={cn(
                      'min-h-[44px] rounded-xl border text-xs font-bold transition-all active:scale-95',
                      storageType === type
                        ? 'border-brand-500 bg-brand-500 text-white shadow-soft'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent',
                    )}
                  >
                    {STORAGE_LABEL[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 수량 및 식재료 고정 단위 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="edit-quantity-input" className="text-xs font-bold text-muted-foreground">
                  수량 <span className="text-brand-500">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  보유 단위: <strong className="text-foreground">{item.unit}</strong> (고정)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-background text-foreground transition-all hover:bg-accent active:scale-95 disabled:opacity-40"
                  aria-label="1개 감소"
                >
                  <span className="text-base font-bold">−</span>
                </button>
                <div className="relative flex-1">
                  <input
                    id="edit-quantity-input"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border bg-background px-3 pr-16 text-center text-base font-bold tabular-nums text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                    <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground border border-border/50">
                      {item.unit}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-background text-foreground transition-all hover:bg-accent active:scale-95"
                  aria-label="1개 증가"
                >
                  <span className="text-base font-bold">+</span>
                </button>
              </div>
            </div>

            {isInvalidQuantity && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>0개는 입력할 수 없습니다. 삭제를 원하시면 [삭제]를 이용해 주세요.</span>
              </div>
            )}

            {/* 4. 소비기한 DatePicker (모던 커스텀 데이트피커 & 슬림 프리셋 칩) */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                소비기한 <span className="text-brand-500">*</span>
              </label>

              {/* 커스텀 브랜드 캘린더 데이트피커 (인라인 확장형) */}
              <CustomDatePicker
                value={expireDate}
                onChange={(dateStr) => setExpireDate(dateStr)}
                inline
              />

              {/* D-Day 빠른 설정 프리셋 칩 (1줄 슬림화) */}
              <div className="mt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {[
                  { label: '+3일', days: 3 },
                  { label: '+7일', days: 7 },
                  { label: '+14일', days: 14 },
                  { label: '+30일', days: 30 },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => handleQuickExpire(preset.days)}
                    className="shrink-0 rounded-full bg-muted hover:bg-accent border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 메모 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="edit-memo-input" className="text-xs font-bold text-muted-foreground">
                  메모 / 별칭
                </label>
                <span className="text-[11px] text-muted-foreground tabular-nums">{memo.length}/30자</span>
              </div>
              <input
                id="edit-memo-input"
                type="text"
                maxLength={30}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 소분 냉동, 편의점 1+1"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* 액션 버튼 (바닥 여유 공간 pb-2 적용) */}
            <div className="flex gap-2 pt-2 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[46px] rounded-xl border bg-background font-bold text-sm text-muted-foreground hover:bg-accent active:scale-95"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isInvalidQuantity}
                className="flex-1 min-h-[46px] flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 font-bold text-sm text-white shadow-soft transition-all hover:bg-brand-600 active:scale-95 disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
                <span>수정 완료</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
