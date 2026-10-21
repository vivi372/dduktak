# 📋 '오늘의 뚝딱' 에이전트 협업 개발 상세 마스터 플랜

## 📊 개발 진행 현황 요약
| 페이즈 | 주요 목표 | 완료 스텝 수 | 진행률 |
| :--- | :--- | :---: | :---: |
| **Phase 1** | 백엔드 기반 공사 및 공통 인프라 구축 | `[x] 4/4` | **100%** |
| **Phase 2** | 백엔드 도메인별 핵심 API 개발 | `[ ] 3/4` | **75%** |
| **Phase 3** | 프론트엔드 UI/UX 및 화면 구현 | `[ ] 0/4` | 0% |
| **Phase 4** | 인수 테스트 및 최종 검토 | `[ ] 0/2` | 0% |
| **전체** | **전체 시스템 구축 완료** | `[x] 7/14` | **50%** |

---

## Phase 1: 백엔드 기반 공사 및 공통 인프라 구축 (Backend Foundation)

> **목표:** 비즈니스 로직 작성 전, 프로젝트 전반에서 공통으로 쓰이는 응답 규격, 예외 처리, AOP 로깅 환경을 완벽히 세팅합니다.

* [x] **Step 1-1: Gradle 및 디렉토리 구조 초기화** (완료일시: 2026-10-17 / 담당자: AI 에이전트)
  * [x] `build.gradle`에 Spring Boot 3.x, MyBatis, PostgreSQL Driver, Spring Security, jjwt, Lombok 등 `01_TECH_STACK_AND_LIBS.md`에 정의된 의존성 추가.
  * [x] `backend/src/main/java/com/dduktak/` 아래에 `global/` (`config`, `error`, `aspect`, `util`) 및 `domain/` (`auth`, `inventory`, `recipe`, `matching`, `notification`) 패키지 구조 생성.

* [x] **Step 1-2: 공통 응답 DTO 및 전역 예외 처리 구현** (완료일시: 2026-10-17 / 담당자: AI 에이전트)
  * [x] `ApiResponseDto<T>` (`success`, `data`, `message`) 구현.
  * [x] `02_ARCHITECTURE_AND_CONVENTIONS.md`의 에러 코드 규칙(`[도메인]_[UX태그]_[상세원인]`)을 따르는 `ErrorCode` Enum 정의.
  * [x] `GlobalExceptionHandler`를 구현하여 `CustomException` 및 `@Valid` 유효성 검증 실패 시 올바른 `ErrorResponseDto` 반환 처리.

* [x] **Step 1-3: AOP 로깅 및 트레이싱 구현** (완료일시: 2026-10-18 / 담당자: AI 에이전트)
  * [x] `LoggingAspect.java` 작성: 컨트롤러 및 서비스 진입 시 6자리 무작위 Trace ID 발급 및 MDC 등록, 매개변수 마스킹 로깅, 이탈 시 반환값 및 실행 시간(Execution Time ms) 로깅, 최초 진입점 종료 시 `MDC.clear()` 보장.
  * [x] 민감 정보 평문 노출 방지: 파라미터명(`password`, `token` 등), DTO toString 및 반환값 JWT 패턴 마스킹(`****`, `[PROTECTED_TOKEN]`), 특수 객체(`HttpServletRequest`, `MultipartFile`) 안전 요약 로깅.
  * [x] `application.yml` 콘솔 로그 포맷에 `%clr([%X{traceId:-SYSTEM}]){magenta}` 연동.
  * [x] 단위/통합 테스트 `LoggingAspectTest.java` 7종 작성 및 전원 통과 검증.
  * [x] `TraceIdFilter.java` 및 `CorsConfig.java` 작성: 서블릿 최우선 진입점(`@Order(Ordered.HIGHEST_PRECEDENCE)`)에서 Trace ID 발급 및 응답 헤더(`X-Trace-Id`) 주입, 프론트엔드 연동을 위한 `exposedHeaders("X-Trace-Id")` 설정.
  * [x] `GlobalExceptionHandler.java` 연동: 모든 예외 응답(`ResponseEntity<ErrorResponseDto>`) 헤더에 MDC의 `X-Trace-Id` 자동 주입.
  * [x] `TraceIdFilterTest`(4종), `CorsConfigTest`(1종), `GlobalExceptionHandlerTest`(7종) 작성 및 전체 백엔드 테스트 20종 전원 통과 검증.

