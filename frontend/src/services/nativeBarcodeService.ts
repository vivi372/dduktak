/**
 * Capacitor 6.x & Google ML Kit 네이티브 바코드 스캐너 추상화 서비스
 * - Capacitor.isNativePlatform() 기반 모바일 실기기 / 웹 브라우저 런타임 환경 감지
 * - Android Google Play 서비스 ML Kit 바코드 모듈 가용성 점검 및 자동 설치
 * - 카메라 권한 요청 및 네이티브 Google Barcode Scanner Activity 구동
 */

import { Capacitor } from '@capacitor/core';
import {
  BarcodeScanner,
  BarcodeFormat,
  type Barcode,
} from '@capacitor-mlkit/barcode-scanning';

export interface NativeScanResult {
  /** 스캔 성공 여부 (취소 시 false) */
  success: boolean;
  /** 스캔된 바코드 번호 (성공 시 유효한 문자열) */
  barcodeNo?: string;
  /** 스캔된 바코드 형식 (예: EAN_13, QR_CODE 등) */
  format?: BarcodeFormat | string;
  /** 오류 발생 시 에러 메시지 */
  errorMessage?: string;
  /** 사용자가 직접 스캔을 취소했는지 여부 */
  isCancelled?: boolean;
}

/**
 * 현재 실행 환경이 Capacitor 네이티브 모바일 플랫폼(Android/iOS)인지 여부 반환
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Android 환경에서 Google Play 서비스 ML Kit 바코드 스캐너 모듈 점검 및 설치
 */
export async function ensureGoogleBarcodeScannerModule(): Promise<boolean> {
  if (!isNativePlatform()) return true;

  try {
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (!available) {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
    }
    return true;
  } catch (error) {
    console.warn('[BarcodeScanner] Google ML Kit 모듈 점검 실패 (오프라인 모드로 폴백):', error);
    return false;
  }
}

/**
 * 네이티브 카메라 접근 권한 확인 및 요청
 */
export async function requestCameraPermission(): Promise<boolean> {
  if (!isNativePlatform()) return true;

  try {
    const status = await BarcodeScanner.checkPermissions();
    if (status.camera === 'granted') {
      return true;
    }

    const requestStatus = await BarcodeScanner.requestPermissions();
    return requestStatus.camera === 'granted';
  } catch (error) {
    console.error('[BarcodeScanner] 카메라 권한 요청 실패:', error);
    return false;
  }
}

/**
 * Google ML Kit 네이티브 바코드 스캐너 실행
 * 식료품 유통 규격 바코드(EAN-13, EAN-8, UPC, QR코드 등)를 초고속으로 인식합니다.
 */
export async function scanBarcodeNative(): Promise<NativeScanResult> {
  if (!isNativePlatform()) {
    return {
      success: false,
      errorMessage: '네이티브 모바일 기기에서만 지원되는 기능입니다.',
    };
  }

  try {
    // 1. 카메라 권한 확인
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return {
        success: false,
        errorMessage: '바코드를 스캔하려면 카메라 접근 권한이 필요합니다.',
      };
    }

    // 2. Google ML Kit 모듈 점검 및 자동 설치
    await ensureGoogleBarcodeScannerModule();

    // 3. Google Play 서비스 고성능 바코드 스캐너 Activity 구동
    const result = await BarcodeScanner.scan({
      formats: [
        BarcodeFormat.Ean13,
        BarcodeFormat.Ean8,
        BarcodeFormat.UpcA,
        BarcodeFormat.UpcE,
        BarcodeFormat.QrCode,
        BarcodeFormat.Code128,
      ],
    });

    const barcodes: Barcode[] = result.barcodes ?? [];
    if (barcodes.length === 0) {
      return {
        success: false,
        isCancelled: true,
      };
    }

    const firstBarcode = barcodes[0];
    const barcodeNo = firstBarcode.displayValue || firstBarcode.rawValue || '';

    if (!barcodeNo) {
      return {
        success: false,
        isCancelled: true,
      };
    }

    return {
      success: true,
      barcodeNo: barcodeNo.trim(),
      format: firstBarcode.format,
    };
  } catch (error: unknown) {
    // 사용자가 취소(Back button / X)했거나 예외 발생 시 처리
    const errString = String(error);
    if (errString.includes('canceled') || errString.includes('cancelled')) {
      return {
        success: false,
        isCancelled: true,
      };
    }

    console.error('[BarcodeScanner] 네이티브 스캔 실행 중 예외 발생:', error);
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : '바코드 스캔 중 오류가 발생했습니다.',
    };
  }
}
