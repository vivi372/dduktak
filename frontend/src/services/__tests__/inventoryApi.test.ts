import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as inventoryApi from '@/services/inventoryApi';
import { apiClient } from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('inventoryApi 서비스 단위 테스트 (05_API_SPECIFICATION.md 3.2절)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMasterIngredients는 GET /api/v1/inventory/master-ingredients를 파라미터와 함께 호출해야 한다', async () => {
    const mockMasters = [
      {
        masterIngredientId: 1,
        categoryId: 2,
        categoryName: '정육/계란',
        name: '계란',
        defaultUnit: '개',
        defaultShelfDays: 7,
      },
    ];

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { success: true, data: mockMasters, message: '조회 완료' },
    });

    const result = await inventoryApi.getMasterIngredients({ query: '계란', categoryId: 2 });

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/inventory/master-ingredients', {
      params: { query: '계란', categoryId: 2 },
    });
    expect(result).toEqual(mockMasters);
  });

  it('getMyIngredients는 GET /api/v1/inventory를 호출하고 냉장고 재료 목록을 반환해야 한다', async () => {
    const mockItems = [
      {
        ingredientId: 10,
        masterIngredientId: 2,
        categoryId: 2,
        name: '계란',
        storageType: 'REFRIGERATED',
        quantity: 10,
        unit: '개',
        expireDate: '2026-10-30',
        dDay: 5,
      },
    ];

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { success: true, data: mockItems, message: '조회 완료' },
    });

    const result = await inventoryApi.getMyIngredients({ status: 'ACTIVE' });

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/inventory', {
      params: { status: 'ACTIVE' },
    });
    expect(result).toEqual(mockItems);
  });

  it('createIngredient는 POST /api/v1/inventory를 호출하고 독립 레코드 생성 응답을 반환해야 한다', async () => {
    const requestDto = {
      masterIngredientId: 2,
      storageType: 'REFRIGERATED' as const,
      quantity: 5,
      unit: '개',
      expireDate: '2026-10-30',
      memo: '신선란',
    };

    const mockResponse = {
      ingredientId: 101,
      name: '계란',
      memo: '신선란',
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { success: true, data: mockResponse, message: '등록 완료' },
    });

    const result = await inventoryApi.createIngredient(requestDto);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/inventory', requestDto);
    expect(result.ingredientId).toBe(101);
  });

  it('updateIngredient는 PUT /api/v1/inventory/{id}를 호출해야 한다', async () => {
    const updateDto = {
      storageType: 'FROZEN' as const,
      quantity: 3,
      unit: '개',
      expireDate: '2026-11-15',
      memo: '냉동 보관 전환',
    };

    vi.mocked(apiClient.put).mockResolvedValueOnce({
      data: {
        success: true,
        data: { ingredientId: 10, quantity: 3, memo: '냉동 보관 전환' },
        message: '수정 완료',
      },
    });

    const result = await inventoryApi.updateIngredient(10, updateDto);

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/inventory/10', updateDto);
    expect(result.quantity).toBe(3);
  });

  it('deleteIngredient는 DELETE /api/v1/inventory/{id}를 호출해야 한다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({
      data: { success: true, data: null, message: '삭제 완료' },
    });

    await inventoryApi.deleteIngredient(10);

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/inventory/10');
  });

  it('consumeIngredient는 PATCH /api/v1/inventory/{id}/consume을 호출해야 한다', async () => {
    const mockResponse = {
      ingredientId: 10,
      remainingQuantity: 0,
      status: 'CONSUMED' as const,
    };

    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      data: { success: true, data: mockResponse, message: '소비 완료' },
    });

    const result = await inventoryApi.consumeIngredient(10, { consumeQuantity: 5 });

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/inventory/10/consume', {
      consumeQuantity: 5,
    });
    expect(result.status).toBe('CONSUMED');
  });

  it('scanReceiptOcr은 multipart/form-data 헤더로 POST /api/v1/inventory/scan-ocr을 호출해야 한다', async () => {
    const mockFile = new File(['dummy content'], 'receipt.jpg', { type: 'image/jpeg' });
    const mockOcrResult = [
      {
        masterIngredientId: 2,
        name: '계란',
        quantity: 10,
        unit: '개',
        recommendedExpireDate: '2026-10-31',
      },
    ];

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { success: true, data: mockOcrResult, message: 'OCR 완료' },
    });

    const result = await inventoryApi.scanReceiptOcr(mockFile);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/inventory/scan-ocr',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('계란');
  });
});
