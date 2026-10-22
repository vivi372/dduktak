/** 라우트별 레이아웃 제어 메타데이터 (react-router `handle`) */
export interface RouteHandle {
  /** 헤더 제목 (서브 페이지에서 사용) */
  title: string;
  /** 브랜드 로고 + 워드마크 헤더를 쓰는 루트 탭 페이지인지 */
  brand?: boolean;
  /** 뒤로가기 버튼 노출 여부 */
  showBack?: boolean;
  /** 하단 탭바 숨김 여부 */
  hideBottomNav?: boolean;
}
