import { cn } from '@/utils/cn';
import { formatDDayShort, formatDDay, getDDayTone, type DDayTone } from '@/utils/dday';

/** 톤별 색상 (신호등: 임박 빨강 / 주의 주황 / 안심 초록 / 초과 Deep Red) */
const TONE_STYLE: Record<DDayTone, string> = {
  urgent: 'bg-dday-urgent/10 text-dday-urgent ring-1 ring-dday-urgent/30',
  warning: 'bg-dday-warning/10 text-dday-warning ring-1 ring-dday-warning/30',
  safe: 'bg-dday-safe/10 text-dday-safe ring-1 ring-dday-safe/30',
  info: 'bg-dday-info/10 text-dday-info ring-1 ring-dday-info/30',
  expired: 'bg-dday-expired text-white',
};

interface DDayBadgeProps {
  dDay: number;
  /** true면 '소비기한 N일 남음' 전체 문구, false면 'D-N' 짧은 문구 */
  verbose?: boolean;
  className?: string;
}

/** 소비기한 D-Day 신호등 배지 */
export function DDayBadge({ dDay, verbose = false, className }: DDayBadgeProps) {
  const tone = getDDayTone(dDay);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums whitespace-nowrap',
        TONE_STYLE[tone],
        className,
      )}
    >
      {verbose ? formatDDay(dDay) : formatDDayShort(dDay)}
    </span>
  );
}
