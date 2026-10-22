import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Receipt, Bot, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  ReceiptImagePicker,
  ReceiptScanningProgress,
  ReceiptItemReview,
  ReceiptFailSafeView,
} from './receipt';
import {
  mockOcrParsedItems,
  SAMPLE_RECEIPT_PREVIEW_URL,
  type OcrParsedItemWithRaw,
} from '@/mocks/ocr_scan.mock';
import type { InventoryItem } from '@/types/inventory';
import { useBodyScrollLock } from '@/hooks';

export type ReceiptOcrStep = 'UPLOAD' | 'SCANNING' | 'REVIEW' | 'FAIL_SAFE';

interface ReceiptOcrModalProps {
  open: boolean;
  onClose: () => void;
  /** 선택된 검수 품목 일괄 등록 콜백 */
  onAddBatch: (newItems: Omit<InventoryItem, 'ingredientId'>[]) => void;
  /** 수동 등록 폼으로 직접 이동 */
  onManualSwitch: () => void;
  /** 테스트/개발용: 초기 스텝 강제 지정 (기본값: 'UPLOAD') */
  initialStep?: ReceiptOcrStep;
}

/**
 * 영수증 OCR 스캔 및 수동 검수 통합 모달 (INV-01-3)
 * - Step 1: UPLOAD (모바일 카메라/갤러리 액션시트 vs PC 드래그앤드롭 + 실시간 미리보기)
 * - Step 2: SCANNING (프로그레스 바 0~100% + 식재료 4행 Skeleton UI)
 * - Step 3: REVIEW (수동 검수 모달: 체크박스, 표준 매핑 배지, 44px+ 수량, CustomDatePicker)
 * - Step 4: FAIL_SAFE (인식 실패 안내 & 수동 등록 Combobox 화면 리다이렉트 스캐폴딩)
 */
export function ReceiptOcrModal({
  open,
  onClose,
  onAddBatch,
  onManualSwitch,
  initialStep = 'UPLOAD',
}: ReceiptOcrModalProps) {
  useBodyScrollLock(open);

  const [step, setStep] = useState<ReceiptOcrStep>(initialStep);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrItems, setOcrItems] = useState<OcrParsedItemWithRaw[]>(mockOcrParsedItems);

  // 모달이 다시 열릴 때 초기 상태로 리셋
  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setPreviewUrl(null);
      setOcrItems(mockOcrParsedItems);
    }
  }, [open, initialStep]);

  if (!open) return null;

  // 1. 이미지 선택 완료 -> 스캔 로딩 단계로 전이
  const handleSelectImage = (_file: File | null, url: string) => {
    setPreviewUrl(url);
    setStep('SCANNING');
  };

  // 1-1. 샘플 영수증으로 빠른 체험
  const handleSelectSample = () => {
    setPreviewUrl(SAMPLE_RECEIPT_PREVIEW_URL);
    setStep('SCANNING');
  };

  // 2. 스캔 로딩 완료 핸들러
  const handleScanComplete = (isSuccess: boolean) => {
    if (isSuccess) {
      setOcrItems(mockOcrParsedItems);
      setStep('REVIEW');
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
          title: '영수증 사진 등록',
          desc: '모바일 카메라 촬영 또는 PC 이미지를 업로드해 주세요.',
          Icon: Receipt,
        };
      case 'SCANNING':
        return {
          title: '영수증 AI 분석',
          desc: '영수증 속 식재료와 소비기한을 추출하고 있습니다.',
          Icon: Bot,
        };
      case 'REVIEW':
        return {
          title: '영수증 OCR 결과 검수',
          desc: '인식된 재료의 수량과 소비기한을 확인해 주세요.',
          Icon: Sparkles,
        };
      case 'FAIL_SAFE':
        return {
          title: '영수증 인식 결과 안내',
          desc: '선명한 판독을 위해 다시 시도하거나 직접 등록해 보세요.',
          Icon: AlertCircle,
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.Icon;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-ocr-title"
      >
        {/* 배경 딤 */}
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* 모달 본체 */}
        <motion.div
          className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border bg-card shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <HeaderIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 id="receipt-ocr-title" className="text-lg font-extrabold tracking-tight">
                  {headerInfo.title}
                </h2>
                <p className="text-xs text-muted-foreground">{headerInfo.desc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent text-muted-foreground transition-colors"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 스텝별 동적 본문 */}
          <div className="flex-1 overflow-y-auto p-6">
            {step === 'UPLOAD' && (
              <div key="upload" className="animate-in fade-in duration-200">
                <ReceiptImagePicker
                  onSelectImage={handleSelectImage}
                  onSelectSample={handleSelectSample}
                />
              </div>
            )}

            {step === 'SCANNING' && (
              <div key="scanning" className="animate-in fade-in duration-200">
                <ReceiptScanningProgress
                  onComplete={handleScanComplete}
                  previewUrl={previewUrl}
                />
              </div>
            )}

            {step === 'REVIEW' && (
              <div key="review" className="animate-in fade-in duration-200">
                <ReceiptItemReview
                  initialItems={ocrItems}
                  onConfirm={handleConfirmReview}
                  onReupload={handleRetryUpload}
                  onClose={onClose}
                />
              </div>
            )}

            {step === 'FAIL_SAFE' && (
              <div key="fail-safe" className="animate-in fade-in duration-200">
                <ReceiptFailSafeView
                  onRetry={handleRetryUpload}
                  onManualSwitch={() => {
                    onClose();
                    onManualSwitch();
                  }}
                  onClose={onClose}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
