import { AlertCircle, Camera, PencilLine } from 'lucide-react';

interface ReceiptFailSafeViewProps {
  /** 영수증 다시 촬영/선택 (STEP 1으로 복귀) */
  onRetry: () => void;
  /** 수동 등록 Combobox 화면으로 전환 (부모 모달 스위칭) */
  onManualSwitch: () => void;
  /** 닫기 */
  onClose?: () => void;
}

/**
 * 4. 영수증 OCR Fail-Safe 예외 처리 뷰
 * - 인식 실패 (0건 추출, 영수증 훼손, 빛 반사) 안내 모달
 * - [영수증 다시 찍기] & [직접 재료 등록하기] 화면 전환 스캐폴딩
 */
export function ReceiptFailSafeView({
  onRetry,
  onManualSwitch,
}: ReceiptFailSafeViewProps) {
  return (
    <div className="py-6 px-2 text-center space-y-6">
      {/* 1. 경고 및 안내 비주얼 */}
      <div className="space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-foreground">
            영수증 글자를 선명하게 읽지 못했어요 😢
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            빛 반사나 구겨짐으로 인해 글자를 정확히 판독하기 어려워요.<br />
            영수증을 다시 촬영하거나, 직접 검색하여 등록해 보세요.
          </p>
        </div>
      </div>

      {/* 2. 도움말 팁 박스 */}
      <div className="rounded-2xl border border-border/80 bg-muted/30 p-3.5 text-left text-xs space-y-1.5">
        <span className="font-bold text-foreground block">💡 인식률을 높이는 영수증 촬영 팁</span>
        <ul className="text-muted-foreground space-y-1 list-disc list-inside text-[11px]">
          <li>그림자가 생기지 않는 밝은 곳에서 촬영해 주세요.</li>
          <li>영수증의 네 모서리가 화면에 모두 들어오도록 맞춰주세요.</li>
          <li>구겨진 영수증은 손으로 평평하게 펴서 찍어주세요.</li>
        </ul>
      </div>

      {/* 3. 복구 액션 버튼들 */}
      <div className="space-y-2.5 pt-2">
        {/* 1) 수동 등록 Combobox 전환 CTA */}
        <button
          type="button"
          onClick={onManualSwitch}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-500 font-bold text-sm text-white shadow-soft transition-all hover:bg-brand-600 active:scale-[0.98]"
        >
          <PencilLine className="h-4 w-4" />
          <span>직접 재료 등록하기 (수동 추가)</span>
        </button>

        {/* 2) 다시 촬영하기 */}
        <button
          type="button"
          onClick={onRetry}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border bg-background font-bold text-sm text-foreground hover:bg-accent active:scale-[0.98]"
        >
          <Camera className="h-4 w-4" />
          <span>영수증 다시 찍기 / 사진 변경</span>
        </button>
      </div>
    </div>
  );
}
