import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, Calendar, AlertTriangle } from 'lucide-react';
import { STORAGE_LABEL } from '@/utils/dday';
import { cn } from '@/utils/cn';
import type { InventoryItem, StorageType } from '@/types/inventory';

interface EditIngredientModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  /** 수정 완료 콜백 */
  onSave: (updatedItem: InventoryItem) => void;
}

const STORAGE_OPTIONS: StorageType[] = ['REFRIGERATED', 'FROZEN', 'ROOM_TEMP'];
const COMMON_UNITS = ['개', 'g', 'ml', '팩', '모', '봉지', '뿌리', '통', '장'];

/**
 * 개별 식재료 인스턴스 수정 모달 (INV-03-1)
 * - 특정 개별 레코드의 수량, 단위, 소비기한, 보관장소, 메모 수정 가능
 * - 표준 식재료 자체는 변경 불가
 */
export function EditIngredientModal({ item, onClose, onSave }: EditIngredientModalProps) {
  if (!item) return null;

  const [quantity, setQuantity] = useState<number>(item.quantity);
  const [unit, setUnit] = useState<string>(item.unit);
  const [storageType, setStorageType] = useState<StorageType>(item.storageType);
  const [expireDate, setExpireDate] = useState<string>(item.expireDate);
  const [memo, setMemo] = useState<string>(item.memo ?? '');

  const isInvalidQuantity = quantity <= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalidQuantity) return;

    // dDay 재계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(expireDate);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const dDay = Math.round(diffTime / (1000 * 60 * 60 * 24));

    onSave({
      ...item,
      quantity,
      unit,
      storageType,
      expireDate,
      dDay,
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
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border bg-card p-6 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">재료 정보 수정</h2>
              <p className="text-xs text-muted-foreground">보관 장소, 수량, 소비기한을 수정할 수 있어요.</p>
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

            {/* 수량 및 단위 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-quantity-input" className="block text-xs font-bold text-muted-foreground mb-1.5">
                  수량
                </label>
                <input
                  id="edit-quantity-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm font-bold text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label htmlFor="edit-unit-select" className="block text-xs font-bold text-muted-foreground mb-1.5">
                  단위
                </label>
                <select
                  id="edit-unit-select"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm font-semibold text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isInvalidQuantity && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>0개는 입력할 수 없습니다. 삭제를 원하시면 [삭제]를 이용해 주세요.</span>
              </div>
            )}

            {/* 소비기한 */}
            <div>
              <label htmlFor="edit-expire-date-input" className="block text-xs font-bold text-muted-foreground mb-1.5">
                소비기한
              </label>
              <div className="relative">
                <input
                  id="edit-expire-date-input"
                  type="date"
                  required
                  value={expireDate}
                  onChange={(e) => setExpireDate(e.target.value)}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm font-semibold text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

            {/* 액션 버튼 */}
            <div className="flex gap-2 pt-2">
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
