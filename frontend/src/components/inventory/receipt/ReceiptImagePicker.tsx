import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Camera, Image as ImageIcon, UploadCloud, RefreshCw, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { SAMPLE_RECEIPT_PREVIEW_URL } from '@/mocks/ocr_scan.mock';
import { cn } from '@/utils/cn';

interface ReceiptImagePickerProps {
  /** 이미지 선택 완료 시 상위로 파일 및 미리보기 URL 전달 */
  onSelectImage: (file: File | null, previewUrl: string) => void;
  /** 빠른 샘플 체험 클릭 시 */
  onSelectSample: () => void;
}

/**
 * 1. 영수증 이미지 선택 진입점 (모바일/PC 차별화)
 * - 모바일: [카메라 직접 촬영] / [갤러리 사진 선택] 액션시트 UI
 * - PC: 드래그 앤 드롭 영역 + 영수증 실시간 미리보기(Preview) 상자 및 사진 변경 UI
 */
export function ReceiptImagePicker({ onSelectImage, onSelectSample }: ReceiptImagePickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pcFileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 공통 처리
  const processFile = (file: File) => {
    // 이미지 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      toast.error('영수증 이미지 파일(PNG, JPG, WEBP)만 업로드할 수 있어요.');
      return;
    }

    // 10MB 크기 제한
    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 최대 10MB 이하만 가능합니다.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  // 모바일/PC input change 이벤트
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // 재선택 가능하도록 value 초기화
    e.target.value = '';
  };

  // PC 드래그 앤 드롭 이벤트
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // 이미지 변경(다시 선택)
  const handleResetImage = () => {
    if (previewUrl && previewUrl !== SAMPLE_RECEIPT_PREVIEW_URL) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // 분석 시작
  const handleStartScan = () => {
    if (previewUrl) {
      onSelectImage(selectedFile, previewUrl);
    } else {
      toast.error('먼저 영수증 사진을 선택해 주세요.');
    }
  };

  return (
    <div className="space-y-5">
      {/* 숨겨진 File Inputs */}
      {/* (1) 모바일 카메라 직접 촬영 전용 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        data-testid="camera-input"
      />
      {/* (2) 모바일 앨범/갤러리 선택 전용 */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        data-testid="gallery-input"
      />
      {/* (3) PC 클릭 선택 전용 */}
      <input
        ref={pcFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        data-testid="pc-file-input"
      />

      {/* ======================================================== */}
      {/* A. 모바일 뷰포트: [카메라 직접 촬영] / [갤러리 사진 선택] 액션시트 UI */}
      {/* ======================================================== */}
      <div className="block md:hidden space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">
          영수증 등록 방식을 선택해 주세요
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          {/* 1. 카메라 직접 촬영 액션 */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex min-h-[56px] w-full items-center gap-3.5 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/40 p-3.5 text-left transition-all hover:bg-brand-50 active:scale-[0.98] dark:border-brand-800 dark:bg-brand-950/20"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-soft">
              <Camera className="h-6 w-6" />
            </span>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-foreground">카메라로 직접 촬영</span>
              <span className="block text-[11px] text-muted-foreground break-keep leading-tight mt-0.5">
                영수증을 평평하게 펴고 선명하게 찍어주세요
              </span>
            </div>
          </button>

          {/* 2. 갤러리 사진 선택 액션 */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex min-h-[56px] w-full items-center gap-3.5 rounded-2xl border bg-card p-3.5 text-left shadow-card transition-all hover:border-brand-300 active:scale-[0.98]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mint-100 text-mint-700 dark:bg-mint-950/50 dark:text-mint-300">
              <ImageIcon className="h-6 w-6" />
            </span>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-foreground">앨범 / 갤러리에서 선택</span>
              <span className="block text-[11px] text-muted-foreground break-keep leading-tight mt-0.5">
                보관 중인 영수증 사진을 불러와요
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* B. PC 뷰포트: 드래그 앤 드롭 영역 + 실시간 미리보기 상자 및 사진 변경 */}
      {/* ======================================================== */}
      <div className="hidden md:block">
        {!previewUrl ? (
          // 1) 아직 이미지를 선택하지 않았을 때: 드래그 앤 드롭 존
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => pcFileInputRef.current?.click()}
            className={cn(
              'group relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all',
              isDragging
                ? 'border-brand-500 bg-brand-50/60 scale-[1.01] dark:bg-brand-950/30'
                : 'border-border/80 bg-muted/20 hover:border-brand-400 hover:bg-brand-50/20 dark:hover:bg-brand-950/10'
            )}
            role="region"
            aria-label="PC 영수증 이미지 드래그 앤 드롭 업로드 영역"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 transition-transform group-hover:scale-110 dark:bg-brand-900/40 dark:text-brand-300">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-foreground">
              {isDragging ? '여기에 영수증 이미지를 놓으세요!' : '영수증 이미지를 여기에 끌어다 놓으세요'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              또는 <span className="font-semibold text-brand-600 underline dark:text-brand-400">컴퓨터에서 사진 선택</span>
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
              <FileText className="h-3.5 w-3.5" />
              <span>PNG, JPG, WEBP 지원 (최대 10MB)</span>
            </div>
          </div>
        ) : (
          // 2) 이미지를 선택했을 때: 실시간 미리보기 상자 & 사진 변경 UI
          <div className="overflow-hidden rounded-2xl border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-500" />
                <span className="text-xs font-bold text-foreground">선택된 영수증 이미지</span>
                {selectedFile && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                )}
              </div>
              {/* 사진 변경 버튼 */}
              <button
                type="button"
                onClick={handleResetImage}
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="사진 변경"
              >
                <RefreshCw className="h-3 w-3" />
                <span>사진 변경</span>
              </button>
            </div>

            {/* 실시간 미리보기 상자 */}
            <div className="relative flex max-h-[220px] w-full items-center justify-center overflow-hidden rounded-xl bg-muted/40 p-2">
              <img
                src={previewUrl}
                alt="영수증 미리보기"
                className="max-h-[200px] w-auto rounded-lg object-contain shadow-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* 모바일에서도 이미지가 선택되었을 때의 미리보기 카드 */}
      {previewUrl && (
        <div className="block md:hidden overflow-hidden rounded-2xl border bg-card p-3 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-500" />
              촬영된 영수증 미리보기
            </span>
            <button
              type="button"
              onClick={handleResetImage}
              className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              다시 선택
            </button>
          </div>
          <div className="flex max-h-[160px] items-center justify-center overflow-hidden rounded-xl bg-muted/30 p-1">
            <img
              src={previewUrl}
              alt="모바일 영수증 미리보기"
              className="max-h-[150px] w-auto rounded object-contain"
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 공통 CTA & 샘플 체험 원클릭 영역 */}
      {/* ======================================================== */}
      <div className="pt-2 space-y-2.5">
        {previewUrl ? (
          <button
            type="button"
            onClick={handleStartScan}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-500 font-bold text-sm text-white shadow-soft transition-all hover:bg-brand-600 active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            <span>영수증 AI 분석 시작하기</span>
          </button>
        ) : (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              영수증 사진이 없으신가요?
            </p>
            <button
              type="button"
              onClick={onSelectSample}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground hover:bg-secondary/80 active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              <span>샘플 영수증으로 바로 체험하기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
