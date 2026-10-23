import { Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';

interface RecipeMatchingToggleProps {
  /** 매칭 모드 활성화 여부 */
  enabled: boolean;
  /** 토글 변경 콜백 */
  onChange: (enabled: boolean) => void;
  /** 매칭 가능한 레시피 건수 */
  matchedCount?: number;
  className?: string;
}

/**
 * [🟢 내 냉장고 뚝딱 매칭] 필터 토글 스위치 (REC-02-1 / MATCH-01-2)
 * - 민트 티얼(#4ECDC4) 테마 포인트 컬러 적용
 * - 클릭 시 주재료를 1개 이상 보유한 레시피만 매칭률 내림차순 정렬 및 필터링
 * - WAI-ARIA role="switch" 및 모바일 44px 이상 터치 타겟 지원
 */
export function RecipeMatchingToggle({
  enabled,
  onChange,
  matchedCount,
  className,
}: RecipeMatchingToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'group flex min-h-[58px] w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99]',
        enabled
          ? 'border-mint-500/80 bg-mint-50/90 shadow-soft dark:bg-mint-950/25 dark:border-mint-600/60'
          : 'border-border/80 bg-card hover:border-mint-300 dark:border-white/10 dark:hover:border-mint-700/60',
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {/* 아이콘 뱃지 */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
            enabled
              ? 'bg-mint-500 text-white shadow-sm'
              : 'bg-muted text-muted-foreground group-hover:bg-mint-100 group-hover:text-mint-700 dark:group-hover:bg-mint-900/40',
          )}
        >
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-tight text-foreground">
              🟢 내 냉장고 뚝딱 매칭
            </span>
            {enabled && matchedCount !== undefined && (
              <span className="inline-flex items-center rounded-full bg-mint-500/15 px-2 py-0.5 text-[11px] font-black text-mint-700 dark:text-mint-300">
                {matchedCount}개 요리 가능
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {enabled
              ? '보유 주재료가 있는 요리만 매칭률 순으로 보여드려요'
              : '켜면 내 냉장고 재료로 즉시 만들 수 있는 레시피를 추천해요'}
          </p>
        </div>
      </div>

      {/* 스위치 토글 슬라이더 UI */}
      <div
        className={cn(
          'flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out',
          enabled ? 'bg-mint-500' : 'bg-muted border border-border/80 dark:bg-muted/80',
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out flex items-center justify-center',
            enabled ? 'translate-x-5' : 'translate-x-0',
          )}
        >
          {enabled && <span className="h-2 w-2 rounded-full bg-mint-500" />}
        </span>
      </div>
    </button>
  );
}
