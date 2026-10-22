import { useEffect } from 'react';

// 다중 모달 중첩 시 카운트 관리
let lockCount = 0;

/**
 * 모달 및 팝업 활성화 시 브라우저 뒷배경(body) 스크롤을 방지하는 커스텀 훅
 * @param locked true일 경우 body 스크롤 차단, false 또는 언마운트 시 복원
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    if (lockCount === 0) {
      document.body.style.overflow = 'hidden';
    }
    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [locked]);
}