* [x] **Step 1-4: 데이터베이스 스키마(DDL), 시드 데이터 적재 및 DataSource 연동** (완료일시: 2026-10-19 / 담당자: AI 에이전트)
  * [x] Supabase(PostgreSQL)에 `04_DATABASE_SCHEMA.md`를 바탕으로 11개 테이블 및 인덱스 6개 생성 완료.
  * [x] `ingredient_master_seed.md` (6개 카테고리, 마스터 식재료 74종 전량) 및 `recipe_seed.md` (한식 30선, 식재료 222건, 조리순서 120건) 복원 적재 및 조인 무결성 100% 검증 완료.
  * [x] `application.yml`에 Supabase PostgreSQL 연결 설정(HikariCP 최적화, MyBatis 매퍼 설정, 6543 포트 및 `prepareThreshold=0`) 구성 완료.
  * [x] `build.gradle` 및 `DotenvTestInitializer`를 통한 안전한 `.env` 로딩 인프라 구축 및 `DatabaseConnectionTest` 3종(커넥션 풀, SELECT 1, MyBatis 74건 조회) 통과 검증 완료.

---

## Phase 2: 백엔드 도메인별 핵심 API 개발 (Backend Domain Logic)

> **목표:** 5개 주요 모듈의 비즈니스 로직과 MyBatis Mapper XML 연동을 완성합니다.

* [x] **Step 2-1: 모듈 1 (회원 및 인증)** (완료일시: 2026-10-19 / 담당자: AI 에이전트)
  * [x] BCrypt 단방향 비밀번호 암호화 및 JJWT 0.12.5 기반 `JwtProvider`, `JwtAuthenticationFilter`, `SecurityConfig` 세팅 완료.
  * [x] `/api/v1/auth/signup`, `/login`, `/refresh`, `/me`, `/me/quiet-time`, `/withdraw` 전체 DTO, Entity, MyBatis XML Mapper, Repository, Service, Controller 구현 완료.
  * [x] 회원 탈퇴(USER-02) 2중 안전장치(작성 레시피 `user_id = NULL` 익명화 선제 수행 및 개인 데이터 Cascade 파기) 적용.
  * [x] 단위/통합 테스트 30종(JwtProviderTest 4종, AuthServiceTest 12종, AuthControllerTest 9종, SecurityConfigTest 4종, UserMapperIntegrationTest 1종) 전원 통과 (DoD 100% 달성).


