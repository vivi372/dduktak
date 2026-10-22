import { useState, useRef, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface CustomDatePickerProps {
  /** YYYY-MM-DD 형식의 선택된 날짜 문자열 */
  value: string;
  /** 날짜 변경 콜백 */
  onChange: (dateStr: string) => void;
  /** 최소 선택 가능 날짜 (선택) */
  minDate?: string;
  /** 라벨 텍스트 */
  label?: string;
  /** 인라인 확장 모드 (absolute 팝오버 대신 부모 흐름 내에서 아래 요소를 자연스럽게 밀어내는 방식) */
  inline?: boolean;
  /** 추가 클래스 */
  className?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 오늘의 뚝딱 모던 커스텀 데이트피커 (CustomDatePicker)
 * - 브라우저 기본 투박한 OS 날짜 팝업을 대체하는 브랜드 테마형 캘린더
 * - 전월/익월 네비게이션, 오늘 바로가기, D-Day 신호등 배지 연동
 */
export function CustomDatePicker({
  value,
  onChange,
  inline = false,
  className,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 현재 캘린더가 보여주는 기준 년/월
  const selectedDate = value ? parseISO(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate);

  // value가 외부에서 바뀌면 currentMonth 동기화
  useEffect(() => {
    if (value) {
      setCurrentMonth(parseISO(value));
    }
  }, [value]);

  // 바깥 클릭 시 캘린더 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // D-Day 계산
  const dDay = (() => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = selectedDate;
      target.setHours(0, 0, 0, 0);
      return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  })();

  // 월간 날짜 그리드 생성
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleSelectDay = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const handleJumpToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    setCurrentMonth(today);
    onChange(format(today, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* 1. 트리거 인풋 카드 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3.5 text-left text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 active:scale-[0.99]',
          isOpen ? 'border-brand-500 ring-2 ring-brand-500/20' : 'hover:border-brand-500/50',
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Calendar className="h-4 w-4 shrink-0 text-brand-500" />
          <span className="font-bold text-foreground truncate">
            {format(selectedDate, 'yyyy년 M월 d일 (E)', { locale: ko })}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              'rounded-lg px-2 py-0.5 text-xs font-extrabold',
              dDay <= 3
                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                : dDay <= 7
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
            )}
          >
            {dDay === 0 ? 'D-Day' : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`}
          </span>
        </div>
      </button>

      {/* 2. 커스텀 캘린더 (inline 확장형 vs absolute 팝오버) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-4 shadow-xl ring-1 ring-black/5 dark:ring-white/10',
              inline
                ? 'relative mt-2 w-full shadow-md'
                : 'absolute left-0 right-0 top-full z-50 mt-1.5 shadow-2xl ring-black/10',
            )}
          >
            {/* 캘린더 헤더 (년월 & 월 이동) */}
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-border/60 gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm font-extrabold text-foreground whitespace-nowrap">
                  {format(currentMonth, 'yyyy년 M월')}
                </span>
                <button
                  type="button"
                  onClick={handleJumpToday}
                  className="shrink-0 whitespace-nowrap rounded-md bg-muted px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  오늘
                </button>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg border hover:bg-accent text-muted-foreground transition-colors"
                  aria-label="이전 달"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg border hover:bg-accent text-muted-foreground transition-colors"
                  aria-label="다음 달"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground transition-colors ml-0.5"
                  aria-label="달력 닫기"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 요일 헤더 */}
            <div className="mt-2 grid grid-cols-7 text-center">
              {WEEKDAYS.map((day, idx) => (
                <span
                  key={day}
                  className={cn(
                    'py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold',
                    idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-muted-foreground',
                  )}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="mt-1 grid grid-cols-7 gap-0.5 sm:gap-1">
              {calendarDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isDayToday = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={cn(
                      'flex h-7 sm:h-8 w-full items-center justify-center rounded-lg sm:rounded-xl text-xs font-semibold transition-all',
                      !isCurrentMonth && 'text-muted-foreground/30',
                      isCurrentMonth && !isSelected && 'text-foreground hover:bg-brand-50 dark:hover:bg-slate-800',
                      isDayToday && !isSelected && 'border border-brand-500 text-brand-600 font-bold',
                      isSelected &&
                        'bg-brand-500 text-white font-extrabold shadow-soft scale-105 hover:bg-brand-600',
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
