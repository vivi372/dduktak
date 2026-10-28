import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PencilLine, Receipt, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useBodyScrollLock } from '@/hooks';

interface QuickAddTrayProps {
  open: boolean;
  onClose: () => void;
  onSelectAction?: (key: 'manual' | 'receipt') => void;
}

const ALL_ACTIONS = [
  { key: 'manual', label: '직접 입력', desc: '재료 이름과 소비기한을 직접 적어요', Icon: PencilLine },
  { key: 'receipt', label: '영수증 스캔', desc: '영수증 사진 한 장으로 한 번에 등록해요', Icon: Receipt },
] as const;

/** FAB에서 열리는 재료 퀵 등록 바텀시트 (Thumb Zone) */
export function QuickAddTray({ open, onClose, onSelectAction }: QuickAddTrayProps) {
  const navigate = useNavigate();

  // 바텀시트 오픈 시 뒷배경 스크롤 방지
  useBodyScrollLock(open);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSelect = (key: 'manual' | 'receipt') => {
    onClose();
    if (onSelectAction) {
      onSelectAction(key);
    } else {
      navigate(`${ROUTES.INVENTORY}?action=${key}`);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="재료 추가 방법 선택">
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[480px] rounded-t-[28px] bg-background px-5 pb-safe pt-3 shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" aria-hidden />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold">재료 추가하기</h2>
                <p className="text-xs text-muted-foreground">어떤 방법으로 냉장고에 넣어 볼까요?</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-accent active:scale-95"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 pb-6">
              {ALL_ACTIONS.map(({ key, label, desc, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(key)}
                  className="flex min-h-[64px] items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-3.5 text-left transition-all hover:border-brand-500/40 hover:bg-brand-500/5 active:scale-[0.99]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-foreground">{label}</div>
                    <div className="truncate text-xs text-muted-foreground">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
