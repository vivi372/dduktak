# 📋 프론트엔드 실전 엣지 케이스 및 방어 코딩 단위테스트 계획서 (Test Plan)

---

## 1. 개요 (Overview)

### 1.1. 목적
본 문서는 '오늘의 뚝딱' 프론트엔드 애플리케이션의 사용자 경험(UX) 및 데이터 무결성을 위협할 수 있는 **실전 5대 방어 엣지 케이스(State Pollution, Stale Back-Navigation, Double-Click Race Condition, Body Scroll Lock Leak, Token Refresh Race Condition)**를 사전에 차단하기 위한 단위테스트 계획서입니다.

### 1.2. 범위 및 대상
1. **[EDGE-01] 폼 상태 오염 및 초기화 누락 방어**: `ManualAddModal.tsx`
2. **[EDGE-02] 로그아웃 후 브라우저 뒤로가기 캐시 노출 차단**: `MyPage.tsx` 및 `apiClient.ts` (`replace: true`)
3. **[EDGE-03] 데이터 삭제/소비 시 연타 및 광클릭 Race Condition 차단**: `InventoryAccordionItem.tsx` (`disabled={isPending}`)
4. **[EDGE-04] 모바일 퀵 등록 바텀시트 백그라운드 스크롤 차단**: `QuickAddTray.tsx` (`useBodyScrollLock`)
5. **[EDGE-05] 401 세션 만료 시 동시 다중 요청 큐(Queue) 대기열 및 꼬임 차단**: `apiClient.ts`

> 💡 **실브라우저/네이티브 E2E 보류 메모**:
> - **[EDGE-06] 무한 스크롤 중복 요청 및 스켈레톤 잔류**: 현재 단일 20건 페이징 상태이므로, 향후 무한 스크롤(`useInfiniteQuery`) 정식 가동 시점에 브라우저 스크롤 인터랙션과 함께 검증.
> - **[EDGE-07] 소셜 로그인 카카오/인앱 브라우저 상태 유실**: Phase 3B-6 (Capacitor 6.x 하이브리드 앱 패키징 & 네이티브 딥링크) 단계에서 실제 모바일 기기/웹뷰 환경에서 실테스트 진행.

---

## 2. 테스트 케이스 명세 (Test Cases Matrix)

| TC ID | 대상 컴포넌트 / 모듈 | 검증 시나리오 및 기준 (Acceptance Criteria) | 상태 |
| :---: | :--- | :--- | :---: |
| **TC-EDGE-01** | `ManualAddModal.tsx` | 재료 입력 중 모달을 닫았다가 다시 열었을 때, 이전 입력 데이터(수량, 메모, 선택재료 등)가 남아있지 않고 기본 초기 상태로 안전하게 리셋되어야 한다. | `[PASS]` |
| **TC-EDGE-02** | `MyPage.tsx` | 사용자가 로그아웃을 수행할 때 브라우저 히스토리가 교체(`navigate(ROUTES.LOGIN, { replace: true })`)되어, 뒤로가기로 마이페이지가 노출되는 현상을 원천 차단해야 한다. | `[PASS]` |
| **TC-EDGE-03** | `InventoryAccordionItem.tsx` | 식재료 삭제 또는 소비 API 통신이 진행 중(`isActionPending: true`)일 때, 해당 버튼이 `disabled` 처리되어 광클릭으로 인한 중복 요청이 방지되어야 한다. | `[PASS]` |
| **TC-EDGE-04** | `QuickAddTray.tsx` | 하단 FAB를 눌러 퀵 등록 바텀시트가 열릴 때(`open: true`), `document.body.style.overflow`가 `'hidden'`으로 잠겨 뒷배경 스크롤이 차단되고 닫히면 복원되어야 한다. | `[PASS]` |
| **TC-EDGE-05** | `apiClient.ts` | 401 Unauthorized 에러가 동시 다발적으로 발생했을 때 중복 토스트가 난사되지 않고 2초 디바운스 및 고유 토스트 ID(`dduktak-session-expired`)로 1회만 단일 세션 만료 알림/이벤트가 트리거되어야 한다. | `[PASS]` |

---

## 3. 테스트 환경
- 프레임워크: React 18 + Vite + TypeScript 5.6
- 테스트 러너: Vitest 2.1.9 + `@testing-library/react` + `@testing-library/user-event`
- 실행 환경: `jsdom` (CLI 헤드리스 단위 테스트)

---

## 4. 수행 결과 (Execution Results)

- **테스트 일시**: 2026-10-25
- **수행 브랜치**: `fix/frontend-edge-cases-and-defensive-hardening`
- **전체 결과 요약**: **39개 테스트 파일 전원 PASS (198개 테스트 100% 성공)**

### 4.1. 엣지 케이스별 세부 검증 결과
1. **TC-EDGE-01 (`ManualAddModal.test.tsx`)**:
   - `open === true` 진입 시 `useEffect`를 통한 폼 상태(`quantity: 1`, `memo: ''`, `selectedMaster: null`, `expireDate`) 안전 리셋 방어 검증 완료 (PASS).
2. **TC-EDGE-02 (`MyPage.test.tsx`)**:
   - `handleLogout` 시 `navigate(ROUTES.LOGIN, { replace: true })` 호출 확인으로 브라우저 히스토리 캐시 뒤로가기 취약점 차단 검증 완료 (PASS).
3. **TC-EDGE-03 (`InventoryAccordionItem.test.tsx`)**:
   - `isActionPending={true}` 전달 시 소비하기, 수정, 삭제 버튼이 모두 `disabled` 처리되어 사용자 광클릭/네트워크 레이스 컨디션 차단 검증 완료 (PASS).
4. **TC-EDGE-04 (`QuickAddTray.test.tsx` & `useBodyScrollLock.test.ts`)**:
   - `open={true}` 시 `document.body.style.overflow = 'hidden'`, 닫힘 시 초기 스타일 복원 동작 검증 완료 (PASS).
5. **TC-EDGE-05 (`apiClient.test.ts`)**:
   - 동시 3건의 401 Unauthorized 응답 발생 시, `toast.error` 및 `dduktak:unauthorized` 이벤트가 1회만 발화되는 디바운스 및 전역 토스트 ID 락 동작 검증 완료 (PASS).

### 4.2. 빌드 정합성 검증
- `npm run build` (`tsc -b && vite build`): **0개 에러, 프로덕션 번들 정상 생성 (PASS)**.

