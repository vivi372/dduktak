/**
 * Render 무료 티어 Cold Start (15분 슬립 모드) 대응 백엔드 웜업 및 헬스체크 서비스
 * - 전역 Axios 인터셉터(토스트 팝업, GlobalErrorModal)를 거치지 않는 무음(Silent) fetch 방식
 * - 서버가 슬립 상태일 때 무작정 대기하거나 에러 화면을 노출하지 않고,
 *   스플래시 화면 뒤에서 서버가 켜질 때까지 조용히 핑(Ping)을 전송하여 감지합니다.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://dduktak.onrender.com' : '');

export interface HealthCheckResult {
  ok: boolean;
  status: number;
  durationMs: number;
}

/**
 * 백엔드 초경량 엔드포인트 무음 헬스체크 (GET /api/v1/recipes/categories)
 * - SecurityConfig에서 permitAll 되어 있으며 DB 부하가 거의 없는 정적 카테고리 엔드포인트 활용
 * - Vercel SPA Rewrite의 200 HTML 응답을 백엔드 성공으로 오인하지 않도록 Content-Type(application/json) 검증 필수
 */
export async function pingBackend(timeoutMs = 6000): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${API_BASE_URL}/api/v1/recipes/categories`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-cache',
    });

    clearTimeout(timer);
    const durationMs = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const isSuccess = (response.ok || response.status === 304) && isJson;

    return {
      ok: isSuccess,
      status: response.status,
      durationMs,
    };
  } catch {
    clearTimeout(timer);
    return {
      ok: false,
      status: 0,
      durationMs: Date.now() - startTime,
    };
  }
}
