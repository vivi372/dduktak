import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import {
  ReceiptImagePicker,
  ReceiptScanningProgress,
  ReceiptItemReview,
  ReceiptFailSafeView,
} from './receipt';
import type { OcrParsedItemWithRaw, InventoryItem } from '@/types/inventory';
import { useBodyScrollLock } from '@/hooks';
import { useScanReceiptOcr } from '@/hooks/useInventory';

export type ReceiptOcrStep = 'UPLOAD' | 'SCANNING' | 'REVIEW' | 'FAIL_SAFE';

const EMPTY_INITIAL_ITEMS: OcrParsedItemWithRaw[] = [];

export interface ReceiptOcrModalProps {
  open: boolean;
  onClose: () => void;
  /** 선택된 검수 품목 일괄 등록 콜백 */
  onAddBatch: (newItems: Omit<InventoryItem, 'ingredientId'>[]) => void;
  /** 수동 등록 폼으로 직접 이동 */
  onManualSwitch: () => void;
  /** 테스트/개발용: 초기 스텝 강제 지정 (기본값: 'UPLOAD') */
  initialStep?: ReceiptOcrStep;
  /** 테스트/개발용: 초기 품목 목록 */
  initialItems?: OcrParsedItemWithRaw[];
}

/**
 * 영수증 OCR 스캔 및 수동 검수 통합 모달 (INV-01-3)
 * - Step 1: UPLOAD (모바일 카메라/갤러리 액션시트 vs PC 드래그앤드롭 + 실시간 미리보기)
 * - Step 2: SCANNING (프로그레스 바 0~100% + Gemini Flash OCR API POST /api/v1/inventory/scan-ocr 연동)
 * - Step 3: REVIEW (수동 검수 모달: 체크박스, 표준 매핑 배지, 수량, CustomDatePicker)
 * - Step 4: FAIL_SAFE (인식 실패 또는 빈 배열 수신 시 수동 등록 Combobox 화면 리다이렉트)
 */
export function ReceiptOcrModal({
  open,
  onClose,
  onAddBatch,
  onManualSwitch,
  initialStep = 'UPLOAD',
  initialItems = EMPTY_INITIAL_ITEMS,
}: ReceiptOcrModalProps) {
  useBodyScrollLock(open);

  const [step, setStep] = useState<ReceiptOcrStep>(initialStep);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrItems, setOcrItems] = useState<OcrParsedItemWithRaw[]>(initialItems);

  // 실제 Gemini Flash OCR API 뮤테이션 훅
  const scanOcrMutation = useScanReceiptOcr();

  const prevOpenRef = useRef(false);
  const initialItemsRef = useRef(initialItems);
  initialItemsRef.current = initialItems;

  // 모달이 닫혀있다가 새로 열릴 때만 상태를 초기화하여 무한 렌더링 방지
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setStep(initialStep);
      setPreviewUrl(null);
      setOcrItems(initialItemsRef.current);
    }
    prevOpenRef.current = open;
  }, [open, initialStep]);

  if (!open) return null;

  /** 날짜 기준 D-Day 간이 연산 */
  const calculateDDay = (expireDateStr: string): number => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(expireDateStr);
      target.setHours(0, 0, 0, 0);
      return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return 7;
    }
  };

  // 1. 이미지 파일 선택 완료 -> 실제 API 호출 및 스캔 로딩 단계로 전이
  const handleSelectImage = async (file: File | null, url: string) => {
    setPreviewUrl(url);
    setStep('SCANNING');

    if (file) {
      try {
        const responseItems = await scanOcrMutation.mutateAsync(file);
        if (responseItems && responseItems.length > 0) {
          const mappedItems: OcrParsedItemWithRaw[] = responseItems.map((item, idx) => ({
            id: `ocr-${Date.now()}-${idx}`,
            masterIngredientId: item.masterIngredientId,
            name: item.name,
            rawName: item.name,
            rawText: item.name,
            confidence: 0.95,
            categoryId: 1,
            categoryName: '식재료',
            quantity: item.quantity || 1,
            unit: item.unit || '개',
            recommendedExpireDate: item.recommendedExpireDate,
            dDay: calculateDDay(item.recommendedExpireDate),
            selected: true,
          }));
          setOcrItems(mappedItems);
          setStep('REVIEW');
        } else {
          // 백엔드가 빈 배열(data: [])을 반환한 경우 (인식 실패)
          setOcrItems([]);
          setStep('FAIL_SAFE');
        }
      } catch {
        // 네트워크 장애 또는 API 오류 시 안전하게 FAIL_SAFE로 전이
        setOcrItems([]);
        setStep('FAIL_SAFE');
      }
    } else {
      setStep('FAIL_SAFE');
    }
  };

  // 3. 수동 검수 확정 핸들러
  const handleConfirmReview = (newItems: Omit<InventoryItem, 'ingredientId'>[]) => {
    onAddBatch(newItems);
    toast.success(`영수증에서 ${newItems.length}개 재료를 냉장고에 넣었어요! 🧾`);
    onClose();
  };

  // 재촬영/재선택 핸들러 (STEP 1으로 복귀)
  const handleRetryUpload = () => {
    setStep('UPLOAD');
    setPreviewUrl(null);
  };

  // 스텝별 헤더 타이틀 및 설명
  const getHeaderInfo = () => {
    switch (step) {
      case 'UPLOAD':
        return {
          title: '영수증 스캔',
          badge: 'Gemini AI',
          description: '장보고 받은 종이 영수증 사진을 올려주세요.',
        };
      case 'SCANNING':
        return {
          title: '영수증 분석 중',
          badge: 'AI 파싱',
          description: 'Gemini Flash AI가 영수증 품목과 소비기한을 자동 인식하고 있어요.',
        };
      case 'REVIEW':
        return {
          title: '영수증 OCR 결과 검수',
          badge: `${ocrItems.filter((i) => i.selected).length}개 선택`,
          description: '인식된 품목을 확인하고 필요 시 수량 및 날짜를 수정해 주세요.',
        };
      case 'FAIL_SAFE':
        return {
          title: '인식 결과 안내',
          badge: '예외 복구',
          description: '영수증 글자가 흐릿하여 품목을 자동으로 읽어오지 못했습니다.',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ocr-modal-title"
      >
        {/* 배경 백드롭 */}
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* 모달 창 */}
        <motion.div
          className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* 모달 상단 헤더 바 */}
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-3.5 bg-muted/20 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                <Receipt className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="ocr-modal-title" className="text-base font-bold text-foreground">
                    {headerInfo.title}
                  </h2>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-extrabold text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                    {headerInfo.badge}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{headerInfo.description}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground active:scale-95 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 모달 콘텐츠 본문 (스텝 분기) */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            {step === 'UPLOAD' && (
              <ReceiptImagePicker
                onSelectImage={handleSelectImage}
              />
            )}

            {step === 'SCANNING' && (
              <ReceiptScanningProgress
                previewUrl={previewUrl}
              />
            )}

            {step === 'REVIEW' && (
              <ReceiptItemReview
                initialItems={ocrItems}
                onConfirm={handleConfirmReview}
                onReupload={handleRetryUpload}
                onClose={onClose}
              />
            )}

            {step === 'FAIL_SAFE' && (
              <ReceiptFailSafeView
                onRetry={handleRetryUpload}
                onManualSwitch={() => {
                  onClose();
                  onManualSwitch();
                }}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// OcrReviewModal 이름으로도 호환 export
export { ReceiptOcrModal as OcrReviewModal };
