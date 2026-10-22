import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBodyScrollLock } from '../useBodyScrollLock';

describe('useBodyScrollLock 커스텀 훅 단위 테스트', () => {
  it('locked=true일 때 document.body.style.overflow가 hidden으로 설정되고 언마운트 시 복원되어야 한다', () => {
    expect(document.body.style.overflow).toBe('');

    const { unmount } = renderHook(({ locked }) => useBodyScrollLock(locked), {
      initialProps: { locked: true },
    });

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('locked=false일 때는 body overflow에 영향을 주지 않아야 한다', () => {
    renderHook(() => useBodyScrollLock(false));
    expect(document.body.style.overflow).toBe('');
  });
});
