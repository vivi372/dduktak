import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Sparkles } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { IngredientCombobox } from './IngredientCombobox';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { STORAGE_LABEL } from '@/utils/dday';
import { cn } from '@/utils/cn';
import { useBodyScrollLock } from '@/hooks';
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

/**
 * 표준 식재료 수동 등록 모달 (INV-01-1)
 * - 74종 마스터 식재료 검색 Combobox 연동
 * - 마스터 선택 시 권장 소비기한 및 기본 보관장소 자동 세팅
 * - 식재료별 표준 단위 고정 (요리 차감 호환 보장)
 * - 수량(numeric), 보관장소 라디오, 퀵 프리셋 DatePicker, 30자 메모 입력
 */
export function ManualAddModal({ open, onClose, onAdd, initialMaster }: ManualAddModalProps) {
  useBodyScrollLock(open);

  const [selectedMaster, setSelectedMaster] = useState<MasterIngredient | null>(initialMaster ?? null);
  const [storageType, setStorageType] = useState<StorageType>(initialMaster?.defaultStorageType ?? 'REFRIGERATED');
  const [quantity, setQuantity] = useState<number>(1);
  const [expireDate, setExpireDate] = useState<string>(
    format(addDays(new Date(), initialMaster?.defaultShelfDays ?? 7), 'yyyy-MM-dd'),
  );
  const [memo, setMemo] = useState<string>('');

  // 모달이 열릴 때 이전 상태 오염 방지 및 초기화 (EDGE-01)
  useEffect(() => {
    if (open) {
      setSelectedMaster(initialMaster ?? null);
      setStorageType(initialMaster?.defaultStorageType ?? 'REFRIGERATED');
      setQuantity(1);
      setExpireDate(format(addDays(new Date(), initialMaster?.defaultShelfDays ?? 7), 'yyyy-MM-dd'));
      setMemo('');
    }
  }, [open, initialMaster]);

  // 마스터 식재료 선택 시 스마트 기본값 자동 세팅
  const handleSelectMaster = (master: MasterIngredient) => {
    setSelectedMaster(master);
    setStorageType(master.defaultStorageType ?? 'REFRIGERATED');
    setExpireDate(format(addDays(new Date(), master.defaultShelfDays), 'yyyy-MM-dd'));
  };

  // 빠른 소비기한 세팅 핸들러
  const handleQuickExpire = (days: number) => {
    setExpireDate(format(addDays(new Date(), days), 'yyyy-MM-dd'));
  };

  // 실시간 D-Day 계산
  const currentDDay = (() => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(expireDate);
      target.setHours(0, 0, 0, 0);
      return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaster) return;

    onAdd({
      masterIngredientId: selectedMaster.masterIngredientId,
      categoryId: selectedMaster.categoryId,
      name: selectedMaster.name,
      storageType,
      quantity,
      unit: selectedMaster.defaultUnit,
      expireDate,
      dDay: currentDDay,
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
          className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl border bg-card p-4 sm:p-6 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">재료 직접 넣기</h2>
              <p className="text-xs text-muted-foreground break-keep">식재료를 검색하여 손쉽게 등록해 보세요.</p>
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
                식재료 <span className="text-brand-500">*</span>
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

            {/* 3. 수량 및 식재료 고정 단위 (요리 차감 호환을 위해 단위 고정) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="quantity-input" className="text-xs font-bold text-muted-foreground">
                  수량 <span className="text-brand-500">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  기본 단위: <strong className="text-foreground">{selectedMaster?.defaultUnit ?? '개'}</strong>
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
                    id="quantity-input"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="h-11 w-full rounded-xl border bg-background px-3 pr-16 text-center text-base font-bold tabular-nums text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                    <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground border border-border/50">
                      {selectedMaster?.defaultUnit ?? '개'}
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

            {/* 4. 소비기한 DatePicker (모던 커스텀 데이트피커 & 슬림 프리셋 칩) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-muted-foreground">
                  소비기한 <span className="text-brand-500">*</span>
                </label>
                {selectedMaster && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-300">
                    <Sparkles className="h-3 w-3" />
                    권장 +{selectedMaster.defaultShelfDays}일
                  </span>
                )}
              </div>

              {/* 커스텀 브랜드 캘린더 데이트피커 (인라인 확장 모드로 아래 요소를 자연스럽게 밀어냄) */}
              <CustomDatePicker
                value={expireDate}
                onChange={(dateStr) => setExpireDate(dateStr)}
                inline
              />

              {/* D-Day 빠른 설정 프리셋 칩 (1줄 슬림화) */}
              <div className="mt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {selectedMaster && (
                  <button
                    type="button"
                    onClick={() => handleQuickExpire(selectedMaster.defaultShelfDays)}
                    className="shrink-0 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-2.5 py-1 text-[11px] font-bold text-brand-600 dark:text-brand-300 hover:bg-brand-100 transition-colors"
                  >
                    권장 (+{selectedMaster.defaultShelfDays}일)
                  </button>
                )}
                {[
                  { label: '+3일', days: 3 },
                  { label: '+7일', days: 7 },
                  { label: '+14일', days: 14 },
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

            {/* 하단 액션 버튼 (바닥 여유 공간 pb-2 적용) */}
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