* [x] **Step 2-2: 모듈 2 (내 재료 관리소)** (완료일시: 2026-10-21 / 담당자: AI 에이전트)
  * [x] **외부 연동 파이프라인 (바코드 & 영수증 OCR) 구현 완료** (완료일시: 2026-10-21 / 담당자: AI 에이전트):
    * [x] 바코드 식재료 조회 API (`GET /api/v1/inventory/barcode/{barcodeNo}`): 식품안전나라/푸드QR 및 인메모리 바코드 사전 ➔ `IngredientMatcher` 스마트 매칭 ➔ `ingredient_master`(74종) 연계. 미등록 시 `404 Not Found` (`INV_WARN_BARCODE_NOT_FOUND`) 반환.
    * [x] 영수증 OCR 스캔 API (`POST /api/v1/inventory/scan-ocr`): Google AI Studio Gemini Flash (`gemini-flash-latest`) REST API 프록시 연동, Base64 JSON 품목 추출 및 `ingredient_master` 매핑, 권장 소비기한 D-Day 자동 산출, 장애/미인식 시 Fail-safe 빈 배열 `[]` (`200 OK`) 반환.
    * [x] 표준 식재료 마스터(`ingredient_master`) MyBatis Mapper 및 Repository 구축 완료 (`findAll`, `findById`, `findByName`, `searchByNameLike`).
    * [x] 단위/슬라이스/통합 테스트 23종 전원 통과 (전체 백엔드 72종 100% 성공).
  * [x] **내 냉장고 핵심 CRUD 및 표준 식재료 마스터 API 구현 완료** (완료일시: 2026-10-21 / 담당자: AI 에이전트):
    * [x] 표준 식재료 마스터 검색 및 카테고리별 조회 API (`GET /api/v1/inventory/master-ingredients`): 74종 마스터 + 카테고리 JOIN 검색, DTO 반환.
    * [x] 냉장고 재료 수동 직접 등록 (`POST /api/v1/inventory`): **독립 레코드(Independent Record) 원칙(INV-01-2)** 적용하여 수량 합산(UPDATE) 없이 신규 PK INSERT, 소비기한 미입력 시 마스터 권장보관일수 기반 자동 산출.
    * [x] 냉장고 재료 목록 조회/필터 (`GET /api/v1/inventory`): PostgreSQL KST 실시간 D-Day 연산 (`(ui.expire_date - (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date) AS d_day`), 소비기한 임박순 정렬 (`expire_date ASC, created_at ASC`), 상태 및 검색 필터링.
    * [x] 냉장고 재료 개별 수정 (`PUT /api/v1/inventory/{ingredientId}`): 식재료 마스터 불변 유지, 보관방법/수량/단위/소비기한/메모 수정, 타인 소유 시 404 (`INV_WARN_NOT_FOUND`) 차단.
    * [x] 냉장고 재료 소프트 삭제 (`DELETE /api/v1/inventory/{ingredientId}`): 물리 삭제 방지 및 `status = 'DELETED'` 전이, 타인 소유 시 404 차단.
    * [x] 냉장고 재료 수동 소비 처리 (`PATCH /api/v1/inventory/{ingredientId}/consume`): `Math.max(0, current - consume)` 수량 방어 차감 로직, 잔여 0 이하 시 `status = 'CONSUMED'` 자동 전이, 미입력 시 전량 소비 간주, 타인 소유 시 404 차단.
    * [x] 단위/슬라이스/통합 테스트 23종 신규 작성 및 전체 95종 전원 통과 (DoD 100% 달성).

* [x] **Step 2-3: 모듈 3 & 4 (뚝딱 레시피 커뮤니티 & 스마트 매칭 엔진)** (완료일시: 2026-10-21 / 담당자: AI 에이전트)
  * [x] **뚝딱 레시피 커뮤니티 API (`/api/v1/recipes`) 구현 완료**:
    * 8대 표준 카테고리 목록 조회 (`GET /categories`), 레시피 목록 페이징 및 필터/검색/정렬 (`GET /`).
    * 레시피 상세 조회 (`GET /{recipeId}`): 기본 정보, 작성자 닉네임/태그, 상호작용(`isLiked`, `isScrapped`), 양념류(`isSauce`) 배지 표기.
    * 표준 식재료 바인딩 기반 신규 등록 (`POST /`), 본인 작성 레시피 수정(`PUT`) 및 삭제(`DELETE`).
    * 익명 레시피(`user_id = NULL`) 보호: 탈퇴 회원의 레시피 수정/삭제 시 403 Forbidden (`RECIPE_WARN_NOT_AUTHOR`) 차단.
    * 좋아요(`POST /{recipeId}/like`) 및 스크랩(`POST /{recipeId}/scrap`) 토글, DB 레벨 원자적 카운터 증가/감소 연산.
  * [x] **스마트 매칭 엔진 & FIFO 차감 API (`/api/v1/matching`) 구현 완료**:
    * 스마트 매칭 추천 (`GET /recommendations`): 주재료 필수 하드 게이트 (MAIN 0개 보유 시 0% 및 목록 완전 제외), Base Score(주재료 70% + 부재료 30%) + Bonus Score(소비기한 임박 주재료 +10점, 부재료 +5점) 공식 적용.
    * 양념/소스 카테고리(`is_sauce = TRUE`) 상시 100% 충족 간주 및 요리 차감 루프에서 무조건 차감 제외.
    * 뚝딱 요리 완료 (`POST /cook/{recipeId}`): 2-Way 옵션 (`deductInventory: false` 시 원자적 cookedCount만 증가), **No-Mixing 선입선출(FIFO) 차감 정책** 적용 (원본 재료 최우선 FIFO 차감, 수량 부족 시 Partial Deduction 부분 차감 후 부족분을 대체 재료와 섞지 않음).
  * [x] 단위/슬라이스/통합 테스트 35종 신규 작성 및 전체 130종 전원 통과 (DoD 100% 달성).

