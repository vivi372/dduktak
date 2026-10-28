import { useEffect, useRef } from 'react';

// 다중 모달 중첩 시 카운트 관리
let lockCount = 0;
// 다중 모달 중첩 시 최상단 모달만 닫기 위한 콜백 스택 (LIFO)
const closeStack: Array<() => void> = [];

/**
 * 모달 및 팝업 활성화 시 브라우저 뒷배경(body) 스크롤을 방지하고
 * ESC 키(웹) 및 안드로이드 물리 뒤로가기 버튼 입력 시 모달을 닫아주는 커스텀 훅
 * @param locked true일 경우 body 스크롤 차단 및 ESC 리스너 활성화
 * @param onClose 선택: ESC 키 또는 물리 뒤로가기 입력 시 호출할 닫기 콜백
 */
export function useBodyScrollLock(locked: boolean, onClose?: () => void): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!locked) return;

    if (lockCount === 0) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = 'hidden';
    }
    lockCount += 1;

    const closeHandler = () => {
      onCloseRef.current?.();
    };

    if (onCloseRef.current) {
      closeStack.push(closeHandler);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeStack.length > 0) {
        const topHandler = closeStack[closeStack.length - 1];
        if (topHandler === closeHandler) {
          e.stopPropagation();
          closeHandler();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      const idx = closeStack.lastIndexOf(closeHandler);
      if (idx !== -1) {
        closeStack.splice(idx, 1);
      }
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };
  }, [locked]);
}
