import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Zap, ZapOff, ScanBarcode, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBodyScrollLock } from '@/hooks';
import { useBarcodeLookup } from '@/hooks/useInventory';
import { ScanFailSafeModal } from './ScanFailSafeModal';
import type { MasterIngredient } from '@/types/inventory';

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  /** 바코드 인식 성공 시 추천 표준 식재료 전달 */
  onScanSuccess: (ingredient: MasterIngredient) => void;
  /** 수동 등록 폼으로 직접 이동 */
  onManualSwitch: () => void;
}

/**
 * 모바일 카메라 뷰파인더 오버레이 바코드 스캐너 모달 (INV-01-3)
 * - Google ML Kit 바코드 인식 뷰파인더 오버레이 UI 마크업
 * - React Query useBarcodeLookup 훅을 통한 백엔드 API(GET /api/v1/inventory/barcode/{barcodeNo}) 연동
 * - 404 (INV_WARN_BARCODE_NOT_FOUND) 수신 시 ScanFailSafeModal 예외 복구 뷰 연결
 */
export function BarcodeScannerModal({
  open,
  onClose,
  onScanSuccess,
  onManualSwitch,
}: BarcodeScannerModalProps) {
  useBodyScrollLock(open);

  const [torchOn, setTorchOn] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isFailSafeOpen, setIsFailSafeOpen] = useState(false);
  const [failedBarcodeNo, setFailedBarcodeNo] = useState<string>('');

  const barcodeLookup = useBarcodeLookup();

  if (!open) return null;

  /** 바코드 번호로 실제 백엔드 API 조회 수행 */
  const handleLookupBarcode = async (barcodeNo: string) => {
    try {
      const result = await barcodeLookup.mutateAsync(barcodeNo);
      toast.success(`'${result.name}' 바코드를 성공적으로 인식했어요! 🍜`);
      onScanSuccess({
        masterIngredientId: result.masterIngredientId,
        categoryId: result.categoryId,
        categoryName: '식재료',
        name: result.name,
        defaultUnit: result.recommendedUnit,
        defaultShelfDays: 7,
      });
      onClose();
    } catch (err: unknown) {
      // 404 미등록 바코드 또는 오류 발생 시 Fail-Safe 모달 오픈
      setFailedBarcodeNo(barcodeNo);
      setIsFailSafeOpen(true);
    }
  };

  // 1. 성공 시나리오 모의 테스트: 신라면 바코드(8801043014859) 조회
  const handleSimulateSuccess = () => {
    handleLookupBarcode('8801043014859');
  };

  // 2. 실패 시나리오 모의 테스트: 미등록 바코드(9999999999999) 404 예외 복구 테스트
  const handleSimulateNotFound = () => {
    handleLookupBarcode('9999999999999');
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          {/* 카메라 백드롭 시뮬레이션 */}
          <motion.div
            className="fixed inset-0 bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* 메인 뷰파인더 윈도우 */}
          <div className="relative z-10 flex h-full w-full max-w-lg flex-col justify-between p-6">
            {/* 상단 툴바: 타이틀, 플래시 토글, 닫기 */}
            <div className="flex items-center justify-between text-white pt-2">
              <div className="flex items-center gap-2">
                <ScanBarcode className="h-5 w-5 text-brand-400" />
                <h2 className="text-base font-bold">바코드 스캔</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTorchOn((prev) => !prev)}
                  aria-label={torchOn ? '플래시 끄기' : '플래시 켜기'}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95"
                >
                  {torchOn ? <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400" /> : <ZapOff className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="닫기"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 중앙: 카메라 뷰파인더 프레임 오버레이 */}
            <div className="relative mx-auto my-auto flex h-64 w-72 flex-col items-center justify-center">
              {/* 네 모서리 타겟 프레임 가이드라인 */}
              <div className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-brand-400 rounded-tl-xl" />
              <div className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-brand-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-brand-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-brand-400 rounded-br-xl" />

              {/* 스캔 레이저 라인 애니메이션 */}
              <motion.div
                className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-[0_0_8px_#FF8A7A]"
                animate={{ top: ['15%', '85%', '15%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              />

              <p className="z-10 text-center text-xs font-medium text-white/70">
                {barcodeLookup.isPending ? '바코드 분석 중...' : '바코드를 사각 프레임 안에 맞춰주세요'}
              </p>
            </div>

            {/* 하단: 시뮬레이션 및 수동 전환 컨트롤 */}
            <div className="space-y-3 pb-6 text-white">
              {/* 바코드 번호 직접 입력 인풋 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="바코드 번호 직접 입력 (예: 8801043014859)"
                  className="h-10 flex-1 rounded-xl bg-white/10 px-3 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
                <button
                  type="button"
                  onClick={() => manualBarcode.trim() && handleLookupBarcode(manualBarcode.trim())}
                  disabled={!manualBarcode.trim() || barcodeLookup.isPending}
                  className="rounded-xl bg-brand-500 px-3.5 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {barcodeLookup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '조회'}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleSimulateSuccess}
                  disabled={barcodeLookup.isPending}
                  className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 font-bold text-sm text-white shadow-soft transition-all hover:bg-brand-600 active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>모의 인식 성공 (신라면)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateNotFound}
                  disabled={barcodeLookup.isPending}
                  className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 font-bold text-sm text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
                >
                  <AlertCircle className="h-4 w-4 text-orange-400" />
                  <span>미등록 바코드 예외 테스트</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onManualSwitch}
                className="w-full text-center text-xs text-white/60 hover:text-white underline pt-1"
              >
                바코드가 잘 안 찍히나요? 직접 입력하기
              </button>
            </div>
          </div>
        </div>
      </AnimatePresence>

      {/* 바코드 404 Fail-Safe 모달 */}
      <ScanFailSafeModal
        open={isFailSafeOpen}
        barcodeNo={failedBarcodeNo}
        onClose={() => setIsFailSafeOpen(false)}
        onManualSwitch={() => {
          setIsFailSafeOpen(false);
          onClose();
          onManualSwitch();
        }}
      />
    </>
  );
}
