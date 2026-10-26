import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, ScanBarcode, Receipt, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { mockCategories } from '@/mocks';
import { cn } from '@/utils/cn';
import { STORAGE_LABEL } from '@/utils/dday';
import { EmptyState } from '@/components/common/EmptyState';
import { InventoryCardSkeleton } from '@/components/common/Skeleton';
import { usePlatformStore } from '@/store/usePlatformStore';
import {
  InventoryAccordionItem,
  ConsumeModal,
  ManualAddModal,
  BarcodeScannerModal,
  ReceiptOcrModal,
  ExpiredIngredientsSection,
  EditIngredientModal,
} from '@/components/inventory';
import {
  useInventoryList,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  useConsumeIngredient,
} from '@/hooks/useInventory';
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
 * - 가장 임박한 D-Day 배지 및 임박순 정렬 (SQL D-Day 연산 연동)
 * - 표준 식재료 검색 Combobox 수동 추가 모달 (독립 레코드 원칙 INV-01-2)
 * - 바코드 카메라 뷰파인더 및 영수증 OCR 품목 검수 팝업 연동
 * - 소비기한 만료 영역(dDay < 0) 분리 및 폐기/소비/연장 액션
 */
export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isApp } = usePlatformStore();

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

  // React Query 인벤토리 데이터 및 CRUD 뮤테이션 훅 연동
  const { data: inventoryList = [], isLoading } = useInventoryList();
  const createMutation = useCreateIngredient();
  const updateMutation = useUpdateIngredient();
  const deleteMutation = useDeleteIngredient();
  const consumeMutation = useConsumeIngredient();

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

  // 직접 추가 완료 핸들러 (독립 레코드 원칙 적용)
  const handleAddManual = async (newItem: Omit<InventoryItem, 'ingredientId'>) => {
    try {
      await createMutation.mutateAsync({
        masterIngredientId: newItem.masterIngredientId,
        storageType: newItem.storageType,
        quantity: newItem.quantity,
        unit: newItem.unit,
        expireDate: newItem.expireDate,
        memo: newItem.memo,
      });
      toast.success(`${newItem.name}을(를) 냉장고에 넣었어요! 🥚`);
    } catch {
      // apiClient 인터셉터가 에러 처리
    }
  };

  // 영수증 OCR 일괄 추가 핸들러
  const handleAddBatch = async (newItems: Omit<InventoryItem, 'ingredientId'>[]) => {
    try {
      for (const item of newItems) {
        await createMutation.mutateAsync({
          masterIngredientId: item.masterIngredientId,
          storageType: item.storageType,
          quantity: item.quantity,
          unit: item.unit,
          expireDate: item.expireDate,
          memo: item.memo,
        });
      }
      toast.success(`영수증 품목 ${newItems.length}개가 냉장고에 등록되었습니다! 🧾`);
    } catch {
      // 에러 발생 시 알림
    }
  };

  // 바코드 스캔 성공 시 수동 등록 폼으로 연결
  const handleBarcodeSuccess = (master: MasterIngredient) => {
    setBarcodePrefillMaster(master);
    setIsBarcodeModalOpen(false);
    setIsManualModalOpen(true);
  };

  // 수동 소비 완료 차감 핸들러
  const handleConfirmConsume = async (targetItem: InventoryItem, consumeQuantity: number) => {
    try {
      await consumeMutation.mutateAsync({
        ingredientId: targetItem.ingredientId,
        dto: { consumeQuantity },
      });
      toast.success(`${targetItem.name} ${consumeQuantity}${targetItem.unit}을(를) 맛있게 소비했어요! 🍳`);
    } catch {
      // apiClient 인터셉터가 에러 처리
    }
  };

  // 재료 정보 수정 완료 핸들러
  const handleSaveEdit = async (updatedItem: InventoryItem) => {
    try {
      await updateMutation.mutateAsync({
        ingredientId: updatedItem.ingredientId,
        dto: {
          storageType: updatedItem.storageType,
          quantity: updatedItem.quantity,
          unit: updatedItem.unit,
          expireDate: updatedItem.expireDate,
          memo: updatedItem.memo,
        },
      });
      toast.success(`${updatedItem.name} 정보가 수정되었어요.`);
    } catch {
      // apiClient 인터셉터가 에러 처리
    }
  };

  // 재료 삭제/폐기 핸들러 (소프트 삭제)
  const handleDelete = async (targetItem: InventoryItem) => {
    try {
      await deleteMutation.mutateAsync(targetItem.ingredientId);
      toast.info(`${targetItem.name}을(를) 삭제했어요.`);
    } catch {
      // apiClient 인터셉터가 에러 처리
    }
  };

  // 소비기한 만료 영역 연장 트리거
  const handleExtendExpired = (targetItem: InventoryItem) => {
    setEditingItem(targetItem);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. 상단 타이틀 & 3종 퀵 액션 버튼 바 */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight whitespace-nowrap">내 냉장고</h1>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 shrink-0">
              신선 {activeItems.length}종
            </span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-brand-500" />}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground break-keep">
            소비기한이 가장 임박한 순서대로 그룹화하여 보여드려요.
          </p>
        </div>

        {/* 추가 CTA: 앱 환경에서는 직접 추가/바코드/영수증 3종, 웹 브라우저 환경에서는 직접 추가/영수증 2종 */}
        <div className={cn('gap-1.5 sm:gap-2 shrink-0 grid', isApp ? 'grid-cols-3' : 'grid-cols-2')}>
          <button
            type="button"
            onClick={() => {
              setBarcodePrefillMaster(null);
              setIsManualModalOpen(true);
            }}
            className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-2 sm:px-3.5 text-xs font-bold text-white shadow-soft transition-all hover:bg-brand-600 active:scale-95"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="truncate">{isApp ? '재료 추가' : '직접 추가'}</span>
          </button>

          {isApp && (
            <button
              type="button"
              onClick={() => setIsBarcodeModalOpen(true)}
              aria-label="바코드 스캔으로 재료 추가"
              className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-input bg-card px-2 sm:px-3 text-xs font-bold text-foreground transition-all hover:bg-accent active:scale-95 shadow-xs"
            >
              <ScanBarcode className="h-4 w-4 shrink-0 text-brand-500" />
              <span className="truncate">바코드</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsReceiptModalOpen(true)}
            aria-label="영수증 스캔으로 재료 추가"
            className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-input bg-card px-2 sm:px-3 text-xs font-bold text-foreground transition-all hover:bg-accent active:scale-95 shadow-xs"
          >
            <Receipt className="h-4 w-4 shrink-0 text-mint-600" />
            <span className="truncate">{isApp ? '영수증' : '영수증 스캔'}</span>
          </button>
        </div>
      </div>

      {/* 2. 보관 장소 탭 필터 (전체/냉장/냉동/실온) */}
      <div
        role="tablist"
        aria-label="보관 장소 필터"
        className="flex gap-1.5 rounded-2xl bg-muted/60 p-1 text-xs font-bold"
      >
        {STORAGE_FILTERS.map((tab) => {
          const isActive = storageFilter === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setStorageFilter(tab.key)}
              className={cn(
                'flex-1 min-h-[40px] rounded-xl py-2 text-center transition-all',
                isActive
                  ? 'bg-card text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. 검색창 및 카테고리 칩 필터 */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="재료명 또는 메모로 검색..."
            className="min-h-[44px] w-full rounded-2xl border border-input bg-card pl-10 pr-4 text-xs font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30 shadow-xs"
          />
        </div>

        {/* 카테고리 가로 스크롤 칩 */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={cn(
              'min-h-[34px] whitespace-nowrap rounded-full px-3 text-xs font-bold transition-all shrink-0',
              categoryFilter === 'ALL'
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-card text-muted-foreground border border-border/80 hover:bg-accent',
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
                'min-h-[34px] whitespace-nowrap rounded-full px-3 text-xs font-bold transition-all shrink-0',
                categoryFilter === cat.categoryId
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-card text-muted-foreground border border-border/80 hover:bg-accent',
              )}
            >
              {cat.categoryName}
            </button>
          ))}
        </div>
      </div>

      {/* 4. 메인 인벤토리 리스트 (2-Tier 아코디언) */}
      <section aria-label="보관 중인 신선 재료 목록">
        {isLoading ? (
          <div className="space-y-3">
            <InventoryCardSkeleton />
            <InventoryCardSkeleton />
            <InventoryCardSkeleton />
          </div>
        ) : groupedItems.length > 0 ? (
          <div className="space-y-3">
            {groupedItems.map((group) => (
              <InventoryAccordionItem
                key={group.masterIngredientId}
                group={group}
                onConsume={(item) => setConsumingItem(item)}
                onEdit={(item) => setEditingItem(item)}
                onDelete={handleDelete}
                isActionPending={deleteMutation.isPending || consumeMutation.isPending || updateMutation.isPending}
              />
            ))}
          </div>
        ) : (
          /* 검색 결과 없음 또는 재료 0개 Empty State */
          <EmptyState
            emoji="🧊"
            title={
              searchQuery || storageFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? '조건에 맞는 재료를 찾을 수 없어요'
                : '아직 냉장고에 등록된 재료가 없어요!'
            }
            description={
              searchQuery || storageFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? '검색어나 필터 조건을 변경해 보세요.'
                : '재료를 등록하면 유통기한 알림과 맞춤 레시피를 뚝딱 알려드려요.'
            }
          >
            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => {
                  setBarcodePrefillMaster(null);
                  setIsManualModalOpen(true);
                }}
                className="flex min-h-[46px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 font-bold text-sm text-white shadow-soft hover:bg-brand-600 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>재료 직접 추가</span>
              </button>
            </div>
          </EmptyState>
        )}
      </section>

      {/* 5. 소비기한 만료 영역 (dDay < 0) - 화면 하단 격리 */}
      {expiredItems.length > 0 && (
        <ExpiredIngredientsSection
          items={expiredItems}
          onConsume={(item) => setConsumingItem(item)}
          onExtend={handleExtendExpired}
          onDiscard={handleDelete}
        />
      )}

      {/* --- 모달 레이어 --- */}

      {/* 수동 재료 등록 모달 */}
      <ManualAddModal
        open={isManualModalOpen}
        initialMaster={barcodePrefillMaster}
        onClose={() => {
          setIsManualModalOpen(false);
          setBarcodePrefillMaster(null);
        }}
        onAdd={handleAddManual}
      />

      {/* 바코드 카메라 스캐너 모달 */}
      <BarcodeScannerModal
        open={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        onScanSuccess={handleBarcodeSuccess}
        onManualSwitch={() => {
          setIsBarcodeModalOpen(false);
          setIsManualModalOpen(true);
        }}
      />

      {/* 영수증 OCR 스캔 및 수동 검수 모달 */}
      <ReceiptOcrModal
        open={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onAddBatch={handleAddBatch}
        onManualSwitch={() => {
          setIsReceiptModalOpen(false);
          setIsManualModalOpen(true);
        }}
      />

      {/* 소비 완료 차감 팝업 */}
      <ConsumeModal
        item={consumingItem}
        onClose={() => setConsumingItem(null)}
        onConfirm={handleConfirmConsume}
      />

      {/* 개별 인스턴스 수정 팝업 */}
      <EditIngredientModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
