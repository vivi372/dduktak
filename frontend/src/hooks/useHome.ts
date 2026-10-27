/**
 * 메인 홈 화면 React Query 커스텀 훅 (02_ARCHITECTURE_AND_CONVENTIONS.md 3.3절)
 *
 * 메인 홈 브리핑 데이터(임박 식재료 수, 상위 3개 목록, 최고 매칭 또는 인기 레시피 폴백)를 조회합니다.
 */

import { useQuery } from '@tanstack/react-query';
import { getHomeBriefing } from '@/services/homeApi';
import { useAuth } from '@/hooks/useAuth';
import type { HomeBriefing } from '@/types/home';


/**
 * 메인 홈 브리핑 데이터 조회 훅
 *
 * @returns React Query useQuery 결과 객체 (data, isLoading, isError, refetch 등)
 */
export function useHomeBriefing() {
  const { isAuthenticated, user } = useAuth();

  return useQuery<HomeBriefing>({
    queryKey: ['home', 'briefing', user?.userId],
    queryFn: async () => {
      return await getHomeBriefing();
    },
    enabled: isAuthenticated && Boolean(user?.userId),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5분간 신선 상태 유지 (화면 전환 시 깜빡임 없이 즉시 캐시 렌더링)
  });
}
