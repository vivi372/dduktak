import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 라우트 이동 시 브라우저 스크롤을 최상단으로 리셋하는 컴포넌트
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 이전 페이지의 스크롤 위치가 유지되지 않도록 즉시 최상단(0, 0)으로 이동
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
