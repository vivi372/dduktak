import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, ScanBarcode, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { mockInventory, mockCategories } from '@/mocks';
import { cn } from '@/utils/cn';
import { STORAGE_LABEL } from '@/utils/dday';
import { EmptyState } from '@/components/common/EmptyState';
import {
  InventoryAccordionItem,
  ConsumeModal,
  ManualAddModal,
  BarcodeScannerModal,
  ReceiptOcrModal,
  ExpiredIngredientsSection,
  EditIngredientModal,
} from '@/components/inventory';
import type {
  InventoryItem,
  GroupedInventoryItem,
  StorageType,
  MasterIngredient,
} from '@/types/inventory';

type StorageFilter = 'ALL' | StorageType;

const STORAGE_FILTERS: { key: StorageFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'REFRIGERATED', label: STORAGE_LABEL.REFRIGERATED },
  { key: 'FROZEN', label: STORAGE_LABEL.FROZEN },
  { key: 'ROOM_TEMP', label: STORAGE_LABEL.ROOM_TEMP },
];

/**
 * 내 냉장고 관리소 화면 (/inventory)
 * - 2-Tier 아코디언 동일 표준 식재료 묶음 표시 (Framer Motion)
 * - 가장 임박한 D-Day 배지 및 임박순 정렬
 * - 표준 식재료 검색 Combobox 수동 추가 모달
 * - 바코드 카메라 뷰파인더 및 영수증 OCR 품목 검수 팝업
 * - 소비기한 만료 영역(dDay < 0) 분리 및 폐기/소비/연장 액션
 */
