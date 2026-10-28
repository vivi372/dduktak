import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBodyScrollLock } from '@/hooks';

interface ProfileCropModalProps {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  onSelectAnother: () => void;
}

const CROP_SIZE = 260; // 크롭 뷰포트 지름 (px)
const OUTPUT_SIZE = 1080; // 최종 추출 정방형 이미지 해상도 (px)

/**
 * 프로필 이미지 원형 크롭/조절 모달 (06_UI_UX_GUIDELINES.md 4.6절)
 * - 1:1 원형 마스크 가이드라인
 * - 고해상도 대형 사진도 원형 프레임 안에 맞춰지는 반응형 베이스 스케일링
 * - Drag & Pan (위치 이동) 및 대폭 확장된 Zoom Slider (0.3x ~ 3.0x 축소/확대)
 * - Canvas API를 통한 1080x1080 고해상도 정밀 크롭 추출
 */
export function ProfileCropModal({
  open,
  imageSrc,
  onClose,
  onCropComplete,
  onSelectAnother,
}: ProfileCropModalProps) {
  useBodyScrollLock(open, onClose);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });

  const dragStartRef = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  // 모달이 열리거나 이미지 소스가 바뀔 때 위치/스케일 초기화
  useEffect(() => {
    if (open) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [open, imageSrc]);

  // 이미지 원본 크기 로드
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageNaturalSize({
      width: img.naturalWidth || CROP_SIZE,
      height: img.naturalHeight || CROP_SIZE,
    });
  };

  // 원본 이미지가 260px 원형 뷰포트에 꽉 차도록 맞추는 베이스 비율 (Cover)
  const baseScale = imageNaturalSize.width > 0 && imageNaturalSize.height > 0
    ? Math.max(CROP_SIZE / imageNaturalSize.width, CROP_SIZE / imageNaturalSize.height)
    : 1;

  const baseWidth = (imageNaturalSize.width || CROP_SIZE) * baseScale;
  const baseHeight = (imageNaturalSize.height || CROP_SIZE) * baseScale;

  // 포인터 드래그 시작 (마우스/터치 통합)
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // 포인터 이동 (Pan)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  // 포인터 드래그 종료
  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // noop
    }
  };

  // 마우스 휠로 확대/축소 편의 인터랙션 지원
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale((prev) => Math.min(3.0, Math.max(0.3, parseFloat((prev + delta).toFixed(2)))));
  };

  // 리셋
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Canvas 기반 크롭 추출 실행
  const handleApplyCrop = useCallback(() => {
    if (!imageRef.current) return;
    const img = imageRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 뷰포트(260px)에서 OUTPUT_SIZE(1080px)로 변환하는 배율
    const canvasMultiplier = OUTPUT_SIZE / CROP_SIZE;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // 캔버스 중앙으로 원점 이동
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    // 사용자 드래그 위치 오프셋 적용
    ctx.translate(position.x * canvasMultiplier, position.y * canvasMultiplier);

    // 베이스 크기 * 현재 줌 스케일 * 캔버스 비율
    const drawWidth = baseWidth * scale * canvasMultiplier;
    const drawHeight = baseHeight * scale * canvasMultiplier;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedDataUrl);
  }, [baseWidth, baseHeight, position, scale, onCropComplete]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="profile-crop-modal-container"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
        >
          {/* 배경 딤 */}
          <div
            className="fixed inset-0 bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* 모달 컨텐츠 */}
          <motion.div
            className="relative w-full max-w-[420px] rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-base sm:text-lg font-bold">프로필 사진 조절</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-2 flex flex-col items-center">
              <p className="mb-3 text-xs text-muted-foreground">
                원형 프레임 안으로 사진을 드래그하여 맞추세요
              </p>

              {/* 원형 마스크 크롭 뷰포트 (지름 260px 고정) */}
              <div
                className="relative flex items-center justify-center overflow-hidden rounded-full border-4 border-brand-400 bg-neutral-900 shadow-2xl select-none"
                style={{ width: CROP_SIZE, height: CROP_SIZE, touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
              >
                {imageSrc ? (
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="크롭 대상 이미지"
                    onLoad={handleImageLoad}
                    draggable={false}
                    style={{
                      width: `${baseWidth}px`,
                      height: `${baseHeight}px`,
                      transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      maxWidth: 'none',
                      maxHeight: 'none',
                      transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                    }}
                    className="select-none object-cover pointer-events-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-400">
                    <ImageIcon className="h-10 w-10 opacity-40" />
                    <span className="mt-2 text-xs">사진을 불러오는 중...</span>
                  </div>
                )}

                {/* 원형 안내선 오버레이 가이드 */}
                <div className="pointer-events-none absolute inset-0 rounded-full border border-white/40 ring-1 ring-black/30" />
              </div>

              {/* 줌 슬라이더 및 리셋 컨트롤 (0.3배 ~ 3.0배로 넓은 축소/확대 범위 지원) */}
              <div className="mt-5 flex w-full items-center gap-3 px-2">
                <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="range"
                  min={0.3}
                  max={3.0}
                  step={0.02}
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="h-2 flex-1 accent-brand-500 cursor-pointer"
                  aria-label="사진 확대 및 축소 비율"
                />
                <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="위치 및 크기 초기화"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1 flex w-full justify-between px-3 text-[10px] text-muted-foreground/70">
                <span>축소 (0.3x)</span>
                <span>기본 (1.0x)</span>
                <span>확대 (3.0x)</span>
              </div>
            </div>

            <div className="mt-5 flex flex-row items-center justify-between gap-2 border-t border-border/60 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSelectAnother}
                className="rounded-full text-xs"
              >
                다른 사진 선택
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="rounded-full"
                >
                  취소
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyCrop}
                  className="rounded-full bg-brand-500 text-white hover:bg-brand-600"
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> 적용하기
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
