import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Zap, ZapOff, ScanBarcode, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { mockMasterIngredients } from '@/mocks';
import { useBodyScrollLock } from '@/hooks';
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
 * - 반투명 마스크 + 사각 타겟 모서리 프레임 + 스캔 레이저 애니메이션
 * - 모의 바코드 스캔 성공 및 404 미등록 예외 복구 인터랙션 지원
 */
export function BarcodeScannerModal({
  open,
  onClose,
  onScanSuccess,
  onManualSwitch,
}: BarcodeScannerModalProps) {
  useBodyScrollLock(open);

  const [torchOn, setTorchOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  if (!open) return null;

  // 1. 성공 시나리오 모의 테스트: 신라면 바코드 인식 ➔ 표준 '라면' 마스터 매핑
  const handleSimulateSuccess = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // '라면' (masterIngredientId: 47) 매핑
      const ramen = mockMasterIngredients.find((m) => m.name === '라면');
      if (ramen) {
        toast.success(`'${ramen.name}' 바코드를 성공적으로 인식했어요! 🍜`);
        onScanSuccess(ramen);
        onClose();
      }
    }, 600);
  };

  // 2. 실패 시나리오 모의 테스트: 404 미등록 바코드 예외 안내 (INV_WARN_BARCODE_NOT_FOUND)
  const handleSimulateNotFound = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast.info('등록되지 않은 바코드 상품이에요. 직접 간편하게 추가해보세요! ✍️');
      onManualSwitch();
    }, 600);
  };

  return (
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
              {isScanning ? '바코드 분석 중...' : '바코드를 사각 프레임 안에 맞춰주세요'}
            </p>
          </div>

          {/* 하단: 시뮬레이션 및 수동 전환 컨트롤 */}
          <div className="space-y-3 pb-6 text-white">
            <div className="rounded-2xl bg-white/10 p-3 text-center text-xs text-white/80 backdrop-blur-md">
              💡 실제 하이브리드 앱에서는 카메라 센서로 실시간 인식됩니다.
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleSimulateSuccess}
                disabled={isScanning}
                className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 font-bold text-sm text-white shadow-soft transition-all hover:bg-brand-600 active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>모의 인식 성공 (신라면)</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateNotFound}
                disabled={isScanning}
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
  );
}
