import { describe, it, expect } from 'vitest';
import { getDDayTone, formatDDay, formatDDayShort, STORAGE_LABEL } from '@/utils/dday';

describe('dday 유틸리티 단위 테스트', () => {
  describe('getDDayTone - D-Day 신호등 톤 결정', () => {
    it('음수(소비기한 초과)인 경우 "expired"를 반환해야 한다', () => {
      expect(getDDayTone(-1)).toBe('expired');
      expect(getDDayTone(-10)).toBe('expired');
    });

    it('0일 이상 3일 이하(임박)인 경우 "urgent"를 반환해야 한다', () => {
      expect(getDDayTone(0)).toBe('urgent');
      expect(getDDayTone(1)).toBe('urgent');
      expect(getDDayTone(3)).toBe('urgent');
    });

    it('4일 이상 7일 이하(주의)인 경우 "warning"를 반환해야 한다', () => {
      expect(getDDayTone(4)).toBe('warning');
      expect(getDDayTone(7)).toBe('warning');
    });

    it('8일 이상(안심)인 경우 "safe"를 반환해야 한다', () => {
      expect(getDDayTone(8)).toBe('safe');
      expect(getDDayTone(30)).toBe('safe');
    });
  });

  describe('formatDDay - D-Day 상세 한글 라벨', () => {
    it('소비기한 초과 시 "소비기한 N일 지남"으로 포맷팅되어야 한다', () => {
      expect(formatDDay(-1)).toBe('소비기한 1일 지남');
      expect(formatDDay(-5)).toBe('소비기한 5일 지남');
    });

    it('D-Day 당일(0)인 경우 "오늘까지"로 포맷팅되어야 한다', () => {
      expect(formatDDay(0)).toBe('오늘까지');
    });

    it('소비기한이 남은 경우 "소비기한 N일 남음"으로 포맷팅되어야 한다', () => {
      expect(formatDDay(1)).toBe('소비기한 1일 남음');
      expect(formatDDay(7)).toBe('소비기한 7일 남음');
    });
  });

  describe('formatDDayShort - D-Day 축약 뱃지 라벨', () => {
    it('기한 초과 시 "D+N" 형태여야 한다', () => {
      expect(formatDDayShort(-1)).toBe('D+1');
      expect(formatDDayShort(-3)).toBe('D+3');
    });

    it('당일(0)인 경우 "D-Day" 형태여야 한다', () => {
      expect(formatDDayShort(0)).toBe('D-Day');
    });

    it('기한 남음인 경우 "D-N" 형태여야 한다', () => {
      expect(formatDDayShort(3)).toBe('D-3');
      expect(formatDDayShort(14)).toBe('D-14');
    });
  });

  describe('STORAGE_LABEL - 보관 장소 한글 라벨 매핑', () => {
    it('보관 장소 상수 매핑이 올바르게 정의되어 있어야 한다', () => {
      expect(STORAGE_LABEL.REFRIGERATED).toBe('냉장');
      expect(STORAGE_LABEL.FROZEN).toBe('냉동');
      expect(STORAGE_LABEL.ROOM_TEMP).toBe('실온');
    });
  });
});
