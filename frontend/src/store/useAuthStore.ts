/**
 * 프로덕션 전역 세션 및 인증 스토어 (Zustand)
 * (03_REQUIREMENTS_SUMMARY.md USER-01 & module_01_user.md AUTH-01, AUTH-02)
 *
 * Supabase Auth SDK 세션과 백엔드 public.profiles 간 실시간 동기화(Lazy Profile JIT Sync)를 관장합니다.
 */

import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { UserProfileResponseDto } from '@/types/auth';
import * as authApi from '@/services/authApi';

interface AuthState {
  /** 현재 로그인된 유저 프로필 (백엔드 public.profiles DTO) */
  user: UserProfileResponseDto | null;
  /** Supabase Auth 활성 세션 */
  session: Session | null;
  /** 로그인 인증 여부 */
  isAuthenticated: boolean;
  /** 초기 세션 검증 또는 프로필 동기화 로딩 상태 */
  isLoading: boolean;
  /** 최초 세션 초기화 완료 여부 */
  isInitialized: boolean;

  /** 스토어 초기화 및 Supabase 세션 리스너 등록 */
  initialize: () => () => void;
  /** 백엔드 최신 프로필 재조회 및 동기화 */
  syncProfile: () => Promise<UserProfileResponseDto | null>;
  /** 프로필 직접 업데이트 */
  setUser: (user: UserProfileResponseDto | null) => void;
  /** 세션 직접 업데이트 */
  setSession: (session: Session | null) => void;
  /** 로그아웃 처리 */
  logout: () => Promise<void>;
  /** 401 인증 만료 처리 */
  handleUnauthorized: () => void;
  /** 신규 가입자 웰컴 모달 상태 */
  showWelcomeModal: boolean;
  openWelcomeModal: () => void;
  closeWelcomeModal: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  showWelcomeModal: false,
  openWelcomeModal: () => set({ showWelcomeModal: true }),
  closeWelcomeModal: () => set({ showWelcomeModal: false }),

  initialize: () => {
    // 1. 전역 401 세션 만료 이벤트 수신 리스너 등록
    const handleUnauthorizedEvent = () => {
      get().handleUnauthorized();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('dduktak:unauthorized', handleUnauthorizedEvent);
    }

    // 2. Supabase Auth 상태 변화 리스너 등록
    const { data: authListener } = authApi.onAuthStateChange(async (_event, session) => {
      if (session) {
        set({ session, isAuthenticated: true, isLoading: !get().isInitialized });
        try {
          // 백엔드 세션 동기화 및 지연 프로필 생성 (Lazy Profile JIT Sync)
          const initResult = await authApi.initProfile();
          // 전체 프로필 상세 조회
          const profile = await authApi.getMyProfile();
          set({
            user: profile,
            session,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            showWelcomeModal: Boolean(initResult?.isNewUser),
          });
        } catch {
          // 백엔드 일시 장애 시에도 세션은 유지하고 로딩 해제
          set({ isLoading: false, isInitialized: true });
        }
      } else {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          showWelcomeModal: false,
        });
      }
    });

    // 언마운트 / 클린업 함수 반환
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('dduktak:unauthorized', handleUnauthorizedEvent);
      }
      authListener?.subscription?.unsubscribe();
    };
  },

  syncProfile: async () => {
    try {
      const profile = await authApi.getMyProfile();
      set({ user: profile });
      return profile;
    } catch {
      return null;
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: Boolean(user) });
  },

  setSession: (session) => {
    set({ session, isAuthenticated: Boolean(session) });
  },

  logout: async () => {
    try {
      await authApi.signOut();
    } finally {
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  handleUnauthorized: () => {
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
