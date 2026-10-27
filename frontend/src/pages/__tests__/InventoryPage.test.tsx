import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePlatformStore } from '@/store/usePlatformStore';
import { useAuthStore } from '@/store/useAuthStore';
import * as inventoryApi from '@/services/inventoryApi';
import type { InventoryItem } from '@/types/inventory';
import InventoryPage from '../InventoryPage';

// 테스트 전용 인라인 냉장고 더미
const mockInventory: InventoryItem[] = [
  {
    ingredientId: 101,
    masterIngredientId: 9,
    categoryId: 2,
    name: '계란',
    storageType: 'REFRIGERATED',
    quantity: 10,
    unit: '개',
    expireDate: '2026-10-24',
    dDay: 2,
    memo: '편의점 1+1 행사',
  },
  {
    ingredientId: 102,
    masterIngredientId: 9,
    categoryId: 2,
    name: '계란',
    storageType: 'REFRIGERATED',
    quantity: 15,
    unit: '개',
    expireDate: '2026-11-09',
    dDay: 18,
    memo: '본가에서 가져옴',
  },
  {
    ingredientId: 103,
    masterIngredientId: 1,
    categoryId: 1,
    name: '양파',
    storageType: 'ROOM_TEMP',
    quantity: 3,
    unit: '개',
    expireDate: '2026-10-27',
    dDay: 5,
    memo: '',
  },
  {
    ingredientId: 104,
    masterIngredientId: 49,
    categoryId: 2,
    name: '돼지고기 (삼겹살/목살)',
    storageType: 'FROZEN',
    quantity: 400,
    unit: 'g',
    expireDate: '2026-11-20',
    dDay: 29,
    memo: '소분 냉동',
  },
  {
    ingredientId: 105,
    masterIngredientId: 22,
    categoryId: 5,
    name: '만두 (냉동)',
    storageType: 'FROZEN',
    quantity: 1,
    unit: '봉지',
    expireDate: '2026-12-15',
    dDay: 54,
    memo: '',
  },
  {
    ingredientId: 106,
    masterIngredientId: 8,
    categoryId: 1,
    name: '두부',
    storageType: 'REFRIGERATED',
    quantity: 1,
    unit: '모',
    expireDate: '2026-10-20',
    dDay: -2, // 소비기한 도과
    memo: '',
  },
  {
    ingredientId: 107,
    masterIngredientId: 78,
    categoryId: 5,
    name: '떡국떡',
    storageType: 'REFRIGERATED',
    quantity: 500,
    unit: 'g',
    expireDate: '2026-10-18',
    dDay: -4, // 소비기한 도과
    memo: '',
  },
];

// sonner toast 모킹
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/services/inventoryApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/inventoryApi')>();
  return {
    ...actual,
    getMyIngredients: vi.fn().mockImplementation(() => Promise.resolve(mockInventory)),
  };
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('InventoryPage 내 냉장고 화면 통합 단위 테스트', () => {
  beforeEach(() => {
    usePlatformStore.setState({ isApp: true, isWeb: false, mode: 'app' });
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        userId: 'test-user',
        email: 'test@dduktak.com',
        nickname: '자취마스터',
        userTag: '0001',
        profileImage: '',
        status: 'ACTIVE',
        quietTimeStart: '21:00:00',
        quietTimeEnd: '08:00:00',
      },
    });
    vi.mocked(inventoryApi.getMyIngredients).mockResolvedValue(mockInventory);
  });

  it('타이틀 및 상단 3대 추가 CTA(재료 추가, 바코드, 영수증)를 렌더링해야 한다', () => {
    renderWithProviders(<InventoryPage />);

    expect(screen.getByRole('heading', { level: 1, name: '내 냉장고' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '재료 추가' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '바코드 스캔으로 재료 추가' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '영수증 스캔으로 재료 추가' })).toBeInTheDocument();
  });

  it('2-Tier 아코디언 메인 리스트에 대표 식재료 카드들이 렌더링되어야 한다', async () => {
    renderWithProviders(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: '계란' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: '양파' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: '돼지고기 (삼겹살/목살)' })).toBeInTheDocument();
    });
  });

  it('보관 장소 필터 탭(냉동) 클릭 시 냉동 재료만 필터링되어야 한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: '계란' })).toBeInTheDocument();
    });

    const frozenTab = screen.getByRole('tab', { name: '냉동' });
    await user.click(frozenTab);

    expect(screen.getByRole('heading', { level: 2, name: '만두 (냉동)' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: '양파' })).not.toBeInTheDocument();
  });

  it('검색창에 키워드 입력 시 재료명 또는 메모와 일치하는 카드만 노출되어야 한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: '계란' })).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/재료명 또는 메모로 검색/);
    await user.type(searchInput, '편의점'); // 계란 메모에 '편의점 1+1 행사' 포함

    expect(screen.getByRole('heading', { level: 2, name: '계란' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: '대파' })).not.toBeInTheDocument();
  });

  it('소비기한이 도과한 재료(두부, 떡국떡)는 하단 만료 영역 아코디언으로 분리되어야 한다', async () => {
    renderWithProviders(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText(/소비기한이 지난 재료 2개/)).toBeInTheDocument();
    });
  });

  it('바코드 버튼 클릭 시 바코드 스캔 모달이 열려야 한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);

    const barcodeBtn = screen.getByRole('button', { name: /바코드 스캔으로 재료 추가/ });
    await user.click(barcodeBtn);

    expect(screen.getByRole('heading', { name: '바코드 스캔' })).toBeInTheDocument();
    expect(screen.getByText('바코드를 사각 프레임 안에 맞춰주세요')).toBeInTheDocument();
  });

  it('영수증 버튼 클릭 시 영수증 OCR 등록 모달이 열려야 한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryPage />);

    const receiptBtn = screen.getByRole('button', { name: /영수증 스캔으로 재료 추가/ });
    await user.click(receiptBtn);

    expect(screen.getByRole('heading', { name: '영수증 스캔' })).toBeInTheDocument();
    expect(screen.getByText('장보고 받은 종이 영수증 사진을 올려주세요.')).toBeInTheDocument();
  });
});
