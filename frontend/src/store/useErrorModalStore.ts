/**
 * 전역 에러 모달 상태 스토어 (02_ARCHITECTURE_AND_CONVENTIONS.md 5.4절)
 * 백엔드 에러 코드의 UX 태그(_ALERT_, _CONFIRM_, _FATAL_) 수신 시
 * 사용자에게 일관된 대화상자(Modal Dialog)를 제공합니다.
 */

import { create } from 'zustand';

export type ErrorModalType = 'ALERT' | 'CONFIRM' | 'FATAL';

export interface OpenAlertParams {
  title?: string;
  message: string;
  traceId?: string;
  confirmText?: string;
  onConfirm?: () => void;
}

export interface OpenConfirmParams {
  title?: string;
  message: string;
  traceId?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface OpenFatalParams {
  title?: string;
  message: string;
  traceId?: string;
  onRetry?: () => void;
}

interface ErrorModalState {
  isOpen: boolean;
  type: ErrorModalType;
  title: string;
  message: string;
  traceId?: string;
  confirmText: string;
  cancelText: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;

  openAlert: (params: OpenAlertParams) => void;
  openConfirm: (params: OpenConfirmParams) => void;
  openFatal: (params: OpenFatalParams) => void;
  closeModal: () => void;
}

export const useErrorModalStore = create<ErrorModalState>((set) => ({
  isOpen: false,
  type: 'ALERT',
  title: '',
  message: '',
  traceId: undefined,
  confirmText: '확인',
  cancelText: '취소',
  onConfirm: undefined,
  onCancel: undefined,
  onRetry: undefined,

  openAlert: ({ title = '안내', message, traceId, confirmText = '확인', onConfirm }) => {
    set({
      isOpen: true,
      type: 'ALERT',
      title,
      message,
      traceId,
      confirmText,
      cancelText: '취소',
      onConfirm,
      onCancel: undefined,
      onRetry: undefined,
    });
  },

  openConfirm: ({
    title = '확인',
    message,
    traceId,
    confirmText = '확인',
    cancelText = '취소',
    onConfirm,
    onCancel,
  }) => {
    set({
      isOpen: true,
      type: 'CONFIRM',
      title,
      message,
      traceId,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
      onRetry: undefined,
    });
  },

  openFatal: ({ title = '시스템 오류', message, traceId, onRetry }) => {
    set({
      isOpen: true,
      type: 'FATAL',
      title,
      message,
      traceId,
      confirmText: '다시 시도',
      cancelText: '닫기',
      onRetry,
      onConfirm: onRetry,
      onCancel: undefined,
    });
  },

  closeModal: () => {
    set({
      isOpen: false,
      onConfirm: undefined,
      onCancel: undefined,
      onRetry: undefined,
    });
  },
}));
