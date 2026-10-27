/** 라우트별 레이아웃 제어 메타데이터 (react-router `handle`) */
export interface RouteHandle {
  /** 헤더 제목 (서브 페이지에서 사용) */
  title: string;
  /** 브랜드 로고 + 워드마크 헤더를 쓰는 루트 탭 페이지인지 */
  brand?: boolean;
  /** 뒤로가기 버튼 노출 여부 */
  showBack?: boolean;
  /** 뒤로가기 버튼 클릭 시 이동할 고정/기본 경로 (미지정 시 history.back / home fallback) */
  backPath?: string;
  /** 하단 탭바 숨김 여부 */
  hideBottomNav?: boolean;
  /** 상단 헤더 숨김 여부 (로그인/온보딩 풀스크린 뷰 등) */
  hideHeader?: boolean;
  /** 데스크톱 2-컬럼 사이드바 숨김 및 중앙 단독 집중 레이아웃 여부 (로그인 등) */
  hideSidePanel?: boolean;
}
