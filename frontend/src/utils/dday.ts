import type { StorageType } from '@/types/inventory';

export type DDayTone = 'urgent' | 'warning' | 'safe' | 'info' | 'expired';

/**
 * D-Day 신호등 톤 결정 (06 가이드 4.4절)
 * - 기한 초과(음수): Deep Red / D-3 이내: 빨강 / D-7 이내: 주황 / 그 외: 안심(초록)
 * 실제 D-Day 연산은 서버(SQL)에서 수행하므로, 여기서는 표시 변환만 담당한다.
 */
export function getDDayTone(dDay: number): DDayTone {
  if (dDay < 0) return 'expired';
  if (dDay <= 3) return 'urgent';
  if (dDay <= 7) return 'warning';
  return 'safe';
}

/** D-Day 한글 라벨 (예: '소비기한 2일 남음', '오늘까지', '소비기한 1일 지남') */
export function formatDDay(dDay: number): string {
  if (dDay < 0) return `소비기한 ${Math.abs(dDay)}일 지남`;
  if (dDay === 0) return '오늘까지';
  return `소비기한 ${dDay}일 남음`;
}

/** D-Day 짧은 뱃지 라벨 (예: 'D-2', 'D-Day', 'D+1') */
export function formatDDayShort(dDay: number): string {
  if (dDay < 0) return `D+${Math.abs(dDay)}`;
  if (dDay === 0) return 'D-Day';
  return `D-${dDay}`;
}

/** 보관 장소 한글 라벨 */
export const STORAGE_LABEL: Record<StorageType, string> = {
  REFRIGERATED: '냉장',
  FROZEN: '냉동',
  ROOM_TEMP: '실온',
};
