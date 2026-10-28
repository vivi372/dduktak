import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';

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
      return null;
    }

    try {
      // 1. 푸시 알림 수신 권한 확인 및 요청
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        return null;
      }

      // 2. 리스너 먼저 등록 (토큰 수신 및 에러 캡처)
      await PushNotifications.addListener('registration', (token) => {
        // 백엔드 API (POST /api/v1/notifications/fcm-token) 전달용 토큰 저장
        localStorage.setItem('dduktak_fcm_token', token.value);
      });

      await PushNotifications.addListener('registrationError', (error) => {
        console.warn('[FCM] 토큰 등록 실패:', error);
      });

      // 3. 앱이 포그라운드(화면 켜진 상태)일 때 푸시 수신 시 인앱 토스트 노출
      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          toast.info(notification.title || '새 알림', {
            description: notification.body || '',
            duration: 4000,
          });
        }
      );

      // 4. 사용자가 시스템 푸시 알림 탭/클릭 시 딥링크 처리
      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action) => {
          const data = action.notification.data || {};
          if (onAction) {
            onAction(data);
          }
        }
      );

      // 5. APNs / FCM 토큰 발급 등록
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

  /** 리스너 정리 및 등록 해제 */
  public static async cleanup() {
    if (Capacitor.isNativePlatform() && this.isInitialized) {
      await PushNotifications.removeAllListeners();
      this.isInitialized = false;
    }
  }
}
