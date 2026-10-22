import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DDayBadge } from '@/components/common/DDayBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { mockInventory } from '@/mocks';
import { cn } from '@/utils/cn';
import { STORAGE_LABEL } from '@/utils/dday';
import type { StorageType } from '@/types/inventory';

type Filter = 'ALL' | StorageType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'REFRIGERATED', label: STORAGE_LABEL.REFRIGERATED },
  { key: 'FROZEN', label: STORAGE_LABEL.FROZEN },
  { key: 'ROOM_TEMP', label: STORAGE_LABEL.ROOM_TEMP },
];

/** 내 냉장고 프레임 (표준 재료 Combobox/아코디언은 Step 3A-3) */
export default function InventoryPage() {
  const [filter, setFilter] = useState<Filter>('ALL');

  // 소비기한 임박순 정렬
  const items = useMemo(
    () =>
      mockInventory
        .filter((i) => filter === 'ALL' || i.storageType === filter)
        .sort((a, b) => a.dDay - b.dDay),
    [filter],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">내 냉장고</h1>
        <p className="mt-1 text-sm text-muted-foreground">소비기한이 임박한 순서로 보여드려요.</p>
      </div>

      <div role="tablist" aria-label="보관 장소" className="flex gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={cn(
              'min-h-11 rounded-full px-5 text-sm font-bold transition-all active:scale-95',
              filter === key
                ? 'bg-brand-500 text-brand-foreground shadow-soft'
                : 'border bg-card text-muted-foreground hover:bg-accent',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState emoji="🧊" title="이곳엔 아직 재료가 없어요" description="아래 + 버튼으로 재료를 넣어 보세요." />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.ingredientId}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-bold">{item.name}</h2>
                    <Badge variant="mint">{STORAGE_LABEL[item.storageType]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.quantity}
                    {item.unit} · {item.expireDate}
                    {item.memo ? ` · ${item.memo}` : ''}
                  </p>
                </div>
                <DDayBadge dDay={item.dDay} verbose className="shrink-0" />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
