import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';
import { apiClient } from '@/services/apiClient';

/** FCM 푸시 알림 수신기 및 하이브리드 네이티브 연동 서비스 */
export class NativePushService {
  private static isInitialized = false;

  /**
   * 네이티브 푸시 알림 수신기 초기화 및 권한 요청
   * @param onAction - 사용자가 푸시 알림 클릭 시 실행될 딥링크 핸들러 콜백
   */
  public static async initPushNotifications(
    onAction?: (data: Record<string, any>) => void
  ): Promise<string | null> {
    // 웹 브라우저 환경인 경우 네이티브 푸시 스킵
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    if (this.isInitialized) {
      // 이미 초기화된 경우 저장된 토큰 백엔드 재동기화 시도
      NativePushService.sendTokenToBackend().catch(() => {});
      return localStorage.getItem('dduktak_fcm_token');
    }

    try {
      // 1. 푸시 알림 수신 권한 확인 및 요청
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('[FCM] 알림 권한이 거부되었습니다:', permStatus.receive);
        return null;
      }

      // 2. 안드로이드 8.0+ 필수 Notification Channel 생성 (중요도 HIGH로 시스템 팝업/Heads-up 허용)
      try {
        await PushNotifications.createChannel({
          id: 'dduktak_channel',
          name: '오늘의 뚝딱 알림',
          description: '소비기한 임박 및 레시피 소셜 알림',
          importance: 5, // IMPORTANCE_HIGH (팝업 및 소리)
          visibility: 1, // VISIBILITY_PUBLIC
          vibration: true,
          lights: true,
        });
        console.log('[FCM] Notification Channel(dduktak_channel) 생성 완료');
      } catch (channelErr) {
        console.warn('[FCM] Notification Channel 생성 경고:', channelErr);
      }

      // 3. 리스너 먼저 등록 (토큰 수신 및 백엔드 등록)
      await PushNotifications.addListener('registration', async (token) => {
        console.log('[FCM] Registration Token 수신 성공:', token.value.substring(0, 10) + '...');
        localStorage.setItem('dduktak_fcm_token', token.value);
        await NativePushService.sendTokenToBackend(token.value);
      });

      await PushNotifications.addListener('registrationError', (error) => {
        console.warn('[FCM] 토큰 등록 실패:', error);
      });

      // 4. 앱이 포그라운드(화면 켜진 상태)일 때 푸시 수신 시 인앱 토스트 노출
      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          toast.info(notification.title || '새 알림', {
            description: notification.body || '',
            duration: 4000,
          });
        }
      );

      // 5. 사용자가 시스템 푸시 알림 탭/클릭 시 딥링크 처리
      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action) => {
          const data = action.notification.data || {};
          if (onAction) {
            onAction(data);
          }
        }
      );

      // 6. APNs / FCM 토큰 발급 등록
      try {
        await PushNotifications.register();
      } catch (regError) {
        console.warn('[FCM] PushNotifications.register() 실패:', regError);
      }

      this.isInitialized = true;
      return localStorage.getItem('dduktak_fcm_token');
    } catch (err) {
      console.warn('[FCM] 푸시 알림 초기화 중 예외 발생 (앱 구동 계속):', err);
      return null;
    }
  }

  /**
   * 발급된 FCM 디바이스 토큰을 백엔드 서버(POST /api/v1/notifications/fcm-token)로 전송
   */
  public static async sendTokenToBackend(fcmToken?: string | null): Promise<void> {
    const token = fcmToken || localStorage.getItem('dduktak_fcm_token');
    if (!token) {
      console.debug('[FCM] 저장된 디바이스 토큰이 없어 백엔드 전송을 건너뜁니다.');
      return;
    }

    try {
      // 올바른 백엔드 엔드포인트: /api/v1/notifications/fcm-token
      await apiClient.post('/api/v1/notifications/fcm-token', { token });
      console.log('[FCM] 디바이스 토큰 백엔드(/api/v1/notifications/fcm-token) 동기화 완료!');
    } catch (e: any) {
      // 비로그인 상태(401) 또는 일시 네트워크 오류 시 경고 로그만 남김
      console.warn('[FCM] 디바이스 토큰 백엔드 동기화 보류 (로그인 후 자동 전송):', e?.response?.status || e?.message);
    }
  }

  /** 리스너 정리 및 등록 해제 */
  public static async cleanup() {
    if (Capacitor.isNativePlatform() && this.isInitialized) {
      await PushNotifications.removeAllListeners();
      this.isInitialized = false;
    }
  }
}
