import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  /** 우측 '더보기' 링크 경로 */
  moreTo?: string;
  description?: string;
  action?: ReactNode;
}

/** 섹션 제목 + 더보기 링크 */
export function SectionHeader({ title, moreTo, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
      {moreTo && (
        <Link
          to={moreTo}
          className="flex min-h-11 shrink-0 whitespace-nowrap items-center gap-0.5 pl-3 text-[13px] font-semibold text-brand-600 dark:text-brand-300"
        >
          더보기
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
