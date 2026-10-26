import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativePushService } from '@/services/nativePushService';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    register: vi.fn(),
    addListener: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}));

describe('NativePushService 단위 테스트', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    // 싱글톤 상태 리셋을 위해 cleanup 호출
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    await NativePushService.cleanup();
  });

  it('웹 브라우저 환경에서는 푸시 알림 등록을 건너뛰어야 한다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    const token = await NativePushService.initPushNotifications();

    expect(token).toBeNull();
    expect(PushNotifications.register).not.toHaveBeenCalled();
  });

  it('네이티브 환경에서 권한이 승인되면 register 및 리스너 등록이 정상 수행되어야 한다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(PushNotifications.checkPermissions).mockResolvedValue({
      receive: 'granted',
    } as any);

    const listeners: Record<string, Function> = {};
    vi.mocked(PushNotifications.addListener).mockImplementation(((event: string, cb: Function) => {
      listeners[event] = cb;
      return Promise.resolve({ remove: vi.fn() });
    }) as any);

    await NativePushService.initPushNotifications();

    expect(PushNotifications.register).toHaveBeenCalled();
    expect(PushNotifications.addListener).toHaveBeenCalledWith('registration', expect.any(Function));
    expect(PushNotifications.addListener).toHaveBeenCalledWith('pushNotificationReceived', expect.any(Function));
    expect(PushNotifications.addListener).toHaveBeenCalledWith('pushNotificationActionPerformed', expect.any(Function));

    // 토큰 발급 콜백 실행 시 localStorage 저장 확인
    listeners['registration']?.({ value: 'sample-fcm-token-1234' });
    expect(localStorage.getItem('dduktak_fcm_token')).toBe('sample-fcm-token-1234');

    // 포그라운드 알림 수신 시 Sonner Toast 호출 확인
    listeners['pushNotificationReceived']?.({
      title: '소비기한 임박!',
      body: '달걀 유통기한이 1일 남았어요.',
    });
    expect(toast.info).toHaveBeenCalledWith('소비기한 임박!', expect.objectContaining({
      description: '달걀 유통기한이 1일 남았어요.',
    }));
  });
});
