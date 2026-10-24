/**
 * Supabase Client SDK 초기화 모듈
 * (01_TECH_STACK_AND_LIBS.md 6.2절 & 5.1절 A/B)
 *
 * 클라이언트 단에서는 오직 퍼블릭 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY만 주입하여
 * Supabase Auth 세션 관리 및 Supabase Storage 직접 업로드(Direct Upload)를 수행합니다.
 * 서비스 롤 키(service_role key)는 절대 프론트엔드 코드에 노출하지 않습니다.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// 환경변수 추출 (누락 시 fallback 방어)
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://hefryhbaoovrhgzevfad.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_placeholder_for_test';

/**
 * 전역 싱글톤 Supabase 클라이언트 인스턴스
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
