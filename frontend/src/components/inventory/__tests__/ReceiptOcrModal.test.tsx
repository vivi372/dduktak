import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReceiptOcrModal } from '../ReceiptOcrModal';
import { mockOcrParsedItems } from '@/mocks/ocr_scan.mock';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

// sonner toast 모킹
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ReceiptOcrModal 영수증 OCR 스캔 및 수동 검수 통합 단위 테스트', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onAddBatch: vi.fn(),
    onManualSwitch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. 이미지 선택 진입점 (모바일/PC 차별화 - STEP 1: UPLOAD)', () => {
    it('모바일 진입점: 카메라 직접 촬영 및 갤러리 선택 액션이 렌더링되어야 한다', () => {
      renderWithProviders(<ReceiptOcrModal {...defaultProps} initialStep="UPLOAD" />);

      // 모바일 전용 버튼 2종
      expect(screen.getByText('카메라로 직접 촬영')).toBeInTheDocument();
      expect(screen.getByText('앨범 / 갤러리에서 선택')).toBeInTheDocument();

      // 숨겨진 파일 인풋 검증 (카메라용 capture 속성 포함)
      const cameraInput = screen.getByTestId('camera-input');
      expect(cameraInput).toHaveAttribute('accept', 'image/*');
      expect(cameraInput).toHaveAttribute('capture', 'environment');

      const galleryInput = screen.getByTestId('gallery-input');
      expect(galleryInput).toHaveAttribute('accept', 'image/*');
    });

    it('PC 진입점: 드래그 앤 드롭 업로드 영역 및 안내 문구가 렌더링되어야 한다', () => {
      renderWithProviders(<ReceiptOcrModal {...defaultProps} initialStep="UPLOAD" />);

      expect(
        screen.getByRole('region', { name: 'PC 영수증 이미지 드래그 앤 드롭 업로드 영역' })
      ).toBeInTheDocument();
      expect(screen.getByText('영수증 이미지를 여기에 끌어다 놓으세요')).toBeInTheDocument();
      expect(screen.getByText(/PNG, JPG, WEBP 지원/)).toBeInTheDocument();
    });

    it('빠른 테스트용 샘플 영수증 체험 버튼 클릭 시 스캔 로딩(SCANNING) 단계로 전이되어야 한다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ReceiptOcrModal {...defaultProps} initialStep="UPLOAD" />);

      const sampleBtn = screen.getByRole('button', { name: /샘플 영수증으로 바로 체험하기/ });
      await user.click(sampleBtn);

      // SCANNING 단계의 텍스트가 노출되는지 확인
      await waitFor(() => {
        expect(screen.getByText('영수증을 똑똑하게 분석하고 있어요')).toBeInTheDocument();
        expect(screen.getByText(/Gemini Flash OCR/)).toBeInTheDocument();
      });
    });
  });

  describe('2. 스캔 로딩 UX (STEP 2: SCANNING)', () => {
    it('분석 진행 중 프로그레스 바와 4행 Skeleton UI가 노출되어야 한다', () => {
      renderWithProviders(<ReceiptOcrModal {...defaultProps} initialStep="SCANNING" />);

      expect(screen.getByText('영수증을 똑똑하게 분석하고 있어요')).toBeInTheDocument();
      expect(screen.getByText(/Gemini Flash OCR/)).toBeInTheDocument();

      // 예외 테스트 버튼이 노출되는지 확인
      expect(screen.getByText(/미인식 실패 예외 화면으로 건너뛰기/)).toBeInTheDocument();
    });
  });

  describe('3. 수동 검수 모달 (STEP 3: REVIEW - ocr_scan.mock.ts 기반)', () => {
    it('목 데이터 기반 품목 목록, 표준 매핑 배지 및 전체 선택 상태를 렌더링해야 한다', () => {
      renderWithProviders(<ReceiptOcrModal {...defaultProps} initialStep="REVIEW" />);

      // 헤더 및 전체 선택 바 확인
      expect(screen.getByRole('heading', { name: '영수증 OCR 결과 검수' })).toBeInTheDocument();
      expect(screen.getByText(`전체 선택 (${mockOcrParsedItems.length}/${mockOcrParsedItems.length}개)`)).toBeInTheDocument();

      // 5종 표준 식재료 이름 노출 확인
      expect(screen.getByText('대파')).toBeInTheDocument();
      expect(screen.getByText('양파')).toBeInTheDocument();
      expect(screen.getByText('돼지고기 (삼겹살/목살)')).toBeInTheDocument();
      expect(screen.getByText('두부')).toBeInTheDocument();
      expect(screen.getByText('계란')).toBeInTheDocument();

      // 자동 분류 완료 배지 노출 확인
      const mappedBadges = screen.getAllByText('자동 분류 완료');
      expect(mappedBadges.length).toBe(mockOcrParsedItems.length);
    });

    it('수량 증감(+/-) 버튼은 44px+ 터치 타겟을 준수하며 수량이 정상 변경되어야 한다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ReceiptOcrModal {...defaultProps} initialStep="REVIEW" />);

      // 대파 수량 증가 버튼 찾기
      const plusButton = screen.getByRole('button', { name: '대파 수량 증가' });
      // 모바일 접근성 터치 타겟 규격(44px 이상) 클래스 포함 여부 검증
      expect(plusButton).toHaveClass('min-w-[44px]');
      expect(plusButton).toHaveClass('min-h-[44px]');

      // 초기 수량: 1 단
      expect(screen.getByText('1 단')).toBeInTheDocument();

      // 수량 +1 클릭
      await user.click(plusButton);
      expect(screen.getByText('2 단')).toBeInTheDocument();

      // 수량 -1 클릭
      const minusButton = screen.getByRole('button', { name: '대파 수량 감소' });
      expect(minusButton).toHaveClass('min-w-[44px]');
      expect(minusButton).toHaveClass('min-h-[44px]');

      await user.click(minusButton);
      expect(screen.getByText('1 단')).toBeInTheDocument();
    });

    it('전체 선택 해제 및 개별 품목 선택 시 CTA 버튼의 수량이 실시간 연동되어야 한다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ReceiptOcrModal {...defaultProps} initialStep="REVIEW" />);

      const toggleAllBtn = screen.getByRole('button', { name: '전체 선택 토글' });
      const submitBtn = screen.getByRole('button', { name: /선택한 재료 5개 넣기/ });
      expect(submitBtn).toBeEnabled();

      // 전체 해제 클릭
      await user.click(toggleAllBtn);
      expect(screen.getByRole('button', { name: /선택한 재료 0개 넣기/ })).toBeDisabled();

      // '대파' 품목만 개별 체크
      const daepaCheckbox = screen.getByRole('checkbox', { name: /대파/ });
      await user.click(daepaCheckbox);

      const updatedSubmitBtn = screen.getByRole('button', { name: /선택한 재료 1개 넣기/ });
      expect(updatedSubmitBtn).toBeEnabled();
    });

    it('선택된 재료 넣기 CTA 클릭 시 onAddBatch가 호출되고 모달이 닫혀야 한다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ReceiptOcrModal {...defaultProps} initialStep="REVIEW" />);

      const submitBtn = screen.getByRole('button', { name: /선택한 재료 5개 넣기/ });
      await user.click(submitBtn);

      expect(defaultProps.onAddBatch).toHaveBeenCalledTimes(1);
      const addedItems = defaultProps.onAddBatch.mock.calls[0][0];
      expect(addedItems).toHaveLength(5);
      expect(addedItems[0].name).toBe('대파');
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. Fail-Safe 예외 처리 (STEP 4: FAIL_SAFE)', () => {
    it('인식 실패 시 안내 모달 및 수동 등록 전환 CTA가 렌더링되어야 한다', () => {
      renderWithProviders(<ReceiptOcrModal {...defaultProps} initialStep="FAIL_SAFE" />);

      expect(
        screen.getByText('영수증 글자를 선명하게 읽지 못했어요 😢')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/빛 반사나 구겨짐으로 인해 글자를 정확히 판독하기 어려워요/)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '직접 재료 등록하기 (수동 추가)' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '영수증 다시 찍기 / 사진 변경' })
      ).toBeInTheDocument();
    });

    it('직접 재료 등록하기 클릭 시 onManualSwitch가 호출되어 Combobox 모달로 화면이 리다이렉트되어야 한다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ReceiptOcrModal {...defaultProps} initialStep="FAIL_SAFE" />);

      const manualSwitchBtn = screen.getByRole('button', {
        name: '직접 재료 등록하기 (수동 추가)',
      });
      await user.click(manualSwitchBtn);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(defaultProps.onManualSwitch).toHaveBeenCalledTimes(1);
    });

    it('영수증 다시 찍기 클릭 시 STEP 1 (UPLOAD) 화면으로 복귀해야 한다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ReceiptOcrModal {...defaultProps} initialStep="FAIL_SAFE" />);

      const retryBtn = screen.getByRole('button', {
        name: '영수증 다시 찍기 / 사진 변경',
      });
      await user.click(retryBtn);

      // STEP 1의 업로드 화면으로 복귀 확인
      await waitFor(() => {
        expect(screen.getByText('카메라로 직접 촬영')).toBeInTheDocument();
        expect(screen.getByText('영수증 이미지를 여기에 끌어다 놓으세요')).toBeInTheDocument();
      });
    });
  });
});
