import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isNativePlatform,
  requestCameraPermission,
  scanBarcodeNative,
} from '../nativeBarcodeService';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';

// Capacitor Core 및 BarcodeScanner 모킹
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

vi.mock('@capacitor-mlkit/barcode-scanning', () => ({
  BarcodeScanner: {
    isGoogleBarcodeScannerModuleAvailable: vi.fn(),
    installGoogleBarcodeScannerModule: vi.fn(),
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    scan: vi.fn(),
  },
  BarcodeFormat: {
    Ean13: 'EAN_13',
    Ean8: 'EAN_8',
    QrCode: 'QR_CODE',
    UpcA: 'UPC_A',
    UpcE: 'UPC_E',
    Code128: 'CODE_128',
  },
}));

describe('nativeBarcodeService - Capacitor 6.x Google ML Kit 바코드 스캐너 단위 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isNativePlatform', () => {
    it('Capacitor.isNativePlatform()이 true이면 true를 반환해야 한다', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      expect(isNativePlatform()).toBe(true);
    });

    it('Capacitor.isNativePlatform()이 false이면 false를 반환해야 한다 (웹 브라우저 환경)', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      expect(isNativePlatform()).toBe(false);
    });
  });

  describe('requestCameraPermission', () => {
    it('웹 브라우저 환경에서는 무조건 true를 반환해야 한다', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      const granted = await requestCameraPermission();
      expect(granted).toBe(true);
    });

    it('네이티브 환경에서 이미 권한이 부여된 경우 true를 반환해야 한다', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(BarcodeScanner.checkPermissions).mockResolvedValue({ camera: 'granted' } as never);

      const granted = await requestCameraPermission();
      expect(granted).toBe(true);
    });
  });

  describe('scanBarcodeNative', () => {
    it('웹 브라우저(비네이티브) 환경에서는 에러 메시지와 함께 success: false를 반환해야 한다', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

      const result = await scanBarcodeNative();
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('네이티브 모바일 기기에서만 지원');
    });

    it('네이티브 환경에서 카메라 권한이 거부되었을 때 권한 필요 에러를 반환해야 한다', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(BarcodeScanner.checkPermissions).mockResolvedValue({ camera: 'denied' } as never);
      vi.mocked(BarcodeScanner.requestPermissions).mockResolvedValue({ camera: 'denied' } as never);

      const result = await scanBarcodeNative();
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('카메라 접근 권한이 필요합니다');
    });

    it('네이티브 환경에서 정상 바코드 스캔 시 barcodeNo와 success: true를 반환해야 한다', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(BarcodeScanner.checkPermissions).mockResolvedValue({ camera: 'granted' } as never);
      vi.mocked(BarcodeScanner.isGoogleBarcodeScannerModuleAvailable).mockResolvedValue({ available: true } as never);
      vi.mocked(BarcodeScanner.scan).mockResolvedValue({
        barcodes: [
          {
            displayValue: '8801043014859',
            rawValue: '8801043014859',
            format: BarcodeFormat.Ean13,
          },
        ],
      } as never);

      const result = await scanBarcodeNative();
      expect(result.success).toBe(true);
      expect(result.barcodeNo).toBe('8801043014859');
      expect(result.format).toBe(BarcodeFormat.Ean13);
    });

    it('사용자가 스캔을 취소하거나 바코드가 감지되지 않았을 때 isCancelled: true를 반환해야 한다', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(BarcodeScanner.checkPermissions).mockResolvedValue({ camera: 'granted' } as never);
      vi.mocked(BarcodeScanner.isGoogleBarcodeScannerModuleAvailable).mockResolvedValue({ available: true } as never);
      vi.mocked(BarcodeScanner.scan).mockResolvedValue({
        barcodes: [],
      } as never);

      const result = await scanBarcodeNative();
      expect(result.success).toBe(false);
      expect(result.isCancelled).toBe(true);
    });
  });
});
