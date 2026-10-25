/**
 * 메인 홈 도메인 API 클라이언트 (05_API_SPECIFICATION.md 3.6절)
 *
 * 메인 화면 종합 브리핑(임박 재료 수, 상위 3개 목록, AI 추천/인기 레시피 폴백) 조회를 담당합니다.
 */

import { apiClient } from '@/services/apiClient';
import type { ApiResponseDto } from '@/types/auth';
import type { HomeBriefing } from '@/types/home';

/**
 * 메인 화면 종합 브리핑 위젯 데이터 조회 (GET /api/v1/home/briefing)
 *
 * @returns 메인 화면 종합 브리핑 응답 데이터 (data)
 */
export async function getHomeBriefing(): Promise<HomeBriefing> {
  const response = await apiClient.get<ApiResponseDto<HomeBriefing>>('/api/v1/home/briefing');
  return response.data.data;
}
