import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  ChefHat,
  Sparkles,
  BookmarkCheck,
  ArrowRight,
  ArrowLeft,
  Pencil,
  Minus,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { useBodyScrollLock } from '@/hooks';
import { calculateFifoDeductionItems } from '@/mocks/matching.mock';
import type { RecipeDetail } from '@/types/recipe';
import type { FifoDeductionItem } from '@/types/matching';
import { cn } from '@/utils/cn';

interface CookConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  recipe: RecipeDetail;
  /** 요리 확정 콜백 (냉장고 차감 여부, 인분 전달) */
  onConfirmCook: (deductInventory: boolean, servings: number) => void;
  /** 기본 선택 인분 (상세 화면에서 계산된 인분 연동) */
  initialServings?: number;
}

/**
 * [이 레시피로 요리하기] 2차 확인 차감 팝업 (2-Step Modal)
 * - REC-03-1 및 06_UI_UX_GUIDELINES 4.7절 완벽 구현
 * - 1단계: [재료 자동으로 차감하고 요리하기] vs [차감 없이 완료 기록만 하기] 2-Way 분기
 * - 2단계: 선입선출(FIFO) 차감 예정 검수 (인분 조절, 수량 미세 직접 변경 ✏️, 양념류 자동 제외 배지, 부분 차감 안내)
 */