* [ ] **Step 2-4: 모듈 5 & 6 (알림 및 메인 브리핑)** (완료일시: - / 담당자: -)
  * [ ] `@Scheduled` 스케줄러를 활용한 소비기한 임박(D-1, D-3) 유저 알림 생성 로직 구현.
  * [ ] 메인 화면용 브리핑 위젯 및 인기 레시피 목록 조회 API 구현.

---

## Phase 3: 프론트엔드 UI/UX 및 화면 구현 (Frontend Development)

> **목표:** React + TypeScript + Vite 환경에서 Tailwind CSS와 Shadcn UI 기반의 직관적인 사용자 화면을 구축합니다.

* [ ] **Step 3-1: 프론트엔드 공통 환경 및 레이아웃 세팅** (완료일시: - / 담당자: -)
  * [ ] Axios API Client 설정 (Intercepter를 통한 JWT 자동 주입 및 에러 토스트 분기 처리).
  * [ ] Zustand 세션 스토어(`store/`) 및 React Query Provider 설정.
  * [ ] 하단 네비게이션 및 모바일/PC 반응형 레이아웃 컴포넌트(`components/layout/`) 구현.

* [ ] **Step 3-2: 내 냉장고 관리 UI 구현 (모듈 2)** (완료일시: - / 담당자: -)
  * [ ] 표준 식재료 검색용 Combobox (Searchable Select) 컴포넌트 구현.
  * [ ] 표준 식재료 단위 메인 카드와, 클릭 시 펼쳐지는 **2-Tier 아코디언** UI 구현.
  * [ ] 퀵 선택(Quick Pick) 버튼 및 바코드 스캔 영역 마크업.

* [ ] **Step 3-3: 레시피 커뮤니티 및 매칭 화면 구현 (모듈 3 & 4)** (완료일시: - / 담당자: -)
  * [ ] 내 냉장고 재료 매칭 점수(%)가 시각적으로 표시되는 레시피 카드 리스트 구현.
  * [ ] 주재료/부재료 태그 구분 표시 및 레시피 상세/등록 폼(`react-hook-form` + `zod` 검증).

* [ ] **Step 3-4: 마이페이지, 알림 및 전역 예외 UX 연동** (완료일시: - / 담당자: -)
  * [ ] 방해금지 시간 설정 UI 및 알림함 화면 구현.
  * [ ] 백엔드 에러 코드의 UX 태그(`FIELD`, `WARN`, `ALERT` 등)에 따라 Sonner Toast 및 모달이 자동으로 분기되도록 연동.

---

## Phase 4: 인수 테스트 및 최종 검토 (Testing & Polish)

> **목표:** 서비스의 완성도를 높이고 실사용 검증을 거칩니다.

* [ ] **Step 4-1: 핵심 비즈니스 인수 테스트 수행** (완료일시: - / 담당자: -)
  * [ ] `07_TEST_SCENARIOS.md`에 기반하여 JUnit/Mockito 백엔드 단위 테스트 및 주요 시나리오(냉장고 재료 등록 ➔ 레시피 매칭 ➔ FIFO 차감) 흐름 검증.

* [ ] **Step 4-2: 빌드 및 배포 환경 점검** (완료일시: - / 담당자: -)
  * [ ] 프론트엔드(Vercel) 및 백엔드(Render) 빌드 에러 확인 및 환경 변수(`.env`) 세팅 점검.