export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 인벤토리 상태 (목 데이터 기반 클라이언트 인터랙션)
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>(mockInventory);

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [storageFilter, setStorageFilter] = useState<StorageFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL');

  // 모달 팝업 제어 상태
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // 액션 대상 레코드 상태
  const [consumingItem, setConsumingItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [barcodePrefillMaster, setBarcodePrefillMaster] = useState<MasterIngredient | null>(null);

  // 퀵 액션 라우트 파라미터(?action=manual|barcode|receipt) 감지하여 모달 자동 오픈
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'manual') {
      setIsManualModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'barcode') {
      setIsBarcodeModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'receipt') {
      setIsReceiptModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);


  // 1. 신선 보관 중인 재료(dDay >= 0)와 만료된 재료(dDay < 0) 분리 (INV-02-4)
  const activeItems = useMemo(
    () => inventoryList.filter((item) => item.dDay >= 0),
    [inventoryList],
  );

  const expiredItems = useMemo(
    () => inventoryList.filter((item) => item.dDay < 0),
    [inventoryList],
  );

  // 2. 검색어 및 보관장소/카테고리 필터링 적용
  const filteredActiveItems = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    return activeItems.filter((item) => {
      const matchStorage = storageFilter === 'ALL' || item.storageType === storageFilter;
      const matchCategory = categoryFilter === 'ALL' || item.categoryId === categoryFilter;
      const matchSearch =
        trimmed === '' ||
        item.name.toLowerCase().includes(trimmed) ||
        (item.memo && item.memo.toLowerCase().includes(trimmed));

      return matchStorage && matchCategory && matchSearch;
    });
  }, [activeItems, storageFilter, categoryFilter, searchQuery]);

  // 3. 동일 표준 식재료(masterIngredientId) 단위로 2-Tier 그룹화
  const groupedItems = useMemo(() => {
    const map = new Map<number, GroupedInventoryItem>();

    filteredActiveItems.forEach((item) => {
      const existing = map.get(item.masterIngredientId);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.mostUrgentDDay = Math.min(existing.mostUrgentDDay, item.dDay);
        existing.items.push(item);
      } else {
        const categoryObj = mockCategories.find((c) => c.categoryId === item.categoryId);
        map.set(item.masterIngredientId, {
          masterIngredientId: item.masterIngredientId,
          name: item.name,
          categoryId: item.categoryId,
          categoryName: categoryObj?.categoryName,
          storageType: item.storageType,
          totalQuantity: item.quantity,
          primaryUnit: item.unit,
          mostUrgentDDay: item.dDay,
          items: [item],
        });
      }
    });

    // 가장 임박한 D-Day 급한 순으로 정렬 (INV-02-1)
    return Array.from(map.values()).sort((a, b) => a.mostUrgentDDay - b.mostUrgentDDay);
  }, [filteredActiveItems]);

  // --- 이벤트 핸들러 ---

  // 직접 추가 완료 핸들러
  const handleAddManual = (newItem: Omit<InventoryItem, 'ingredientId'>) => {
    const newId = Math.max(0, ...inventoryList.map((i) => i.ingredientId)) + 1;
    const itemWithId: InventoryItem = { ...newItem, ingredientId: newId };
    setInventoryList((prev) => [itemWithId, ...prev]);
    toast.success(`${newItem.name}을(를) 냉장고에 넣었어요! 🥚`);
  };

  // 영수증 OCR 일괄 추가 핸들러
  const handleAddBatch = (newItems: Omit<InventoryItem, 'ingredientId'>[]) => {
    let currentMaxId = Math.max(0, ...inventoryList.map((i) => i.ingredientId));
    const itemsWithIds: InventoryItem[] = newItems.map((item) => {
      currentMaxId += 1;
      return { ...item, ingredientId: currentMaxId };
    });
    setInventoryList((prev) => [...itemsWithIds, ...prev]);
  };

  // 바코드 스캔 성공 시 수동 등록 폼으로 연결
  const handleBarcodeSuccess = (master: MasterIngredient) => {
    setBarcodePrefillMaster(master);
    setIsBarcodeModalOpen(false);
    setIsManualModalOpen(true);
  };

  // 소비 완료 차감 핸들러
  const handleConfirmConsume = (targetItem: InventoryItem, consumeQuantity: number) => {
    setInventoryList((prev) =>
      prev
        .map((item) => {
          if (item.ingredientId !== targetItem.ingredientId) return item;
          const remaining = Math.max(0, item.quantity - consumeQuantity);
          return remaining === 0 ? null : { ...item, quantity: remaining };
        })
        .filter((item): item is InventoryItem => item !== null),
    );
    toast.success(`${targetItem.name} ${consumeQuantity}${targetItem.unit}을(를) 맛있게 소비했어요! 🍳`);
  };

  // 재료 정보 수정 완료 핸들러
  const handleSaveEdit = (updatedItem: InventoryItem) => {
    setInventoryList((prev) =>
      prev.map((item) => (item.ingredientId === updatedItem.ingredientId ? updatedItem : item)),
    );
    toast.success(`${updatedItem.name} 정보가 수정되었어요.`);
  };

  // 재료 삭제/폐기 핸들러
  const handleDelete = (targetItem: InventoryItem) => {
    setInventoryList((prev) => prev.filter((item) => item.ingredientId !== targetItem.ingredientId));
    toast.info(`${targetItem.name}을(를) 삭제했어요.`);
  };

  // 소비기한 만료 영역 연장 트리거
  const handleExtendExpired = (targetItem: InventoryItem) => {
    setEditingItem(targetItem);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. 상단 타이틀 & 3종 퀵 액션 버튼 바 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight">내 냉장고</h1>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
              신선 {activeItems.length}종
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            소비기한이 가장 임박한 순서대로 그룹화하여 보여드려요.
          </p>
        </div>

        {/* 3대 추가 CTA: 직접 추가 / 바코드 / 영수증 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setBarcodePrefillMaster(null);
              setIsManualModalOpen(true);
            }}
            className="flex min-h-[42px] flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-3.5 text-xs font-bold text-white shadow-soft transition-all hover:bg-brand-600 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>재료 추가</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBarcodeModalOpen(true)}
            title="바코드 스캔"
            aria-label="바코드 스캔으로 재료 추가"
            className="flex min-h-[42px] w-10 sm:w-auto items-center justify-center gap-1.5 rounded-xl border bg-card px-2.5 text-xs font-bold text-foreground transition-all hover:bg-accent active:scale-95"
          >
            <ScanBarcode className="h-4 w-4 text-brand-500" />
            <span className="hidden sm:inline">바코드</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReceiptModalOpen(true)}
            title="영수증 OCR 스캔"
            aria-label="영수증 스캔으로 재료 추가"
            className="flex min-h-[42px] w-10 sm:w-auto items-center justify-center gap-1.5 rounded-xl border bg-card px-2.5 text-xs font-bold text-foreground transition-all hover:bg-accent active:scale-95"
          >
            <Receipt className="h-4 w-4 text-brand-500" />
            <span className="hidden sm:inline">영수증</span>
          </button>
        </div>
      </div>

      {/* 2. 텍스트 검색창 */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="재료명 또는 메모로 검색해 보세요 (예: 계란, 1+1, 소분)"
          className="h-11 w-full rounded-2xl border bg-card pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            지우기
          </button>
        )}
      </div>

      {/* 3. 보관 장소 탭 필터 */}
      <div role="tablist" aria-label="보관 장소" className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {STORAGE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={storageFilter === key}
            onClick={() => setStorageFilter(key)}
            className={cn(
              'min-h-[40px] shrink-0 rounded-full px-4 text-xs font-bold transition-all active:scale-95',
              storageFilter === key
                ? 'bg-brand-500 text-white shadow-soft'
                : 'border bg-card text-muted-foreground hover:bg-accent',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 4. 카테고리 필터 칩 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setCategoryFilter('ALL')}
          className={cn(
            'shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
            categoryFilter === 'ALL'
              ? 'bg-secondary text-secondary-foreground font-bold'
              : 'text-muted-foreground hover:bg-accent',
          )}
        >
          카테고리 전체
        </button>
        {mockCategories.map((cat) => (
          <button
            key={cat.categoryId}
            type="button"
            onClick={() => setCategoryFilter(cat.categoryId)}
            className={cn(
              'shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
              categoryFilter === cat.categoryId
                ? 'bg-secondary text-secondary-foreground font-bold'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {cat.categoryName}
          </button>
        ))}
      </div>

      {/* 5. 2-Tier 아코디언 메인 리스트 영역 */}
      {groupedItems.length === 0 ? (
        <EmptyState
          emoji="🧊"
          title={searchQuery ? '검색 결과가 없어요' : '보관 중인 재료가 없어요'}
          description={
            searchQuery
              ? '다른 검색어를 입력하거나 필터를 초기화해 보세요.'
              : '상단의 [재료 추가] 버튼으로 냉장고를 채워 보세요.'
          }
        />
      ) : (
        <div className="space-y-3">
          {groupedItems.map((group) => (
            <InventoryAccordionItem
              key={group.masterIngredientId}
              group={group}
              onConsume={(item) => setConsumingItem(item)}
              onEdit={(item) => setEditingItem(item)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 6. 소비기한 만료 영역 (dDay < 0) */}
      <ExpiredIngredientsSection
        items={expiredItems}
        onDiscard={handleDelete}
        onConsume={(item) => setConsumingItem(item)}
        onExtend={handleExtendExpired}
      />

      {/* 7. 모달 팝업들 */}
      {/* (1) 수동 재료 등록 모달 */}
      <ManualAddModal
        open={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={handleAddManual}
        initialMaster={barcodePrefillMaster}
      />

      {/* (2) 바코드 카메라 스캐너 팝업 */}
      <BarcodeScannerModal
        open={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        onScanSuccess={handleBarcodeSuccess}
        onManualSwitch={() => {
          setIsBarcodeModalOpen(false);
          setIsManualModalOpen(true);
        }}
      />

      {/* (3) 영수증 OCR 품목 검수 팝업 */}
      <ReceiptOcrModal
        open={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onAddBatch={handleAddBatch}
        onManualSwitch={() => {
          setIsReceiptModalOpen(false);
          setIsManualModalOpen(true);
        }}
      />

      {/* (4) 수동 소비 차감 팝업 */}
      <ConsumeModal
        item={consumingItem}
        onClose={() => setConsumingItem(null)}
        onConfirm={handleConfirmConsume}
      />

      {/* (5) 재료 정보 수정 모달 */}
      <EditIngredientModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