export function CookConfirmationModal({
  open,
  onClose,
  recipe,
  onConfirmCook,
  initialServings = 1,
}: CookConfirmationModalProps) {
  useBodyScrollLock(open);

  // 단계 상태: 1 = 모드 선택, 2 = FIFO 차감 상세 검수
  const [step, setStep] = useState<1 | 2>(1);
  // 요리 차감 옵션: AUTO(자동 차감) | RECORD_ONLY(기록만)
  const [deductOption, setDeductOption] = useState<'AUTO' | 'RECORD_ONLY'>('AUTO');
  // 인분 수량
  const [servings, setServings] = useState<number>(initialServings);
  // 유저가 직접 수정한 수량 맵 (masterIngredientId -> 수량)
  const [customQuantities, setCustomQuantities] = useState<Record<number, number>>({});
  // 현재 수량 편집 중인 식재료 ID
  const [editingId, setEditingId] = useState<number | null>(null);

  // 인분 또는 레시피 변경 시 기본 FIFO 차감 목록 계산
  const baseDeductions = useMemo(() => {
    return calculateFifoDeductionItems(recipe, servings);
  }, [recipe, servings]);

  // 유저 미세 수정값이 반영된 최종 차감 목록
  const deductionItems = useMemo<FifoDeductionItem[]>(() => {
    return baseDeductions.map((item) => {
      if (item.isSauceExcluded) return item;
      const customQty = customQuantities[item.masterIngredientId];
      if (customQty !== undefined) {
        const clampedDeduct = Math.min(item.currentStock, Math.max(0, customQty));
        return {
          ...item,
          toDeductQuantity: clampedDeduct,
          remainingStock: Math.max(0, Number((item.currentStock - clampedDeduct).toFixed(1))),
        };
      }
      return item;
    });
  }, [baseDeductions, customQuantities]);

  if (!open) return null;

  // 1단계 제출 핸들러
  const handleStep1Submit = () => {
    if (deductOption === 'RECORD_ONLY') {
      onConfirmCook(false, servings);
      onClose();
      resetState();
    } else {
      setStep(2);
    }
  };

  // 2단계 최종 확정 핸들러
  const handleFinalConfirm = () => {
    onConfirmCook(true, servings);
    onClose();
    resetState();
  };

  const resetState = () => {
    setStep(1);
    setDeductOption('AUTO');
    setCustomQuantities({});
    setEditingId(null);
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cook-modal-title"
      >
        {/* 배경 딤 */}
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        />

        {/* 모달 컨테이너 */}
        <motion.div
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl dark:border-white/10"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          {/* 상단 닫기 버튼 */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="닫기"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>

          {/* ======================= STEP 1: 옵션 선택 ======================= */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                  <ChefHat className="h-6 w-6" />
                </div>
                <div>
                  <h2 id="cook-modal-title" className="text-lg font-black tracking-tight text-foreground">
                    이 레시피로 요리하기 🍳
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    [{recipe.title}] 요리 완료 방식을 선택해 주세요.
                  </p>
                </div>
              </div>

              {/* 2-Way 옵션 선택 카드 */}
              <div className="space-y-3 pt-1">
                {/* 옵션 A: 재료 자동으로 차감하고 요리하기 (추천) */}
                <div
                  onClick={() => setDeductOption('AUTO')}
                  className={cn(
                    'group relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-all active:scale-[0.99]',
                    deductOption === 'AUTO'
                      ? 'border-mint-500 bg-mint-50/70 shadow-soft dark:bg-mint-950/25 dark:border-mint-600'
                      : 'border-border/80 bg-background hover:border-mint-300 dark:border-white/10',
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      deductOption === 'AUTO'
                        ? 'border-mint-500 bg-mint-500 text-white'
                        : 'border-muted-foreground/40',
                    )}
                  >
                    {deductOption === 'AUTO' && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-foreground">
                        재료 자동으로 차감하고 요리하기
                      </span>
                      <span className="rounded-full bg-mint-500 px-2 py-0.5 text-[10px] font-black text-white">
                        추천
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      내 냉장고에서 소비기한이 가장 임박한 재료부터 선입선출(FIFO)로 자동 차감해요.
                    </p>
                  </div>
                </div>

                {/* 옵션 B: 차감 없이 요리 완료 기록만 하기 */}
                <div
                  onClick={() => setDeductOption('RECORD_ONLY')}
                  className={cn(
                    'group relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-all active:scale-[0.99]',
                    deductOption === 'RECORD_ONLY'
                      ? 'border-brand-500 bg-brand-50/70 shadow-soft dark:bg-brand-950/25 dark:border-brand-600'
                      : 'border-border/80 bg-background hover:border-brand-300 dark:border-white/10',
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      deductOption === 'RECORD_ONLY'
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-muted-foreground/40',
                    )}
                  >
                    {deductOption === 'RECORD_ONLY' && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-foreground">
                        차감 없이 요리 완료 기록만 하기
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        기록 전용
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      냉장고 재료는 그대로 유지하고 나의 요리 완료 횟수만 +1 기록해요.
                    </p>
                  </div>
                </div>
              </div>

              {/* 하단 진행 버튼 */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="min-h-[48px] w-1/3 rounded-xl border border-border bg-background text-sm font-bold text-muted-foreground hover:bg-accent active:scale-95 transition-all"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleStep1Submit}
                  className={cn(
                    'flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl font-black text-sm text-white shadow-soft active:scale-[0.98] transition-all',
                    deductOption === 'AUTO'
                      ? 'bg-mint-500 hover:bg-mint-600'
                      : 'bg-brand-500 hover:bg-brand-600',
                  )}
                >
                  {deductOption === 'AUTO' ? (
                    <>
                      <span>차감 내역 확인하기</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <BookmarkCheck className="h-4 w-4" />
                      <span>요리 완료 기록하기</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ======================= STEP 2: FIFO 차감 검수 ======================= */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-1.5">
                    <span>냉장고 재료 차감 검수</span>
                    <span className="text-xs font-bold text-mint-600 dark:text-mint-400 bg-mint-50 dark:bg-mint-950/40 px-2 py-0.5 rounded-full">
                      선입선출(FIFO)
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ✏️ 수량을 터치하여 직접 변경할 수 있어요
                  </p>
                </div>

                {/* 인분 수 조절 스텝퍼 */}
                <div className="flex items-center gap-1 rounded-xl border bg-muted/40 p-1">
                  <button
                    type="button"
                    onClick={() => setServings((prev) => Math.max(1, prev - 1))}
                    disabled={servings <= 1}
                    aria-label="인분 감소"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground hover:bg-card disabled:opacity-30 active:scale-90"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="min-w-8 text-center text-xs font-black text-foreground">
                    {servings}인분
                  </span>
                  <button
                    type="button"
                    onClick={() => setServings((prev) => prev + 1)}
                    disabled={servings >= 10}
                    aria-label="인분 증가"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground hover:bg-card disabled:opacity-30 active:scale-90"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* 차감 예정 리스트 (스크롤 지원) */}
              <div className="max-h-[340px] overflow-y-auto pr-1 space-y-2.5">
                {deductionItems.map((item) => {
                  const isEditing = editingId === item.masterIngredientId;

                  return (
                    <div
                      key={item.masterIngredientId}
                      className={cn(
                        'rounded-2xl border p-3 text-xs transition-colors',
                        item.isSauceExcluded
                          ? 'border-dashed border-border/80 bg-muted/20 opacity-80'
                          : 'border-border/80 bg-card hover:border-mint-300 dark:border-white/10',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-foreground">
                            {item.name}
                          </span>
                          {item.isSauceExcluded ? (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              양념 · 수량차감 제외
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              (보유: {item.currentStock}{item.unit})
                            </span>
                          )}
                        </div>

                        {/* 차감 수량 컨트롤 */}
                        {!item.isSauceExcluded && (
                          <div className="flex items-center gap-1.5">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={item.currentStock}
                                  step="0.5"
                                  autoFocus
                                  value={item.toDeductQuantity}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setCustomQuantities((prev) => ({
                                      ...prev,
                                      [item.masterIngredientId]: val,
                                    }));
                                  }}
                                  onBlur={() => setEditingId(null)}
                                  className="w-16 h-8 rounded-lg border border-mint-500 bg-background px-2 text-center text-xs font-bold focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="h-8 px-2 rounded-lg bg-mint-500 text-white font-bold text-[11px]"
                                >
                                  완료
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingId(item.masterIngredientId)}
                                className="flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2 py-1 text-xs font-bold text-foreground hover:bg-accent active:scale-95"
                              >
                                <span className="font-extrabold text-brand-600 dark:text-brand-300">
                                  -{item.toDeductQuantity} {item.unit}
                                </span>
                                <Pencil className="h-3 w-3 text-muted-foreground" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 하단 잔여량 및 경고 라벨 */}
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                        {item.isSauceExcluded ? (
                          <span>조미료/양념은 냉장고 수량을 차감하지 않습니다.</span>
                        ) : (
                          <>
                            <span>
                              차감 후 잔여:{' '}
                              <strong className="text-foreground font-bold">
                                {item.remainingStock} {item.unit}
                              </strong>
                            </span>
                            {item.isPartial && (
                              <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-bold">
                                <AlertCircle className="h-3 w-3" />
                                <span>보유분 전량 차감</span>
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 하단 액션 버튼 */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-4 text-sm font-bold text-muted-foreground hover:bg-accent active:scale-95 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>이전</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-mint-500 font-black text-sm text-white shadow-soft hover:bg-mint-600 active:scale-[0.98] transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>냉장고 차감하고 요리 완료 🎉</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
