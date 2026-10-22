import { format, addDays } from 'date-fns';
import type { OcrParsedItem } from '@/types/inventory';

/**
 * 영수증 OCR 원문 및 신뢰도가 포함된 확장 품목 모델
 */
export interface OcrParsedItemWithRaw extends OcrParsedItem {
  /** 영수증에 인쇄되었던 원본 텍스트 */
  rawText: string;
  /** OCR 인식 신뢰도 (0 ~ 1) */
  confidence: number;
  /** 매핑된 표준 카테고리명 */
  categoryName: string;
}

/**
 * 영수증 OCR 스캔 결과 모의 품목 데이터 (5종)
 * - 채소, 정육, 유제품 등 실생활 마트 영수증 품목 기준
 * - 표준 마스터 식재료 74종 매핑 완료 상태
 */
export const mockOcrParsedItems: OcrParsedItemWithRaw[] = [
  {
    id: 'ocr-item-1',
    masterIngredientId: 2, // 대파
    name: '대파',
    rawText: '흙대파 1단 (국내산)',
    categoryId: 1,
    categoryName: '채소/과일',
    quantity: 1,
    unit: '단',
    recommendedExpireDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    dDay: 7,
    selected: true,
    confidence: 0.98,
  },
  {
    id: 'ocr-item-2',
    masterIngredientId: 1, // 양파
    name: '양파',
    rawText: '햇양파 1.5kg 망',
    categoryId: 1,
    categoryName: '채소/과일',
    quantity: 2,
    unit: '망',
    recommendedExpireDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    dDay: 14,
    selected: true,
    confidence: 0.96,
  },
  {
    id: 'ocr-item-3',
    masterIngredientId: 20, // 돼지고기 (삼겹살/목살)
    name: '돼지고기 (삼겹살/목살)',
    rawText: '국내산 한돈 삼겹살 500g',
    categoryId: 2,
    categoryName: '정육/계란',
    quantity: 500,
    unit: 'g',
    recommendedExpireDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    dDay: 3,
    selected: true,
    confidence: 0.99,
  },
  {
    id: 'ocr-item-4',
    masterIngredientId: 17, // 두부
    name: '두부',
    rawText: '국산콩 찌개용 부침두부 300g',
    categoryId: 1,
    categoryName: '채소/과일',
    quantity: 1,
    unit: '모',
    recommendedExpireDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    dDay: 5,
    selected: true,
    confidence: 0.94,
  },
  {
    id: 'ocr-item-5',
    masterIngredientId: 18, // 계란
    name: '계란',
    rawText: '무항생제 신선란 10구 대란',
    categoryId: 2,
    categoryName: '정육/계란',
    quantity: 10,
    unit: '개',
    recommendedExpireDate: format(addDays(new Date(), 21), 'yyyy-MM-dd'),
    dDay: 21,
    selected: true,
    confidence: 0.97,
  },
];

/**
 * 영수증 OCR 인식 실패 (글자 미인식, 손상된 영수증) 모의 데이터
 */
export const mockOcrEmptyScan: OcrParsedItemWithRaw[] = [];

/**
 * 실시간 미리보기용 샘플 영수증 모의 이미지 (Data URI)
 */
export const SAMPLE_RECEIPT_PREVIEW_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420" fill="none">
      <rect width="300" height="420" rx="16" fill="#FFFDF7" stroke="#E2E8F0" stroke-width="2"/>
      <rect x="24" y="24" width="252" height="32" rx="6" fill="#F1F5F9"/>
      <text x="150" y="45" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0F172A" text-anchor="middle">뚝딱마트 강남점 영수증</text>
      <line x1="24" y1="72" x2="276" y2="72" stroke="#CBD5E1" stroke-dasharray="4 4" stroke-width="1.5"/>
      <text x="28" y="96" font-family="sans-serif" font-size="11" fill="#64748B">2026-10-22 18:42:15 [정상승인]</text>
      <line x1="24" y1="112" x2="276" y2="112" stroke="#E2E8F0" stroke-width="1"/>
      <text x="28" y="136" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1E293B">흙대파 1단</text>
      <text x="272" y="136" font-family="sans-serif" font-size="12" fill="#1E293B" text-anchor="end">2,980원</text>
      <text x="28" y="168" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1E293B">햇양파 1.5kg 망</text>
      <text x="272" y="168" font-family="sans-serif" font-size="12" fill="#1E293B" text-anchor="end">4,500원</text>
      <text x="28" y="200" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1E293B">한돈 삼겹살 500g</text>
      <text x="272" y="200" font-family="sans-serif" font-size="12" fill="#1E293B" text-anchor="end">13,800원</text>
      <text x="28" y="232" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1E293B">국산콩 부침두부</text>
      <text x="272" y="232" font-family="sans-serif" font-size="12" fill="#1E293B" text-anchor="end">1,890원</text>
      <text x="28" y="264" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1E293B">신선란 10구 대란</text>
      <text x="272" y="264" font-family="sans-serif" font-size="12" fill="#1E293B" text-anchor="end">4,200원</text>
      <line x1="24" y1="290" x2="276" y2="290" stroke="#CBD5E1" stroke-dasharray="4 4" stroke-width="1.5"/>
      <text x="28" y="320" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0F172A">총 구매금액</text>
      <text x="272" y="320" font-family="sans-serif" font-size="15" font-weight="900" fill="#FF8A7A" text-anchor="end">27,370원</text>
      <rect x="24" y="350" width="252" height="42" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="150" y="376" font-family="sans-serif" font-size="11" fill="#94A3B8" text-anchor="middle">바코드: 8801234567890</text>
    </svg>
  `);
