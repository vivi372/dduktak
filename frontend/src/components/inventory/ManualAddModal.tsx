import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Calendar, Sparkles } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { IngredientCombobox } from './IngredientCombobox';
import { STORAGE_LABEL } from '@/utils/dday';
import { cn } from '@/utils/cn';
import type { MasterIngredient, StorageType, InventoryItem } from '@/types/inventory';

interface ManualAddModalProps {
  open: boolean;
  onClose: () => void;
  /** 신규 등록 완료 콜백 */
  onAdd: (newItem: Omit<InventoryItem, 'ingredientId'>) => void;
  /** 바코드 등에서 프리필할 초기 식재료 (선택) */
  initialMaster?: MasterIngredient | null;
}

const STORAGE_OPTIONS: StorageType[] = ['REFRIGERATED', 'FROZEN', 'ROOM_TEMP'];
const COMMON_UNITS = ['개', 'g', 'ml', '팩', '모', '봉지', '뿌리', '통', '장'];

/**
 * 표준 식재료 수동 등록 모달 (INV-01-1)
 * - 74종 마스터 식재료 검색 Combobox 연동
 * - 마스터 선택 시 권장 소비기한 및 기본 보관장소 자동 세팅
 * - 수량(numeric), 보관장소 라디오, 소비기한 DatePicker, 30자 메모 입력
 */
export function ManualAddModal({ open, onClose, onAdd, initialMaster }: ManualAddModalProps) {
  const [selectedMaster, setSelectedMaster] = useState<MasterIngredient | null>(initialMaster ?? null);
  const [storageType, setStorageType] = useState<StorageType>(initialMaster?.defaultStorageType ?? 'REFRIGERATED');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>(initialMaster?.defaultUnit ?? '개');
  const [expireDate, setExpireDate] = useState<string>(
    format(addDays(new Date(), initialMaster?.defaultShelfDays ?? 7), 'yyyy-MM-dd'),
  );
  const [memo, setMemo] = useState<string>('');

  // 마스터 식재료 선택 시 스마트 기본값 자동 세팅
  const handleSelectMaster = (master: MasterIngredient) => {
    setSelectedMaster(master);
    setStorageType(master.defaultStorageType);
    setUnit(master.defaultUnit);
    setExpireDate(format(addDays(new Date(), master.defaultShelfDays), 'yyyy-MM-dd'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaster) return;

    // dDay 계산 (현재 날짜 기준)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(expireDate);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const dDay = Math.round(diffTime / (1000 * 60 * 60 * 24));

    onAdd({
      masterIngredientId: selectedMaster.masterIngredientId,
      categoryId: selectedMaster.categoryId,
      name: selectedMaster.name,
      storageType,
      quantity,
      unit,
      expireDate,
      dDay,
      memo: memo.trim() || undefined,
    });

    onClose();
  };

  if (!open) return null;

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

        {/* 모달 창 */}
        <motion.div
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border bg-card p-6 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">재료 직접 넣기</h2>
              <p className="text-xs text-muted-foreground">표준 식재료를 검색하여 손쉽게 등록해 보세요.</p>
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
            {/* 1. 표준 식재료 선택 Combobox */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                표준 식재료 <span className="text-brand-500">*</span>
              </label>
              <IngredientCombobox
                value={selectedMaster?.masterIngredientId}
                onChange={handleSelectMaster}
              />
            </div>

            {/* 2. 보관 장소 세그먼트 (라디오 버튼) */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                보관 장소 <span className="text-brand-500">*</span>
              </label>
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

            {/* 3. 수량 및 단위 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="quantity-input" className="block text-xs font-bold text-muted-foreground mb-1.5">
                  수량 <span className="text-brand-500">*</span>
                </label>
                <input
                  id="quantity-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm font-bold text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label htmlFor="unit-select" className="block text-xs font-bold text-muted-foreground mb-1.5">
                  단위
                </label>
                <select
                  id="unit-select"
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

            {/* 4. 소비기한 DatePicker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="expire-date-input" className="text-xs font-bold text-muted-foreground">
                  소비기한 <span className="text-brand-500">*</span>
                </label>
                {selectedMaster && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-300">
                    <Sparkles className="h-3 w-3" />
                    권장 +{selectedMaster.defaultShelfDays}일 자동 반영
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="expire-date-input"
                  type="date"
                  required
                  value={expireDate}
                  onChange={(e) => setExpireDate(e.target.value)}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm font-semibold text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* 5. 표시용 메모/별칭 (최대 30자) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="memo-input" className="text-xs font-bold text-muted-foreground">
                  메모 / 별칭 (선택)
                </label>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {memo.length}/30자
                </span>
              </div>
              <input
                id="memo-input"
                type="text"
                maxLength={30}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 편의점 1+1, 엄마가 준 김치"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* 하단 액션 버튼 */}
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
                disabled={!selectedMaster}
                className="flex-1 min-h-[46px] flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 font-bold text-sm text-white shadow-soft transition-all hover:bg-brand-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                <span>냉장고에 넣기</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
