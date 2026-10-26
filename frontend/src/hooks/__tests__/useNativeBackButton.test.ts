import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNativeBackButton } from '@/hooks/useNativeBackButton';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { toast } from 'sonner';

const mockNavigate = vi.fn();
let mockPathname = '/';

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(),
    exitApp: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}));

describe('useNativeBackButton 훅 단위 테스트', () => {
  let backButtonHandler: ((event: { canGoBack: boolean }) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/';
    backButtonHandler = null;

    vi.mocked(CapacitorApp.addListener).mockImplementation(
      ((eventName: string, handler: any) => {
        if (eventName === 'backButton') {
          backButtonHandler = handler;
        }
        return Promise.resolve({ remove: vi.fn() });
      }) as any
    );
  });

  it('웹 브라우저 환경에서는 리스너를 등록하지 않아야 한다', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    renderHook(() => useNativeBackButton());

    expect(CapacitorApp.addListener).not.toHaveBeenCalled();
  });

  it('네이티브 환경에서 서브 화면일 때 뒤로가기 버튼 누르면 navigate(-1)이 호출되어야 한다', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    mockPathname = '/recipes/1';

    renderHook(() => useNativeBackButton());

    expect(CapacitorApp.addListener).toHaveBeenCalledWith('backButton', expect.any(Function));
    expect(backButtonHandler).not.null;

    backButtonHandler!({ canGoBack: true });

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('활성화된 모달(dialog)이 있는 경우 뒤로가기 시 ESC 이벤트를 발송하고 navigate는 호출되지 않아야 한다', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    mockPathname = '/inventory';

    // 가상 dialog 엘리먼트 DOM 추가
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);

    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    renderHook(() => useNativeBackButton());
    backButtonHandler!({ canGoBack: true });

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'Escape' })
    );
    expect(mockNavigate).not.toHaveBeenCalled();

    document.body.removeChild(dialog);
  });

  it('홈 화면에서 1회 누르면 종료 경고 토스트가 뜨고, 2초 내 재입력 시 exitApp이 호출되어야 한다', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    mockPathname = '/';

    renderHook(() => useNativeBackButton());

    // 1회 클릭: 토스트 노출
    backButtonHandler!({ canGoBack: false });
    expect(toast.info).toHaveBeenCalledWith('한 번 더 누르면 앱이 종료됩니다.', expect.any(Object));
    expect(CapacitorApp.exitApp).not.toHaveBeenCalled();

    // 2초 내 다시 클릭: exitApp 실행
    backButtonHandler!({ canGoBack: false });
    expect(CapacitorApp.exitApp).toHaveBeenCalled();
  });
});
