import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MoonStar, Info, Check, X, ChevronDown, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useBodyScrollLock } from '@/hooks';
import { cn } from '@/utils/cn';

interface QuietTimeModalProps {
  open: boolean;
  quietTimeStart: string; // "21:00:00"
  quietTimeEnd: string; // "08:00:00"
  onClose: () => void;
  onSave: (start: string, end: string) => Promise<void> | void;
  isSaving?: boolean;
}

// 00시부터 23시까지 1시간 단위 옵션
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, '0');
  return `${h}:00`;
});

/**
 * 둥근 라운드형 시간 선택 드롭다운 (OS 네이티브 각진 사각형 셀렉트 대체)
 */
function RoundTimeSelect({
  id,
  value,
  onChange,
  label,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // 외부 클릭 및 ESC 키 처리
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      // 열릴 때 현재 선택된 아이템으로 스크롤
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ block: 'nearest' });
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="block text-xs font-bold text-muted-foreground">
        {label}
      </label>

      {/* 둥근 트리거 버튼 */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-label={`${label} 선택`}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'mt-1.5 flex h-12 w-full items-center justify-between rounded-2xl border px-3.5 text-sm font-semibold transition-all duration-200',
          'bg-background hover:border-brand-300 dark:hover:border-brand-700 active:scale-[0.99]',
          isOpen
            ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-sm'
            : 'border-input shadow-xs',
        )}
      >
        <span className="flex items-center gap-2 text-foreground font-bold">
          <Clock className="h-4 w-4 text-brand-500 dark:text-brand-400" />
          {value}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180 text-brand-600',
          )}
        />
      </button>

      {/* 부드러운 둥근 드롭다운 팝오버 목록 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-52 overflow-y-auto rounded-2xl border border-border/80 bg-card p-1.5 shadow-2xl backdrop-blur-md dark:border-white/10"
          >
            {HOURS.map((h) => {
              const isSelected = h === value;
              return (
                <button
                  key={`${id}-${h}`}
                  ref={isSelected ? activeItemRef : null}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(h);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors',
                    isSelected
                      ? 'bg-brand-500 text-white shadow-xs font-bold'
                      : 'text-foreground hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/30 dark:hover:text-brand-200',
                  )}
                >
                  <span>{h}</span>
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 야간 방해금지 시간 설정 모달 (module_05_notification.md 및 module_01_user.md)
 * - 21:00 ~ 08:00 기본 시간대 설정
 * - 네이티브 직사각형 대신 서비스 테마와 통일된 라운드형 드롭다운 메뉴
 * - 야간 푸시 방지 정책 상시 안내 배너
 */
export function QuietTimeModal({
  open,
  quietTimeStart,
  quietTimeEnd,
  onClose,
  onSave,
  isSaving = false,
}: QuietTimeModalProps) {
  useBodyScrollLock(open);

  const [start, setStart] = useState('21:00');
  const [end, setEnd] = useState('08:00');

  useEffect(() => {
    if (open) {
      setStart(quietTimeStart.slice(0, 5) || '21:00');
      setEnd(quietTimeEnd.slice(0, 5) || '08:00');
    }
  }, [open, quietTimeStart, quietTimeEnd]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(`${start}:00`, `${end}:00`);
      toast.success(`방해금지 시간이 ${start} ~ ${end}로 설정되었습니다.`);
      onClose();
    } catch {
      // 에러는 전역 처리
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* 배경 딤 */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 모달 창 */}
          <motion.div
            className="relative w-full max-w-[420px] rounded-3xl border border-border bg-card p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <MoonStar className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold">야간 방해금지 시간 설정</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 상시 안내 배너 */}
            <div className="mt-3 rounded-2xl border border-brand-200 bg-brand-50/70 p-3.5 text-xs text-brand-900 dark:border-brand-800/60 dark:bg-brand-900/20 dark:text-brand-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" />
                <p className="leading-relaxed">
                  야간 푸시 방지 정책에 따라 설정된 시간대에는 소비기한 임박 알림 및 소셜 반응 푸시가 발송되지 않습니다.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <RoundTimeSelect
                  id="quiet-start"
                  label="시작 시간"
                  value={start}
                  onChange={setStart}
                />

                <RoundTimeSelect
                  id="quiet-end"
                  label="종료 시간"
                  value={end}
                  onChange={setEnd}
                />
              </div>

              <div className="mt-6 flex flex-row justify-end gap-2 border-t border-border/60 pt-4">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-full">
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> {isSaving ? '설정 중...' : '설정 완료'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
