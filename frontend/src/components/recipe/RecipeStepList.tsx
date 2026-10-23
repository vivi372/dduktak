import { useState } from 'react';
import { Check } from 'lucide-react';
import type { RecipeStep } from '@/types/recipe';
import { cn } from '@/utils/cn';

interface RecipeStepListProps {
  steps: RecipeStep[];
  className?: string;
}

/**
 * 조리 순서 (Step) 리스트 (REC-01-3 / REC-02-2)
 * - 단계별 설명 및 사진 첨부 미리보기
 * - 요리 중 완료한 단계를 체크할 수 있는 인터랙션 제공
 */
export function RecipeStepList({ steps, className }: RecipeStepListProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (stepNo: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNo) ? prev.filter((n) => n !== stepNo) : [...prev, stepNo],
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-sm font-extrabold text-foreground">
          조리 순서 <span className="text-brand-600 dark:text-brand-300">({steps.length}단계)</span>
        </h3>
        <span className="text-xs text-muted-foreground">
          완료: {completedSteps.length}/{steps.length}
        </span>
      </div>

      <ol className="space-y-3.5">
        {steps.map((step) => {
          const isDone = completedSteps.includes(step.stepNo);
          return (
            <li
              key={step.stepNo}
              onClick={() => toggleStep(step.stepNo)}
              className={cn(
                'group flex gap-3.5 rounded-2xl border p-3.5 sm:p-4 transition-all cursor-pointer select-none active:scale-[0.99]',
                isDone
                  ? 'border-mint-500/40 bg-mint-50/40 opacity-75 dark:bg-card dark:border-mint-500/40'
                  : 'border-border/80 bg-card hover:border-brand-200 dark:border-white/10 dark:hover:border-brand-800/60',
              )}
            >
              {/* 스텝 번호 / 체크 버튼 */}
              <button
                type="button"
                aria-label={`Step ${step.stepNo} 완료 상태 토글`}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors',
                  isDone
                    ? 'bg-mint-500 text-slate-950 font-black dark:bg-mint-400 dark:text-slate-950'
                    : 'bg-brand-100 text-brand-700 group-hover:bg-brand-500 group-hover:text-white dark:bg-brand-900/60 dark:text-brand-300',
                )}
              >
                {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : step.stepNo}
              </button>

              <div className="flex-1 space-y-2">
                <p
                  className={cn(
                    'text-sm leading-relaxed transition-all',
                    isDone
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground font-medium',
                  )}
                >
                  {step.description}
                </p>

                {step.imageUrl && (
                  <div className="overflow-hidden rounded-xl border border-border/80 aspect-video max-w-sm bg-muted">
                    <img
                      src={step.imageUrl}
                      alt={`Step ${step.stepNo} 과정 사진`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
