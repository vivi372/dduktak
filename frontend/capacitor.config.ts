import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor 6.x 전역 하이브리드 모바일 앱 설정
 * - appId: 안드로이드 패키지 고유 식별자 (com.dduktak.app)
 * - appName: 모바일 홈 화면 노출 앱 이름 ('오늘의 뚝딱')
 * - webDir: Vite 번들 빌드 출력 디렉터리 ('dist')
 * - server.cleartext: 로컬 개발 환경(HTTP) 백엔드 API 통신 허용
 */
const config: CapacitorConfig = {
  appId: 'com.dduktak.app',
  appName: '오늘의 뚝딱',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: false,
      backgroundColor: '#FFF7F5',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
