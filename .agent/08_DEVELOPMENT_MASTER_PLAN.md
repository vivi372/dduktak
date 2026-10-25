### 📋 '오늘의 뚝딱' 에이전트 협업 개발 상세 마스터 플랜
#### 📊 개발 진행 현황 요약
| 페이즈 | 주요 목표 | 완료 스텝 수 | 진행률 |
| ------ | ------ | ------ | ------ |
| **Phase 1** | 백엔드 기반 공사 및 공통 인프라 구축 | [x] 4/4 | **100%** |
| **Phase 2** | 백엔드 도메인별 핵심 API 개발 | [x] 4/4 | **100%** |
| **Phase 3** | 프론트엔드 UI/UX 및 하이브리드 앱 구현 | [x] 8/11 | **73%** |
| **Phase 4** | 인수 테스트 및 최종 검토 | [ ] 0/2 | 0% |
| **전체** | **전체 시스템 구축 완료** | [x] 16/17 | **94%** |


--------------------------------------------------------------------------------

#### Phase 1: 백엔드 기반 공사 및 공통 인프라 구축 (Backend Foundation)
**목표:**  비즈니스 로직 작성 전, 프로젝트 전반에서 공통으로 쓰이는 응답 규격, 예외 처리, AOP 로깅 환경을 완벽히 세팅합니다.
*  [x]  **Step 1-1: Gradle 및 디렉토리 구조 초기화**  (완료일시: 2026-10-17 / 담당자: AI 에이전트)
    *  [x] build.gradle에 Spring Boot 3.x, MyBatis, PostgreSQL Driver, Spring Security, jjwt, Lombok 등 01_TECH_STACK_AND_LIBS.md에 정의된 의존성 추가.
    *  [x] backend/src/main/java/com/dduktak/ 아래에 global/ (config, error, aspect, util) 및 domain/ (auth, inventory, recipe, matching, notification) 패키지 구조 생성.
*  [x]  **Step 1-2: 공통 응답 DTO 및 전역 예외 처리 구현**  (완료일시: 2026-10-17 / 담당자: AI 에이전트)
    *  [x] ApiResponseDto<T> (success, data, message) 구현.
    *  [x] 02_ARCHITECTURE_AND_CONVENTIONS.md의 에러 코드 규칙([도메인]_[UX태그]_[상세원인])을 따르는 ErrorCode Enum 정의.
    *  [x] GlobalExceptionHandler를 구현하여 CustomException 및 @Valid 유효성 검증 실패 시 올바른 ErrorResponseDto 반환 처리.
*  [x]  **Step 1-3: AOP 로깅 및 트레이싱 구현**  (완료일시: 2026-10-18 / 담당자: AI 에이전트)
    *  [x] LoggingAspect.java 작성: 컨트롤러 및 서비스 진입 시 6자리 무작위 Trace ID 발급 및 MDC 등록, 매개변수 마스킹 로깅, 이탈 시 반환값 및 실행 시간(Execution Time ms) 로깅, 최초 진입점 종료 시 MDC.clear() 보장.
    *  [x] 민감 정보 평문 노출 방지: 파라미터명(password, token 등), DTO toString 및 반환값 JWT 패턴 마스킹(****, [PROTECTED_TOKEN]), 특수 객체(HttpServletRequest, MultipartFile) 안전 요약 로깅.
    *  [x] application.yml 콘솔 로그 포맷에 %clr([%X{traceId:-SYSTEM}]){magenta} 연동.
    *  [x] 단위/통합 테스트 LoggingAspectTest.java 7종 작성 및 전원 통과 검증.
    *  [x] TraceIdFilter.java 및 CorsConfig.java 작성: 서블릿 최우선 진입점(@Order(Ordered.HIGHEST_PRECEDENCE))에서 Trace ID 발급 및 응답 헤더(X-Trace-Id) 주입, 프론트엔드 연동을 위한 exposedHeaders("X-Trace-Id") 설정.
    *  [x] GlobalExceptionHandler.java 연동: 모든 예외 응답(ResponseEntity<ErrorResponseDto>) 헤더에 MDC의 X-Trace-Id 자동 주입.
    *  [x] TraceIdFilterTest(4종), CorsConfigTest(1종), GlobalExceptionHandlerTest(7종) 작성 및 전체 백엔드 테스트 20종 전원 통과 검증.
*  [x]  **Step 1-4: 데이터베이스 스키마(DDL), 시드 데이터 적재 및 DataSource 연동**  (완료일시: 2026-10-19 / 담당자: AI 에이전트)
    *  [x] Supabase(PostgreSQL)에 04_DATABASE_SCHEMA.md를 바탕으로 11개 테이블 및 인덱스 6개 생성 완료.
    *  [x] ingredient_master_seed.md (6개 카테고리, 마스터 식재료 74종 전량) 및 recipe_seed.md (한식 30선, 식재료 222건, 조리순서 120건) 복원 적재 및 조인 무결성 100% 검증 완료.
    *  [x] application.yml에 Supabase PostgreSQL 연결 설정(HikariCP 최적화, MyBatis 매퍼 설정, 6543 포트 및 prepareThreshold=0) 구성 완료.
    *  [x] build.gradle 및 DotenvTestInitializer를 통한 안전한 .env 로딩 인프라 구축 및 DatabaseConnectionTest 3종(커넥션 풀, SELECT 1, MyBatis 74건 조회) 통과 검증 완료.

--------------------------------------------------------------------------------

#### Phase 2: 백엔드 도메인별 핵심 API 개발 (Backend Domain Logic)
**목표:**  5개 주요 모듈의 비즈니스 로직과 MyBatis Mapper XML 연동을 완성합니다.
*  [x]  **Step 2-1: 모듈 1 (회원 및 인증)**  (완료일시: 2026-10-19 / 담당자: AI 에이전트)
    *  [x] BCrypt 단방향 비밀번호 암호화 및 JJWT 0.12.5 기반 JwtProvider, JwtAuthenticationFilter, SecurityConfig 세팅 완료.
    *  [x] /api/v1/auth/signup, /login, /refresh, /me, /me/quiet-time, /withdraw 전체 DTO, Entity, MyBatis XML Mapper, Repository, Service, Controller 구현 완료.
    *  [x] 회원 탈퇴(USER-02) 2중 안전장치(작성 레시피 user_id = NULL 익명화 선제 수행 및 개인 데이터 Cascade 파기) 적용.
    *  [x] 단위/통합 테스트 30종(JwtProviderTest 4종, AuthServiceTest 12종, AuthControllerTest 9종, SecurityConfigTest 4종, UserMapperIntegrationTest 1종) 전원 통과 (DoD 100% 달성).
*  [x]  **Step 2-2: 모듈 2 (내 재료 관리소)**  (완료일시: 2026-10-21 / 담당자: AI 에이전트)
    *  [x]  **외부 연동 파이프라인 (바코드 & 영수증 OCR) 구현 완료**  (완료일시: 2026-10-21 / 담당자: AI 에이전트):
        *  [x] 바코드 식재료 조회 API (GET /api/v1/inventory/barcode/{barcodeNo}): 식품안전나라/푸드QR 및 인메모리 바코드 사전 ➔ IngredientMatcher 스마트 매칭 ➔ ingredient_master(74종) 연계. 미등록 시 404 Not Found (INV_WARN_BARCODE_NOT_FOUND) 반환.
        *  [x] 영수증 OCR 스캔 API (POST /api/v1/inventory/scan-ocr): Google AI Studio Gemini Flash (gemini-flash-latest) REST API 프록시 연동, Base64 JSON 품목 추출 및 ingredient_master 매핑, 권장 소비기한 D-Day 자동 산출, 장애/미인식 시 Fail-safe 빈 배열 [] (200 OK) 반환.
        *  [x] 표준 식재료 마스터(ingredient_master) MyBatis Mapper 및 Repository 구축 완료 (findAll, findById, findByName, searchByNameLike).
        *  [x] 단위/슬라이스/통합 테스트 23종 전원 통과 (전체 백엔드 72종 100% 성공).
    *  [x]  **내 냉장고 핵심 CRUD 및 표준 식재료 마스터 API 구현 완료**  (완료일시: 2026-10-21 / 담당자: AI 에이전트):
        *  [x] 표준 식재료 마스터 검색 및 카테고리별 조회 API (GET /api/v1/inventory/master-ingredients): 74종 마스터 + 카테고리 JOIN 검색, DTO 반환.
        *  [x] 냉장고 재료 수동 직접 등록 (POST /api/v1/inventory):  **독립 레코드(Independent Record) 원칙(INV-01-2)**  적용하여 수량 합산(UPDATE) 없이 신규 PK INSERT, 소비기한 미입력 시 마스터 권장보관일수 기반 자동 산출.
        *  [x] 냉장고 재료 목록 조회/필터 (GET /api/v1/inventory): PostgreSQL KST 실시간 D-Day 연산 ((ui.expire_date - (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date) AS d_day), 소비기한 임박순 정렬 (expire_date ASC, created_at ASC), 상태 및 검색 필터링.
        *  [x] 냉장고 재료 개별 수정 (PUT /api/v1/inventory/{ingredientId}): 식재료 마스터 불변 유지, 보관방법/수량/단위/소비기한/메모 수정, 타인 소유 시 404 (INV_WARN_NOT_FOUND) 차단.
        *  [x] 냉장고 재료 소프트 삭제 (DELETE /api/v1/inventory/{ingredientId}): 물리 삭제 방지 및 status = 'DELETED' 전이, 타인 소유 시 404 차단.
        *  [x] 냉장고 재료 수동 소비 처리 (PATCH /api/v1/inventory/{ingredientId}/consume): Math.max(0, current - consume) 수량 방어 차감 로직, 잔여 0 이하 시 status = 'CONSUMED' 자동 전이, 미입력 시 전량 소비 간주, 타인 소유 시 404 차단.
        *  [x] 단위/슬라이스/통합 테스트 23종 신규 작성 및 전체 95종 전원 통과 (DoD 100% 달성).
*  [x]  **Step 2-3: 모듈 3 & 4 (뚝딱 레시피 커뮤니티 & 스마트 매칭 엔진)**  (완료일시: 2026-10-21 / 담당자: AI 에이전트)
    *  [x]  **뚝딱 레시피 커뮤니티 API (/api/v1/recipes) 구현 완료** :
        *  8대 표준 카테고리 목록 조회 (GET /categories), 레시피 목록 페이징 및 필터/검색/정렬 (GET /).
        *  레시피 상세 조회 (GET /{recipeId}): 기본 정보, 작성자 닉네임/태그, 상호작용(isLiked, isScrapped), 양념류(isSauce) 배지 표기.
        *  표준 식재료 바인딩 기반 신규 등록 (POST /), 본인 작성 레시피 수정(PUT) 및 삭제(DELETE).
        *  익명 레시피(user_id = NULL) 보호: 탈퇴 회원의 레시피 수정/삭제 시 403 Forbidden (RECIPE_WARN_NOT_AUTHOR) 차단.
        *  좋아요(POST /{recipeId}/like) 및 스크랩(POST /{recipeId}/scrap) 토글, DB 레벨 원자적 카운터 증가/감소 연산.
    *  [x]  **스마트 매칭 엔진 & FIFO 차감 API (/api/v1/matching) 구현 완료** :
        *  스마트 매칭 추천 (GET /recommendations): 주재료 필수 하드 게이트 (MAIN 0개 보유 시 0% 및 목록 완전 제외), Base Score(주재료 70% + 부재료 30%) + Bonus Score(소비기한 임박 주재료 +10점, 부재료 +5점) 공식 적용.
        *  양념/소스 카테고리(is_sauce = TRUE) 상시 100% 충족 간주 및 요리 차감 루프에서 무조건 차감 제외.
        *  뚝딱 요리 완료 (POST /cook/{recipeId}): 2-Way 옵션 (deductInventory: false 시 원자적 cookedCount만 증가),  **No-Mixing 선입선출(FIFO) 차감 정책**  적용 (원본 재료 최우선 FIFO 차감, 수량 부족 시 Partial Deduction 부분 차감 후 부족분을 대체 재료와 섞지 않음).
    *  [x] 단위/슬라이스/통합 테스트 35종 신규 작성 및 전체 130종 전원 통과 (DoD 100% 달성).
*  [x]  **Step 2-4: 모듈 5 & 6 (알림 및 메인 브리핑)**  (완료일시: 2026-10-21 / 담당자: AI 에이전트)
    *  [x]  **모듈 5: 알림 시스템 및 배치 스케줄러 구현 완료 (2026-10-21 / 담당자: AI 에이전트)** :
        *  매일 09시 소비기한 임박(D-0 ~ D-3) 묶음 알림 일괄 생성 및 당일 멱등성(DATE(created_at) = CURRENT_DATE) 중복 발송 방어 배치 스케줄러 구현.
        *  읽은 알림(is_read = true) 30일 경과 자동 Cleanup 정기 배치 스케줄러 구현.
        *  FCM(Firebase Cloud Messaging) 비동기 Fire-and-Forget 푸시 발송 서비스 구현.
        *  커뮤니티 소셜 알림(좋아요/요리완료) 연동 및 자추 스킵(authorId != actorId), 야간 방해금지 시간(21:00~08:00) 푸시 차단 구현.
        *  알림 센터 목록 조회(GET /api/v1/notifications), 미읽음 뱃지(unreadCount, hasUnread), 이동용 targetId 반환.
        *  단일/전체 읽음(PATCH /{id}/read, PATCH /read-all), 단일/전체 삭제(DELETE /{id}, DELETE /all), 알림 통합 설정(PATCH /settings) API 구현.
        *  단위/슬라이스/통합 테스트 23종 신규 작성 및 전체 157종 테스트 100% 통과 (DoD 달성).
    *  [x]  **모듈 6: 메인 화면 종합 브리핑 위젯 API (GET /api/v1/home/briefing) 구현 완료 (2026-10-21 / 담당자: AI 에이전트)** :
        *  보유 재료 기반 D-0 ~ D-3 임박 재료 수 집계 및 expire_date ASC 상위 3개 임박 재료 리스트 조회 (idx_user_ingredient_fifo 최적화).
        *  스마트 매칭 연동 최고 추천 레시피(topRecipe) 1건 및 재료 0개/매칭률 0% 유저 대상 커뮤니티 인기 레시피((cooked_count + like_count) DESC) 0% 매칭률 폴백 연동.
        *  신규 유저 Empty State 방어 객체(expiringIngredientsCount = 0, imminentIngredients = []) 반환 및 200ms 이내 초고속 단일 DTO 응답.
        *  단위/슬라이스 테스트 7종 신규 작성 및 백엔드 전체 164개 테스트 케이스 100% 전원 통과 (Phase 2 전체 완료).

--------------------------------------------------------------------------------

#### Phase 3: 프론트엔드 UI/UX 및 하이브리드 앱 구현 (Frontend & Mobile App)
**목표:** 실무 워크플로우를 반영하여 **[1단계: UI 디자인 퍼블리싱 & 목업 화면 구축]**을 통해 전체 화면 시각 디자인과 반응형 Layout을 먼저 완성하고 검수/확정한 후, **[2단계: 프론트엔드 비즈니스 로직, 상태 관리 & API 연동]**을 거쳐 완전한 서비스로 통합합니다.

---

##### 🎨 [1단계] Phase 3A: UI/UX 디자인 퍼블리싱 & 목업 화면 확정 (Design & UI Publishing First)
> **개념:** 백엔드 API 연동 전, 더미 데이터(Dummy/Mock Data)를 활용하여 모든 화면의 마크업, 레이아웃, 컴포넌트 디자인 및 인터랙션을 선 구현하고 유저 디자인 검수/확정을 진행합니다.

* [x] **Step 3A-1: 디자인 시스템, 공통 레이아웃 & 라우팅 세팅** (완료일시: 2026-10-22 15:15 / 담당자: AI 에이전트)
    * [x] Tailwind CSS, Shadcn UI, Lucide Icons, Framer Motion 초기 세팅 및 브랜드 디자인 토큰(코랄/민트/크림) 구성.
    * [x] 모바일 퍼스트 반응형 레이아웃 (`components/layout/` Header, Bottom Navigation, 56px Thumb Zone FAB).
    * [x] React Router 설정 및 5개 목업 페이지 프레임 스캐폴딩(`src/mocks/` 분리) 구축.
* [x] **Step 3A-3: 내 냉장고 관리 화면 UI 퍼블리싱 (모듈 2)** (완료일시: 2026-10-23 01:15 / 담당자: AI 에이전트)
    * [x] 표준 식재료 검색 Combobox (Searchable Select) UI (74종 마스터, 카테고리 탭, 2-Line 가로 확장).
    * [x] 식재료 메인 카드 & **2-Tier 아코디언** 열림/닫힘 프레임 모션 애니메이션 (D-Day 배지, 소비기한 임박순 정렬, 인스턴스/메모 독립 분리).
    * [x] 바코드 스캔 카메라 프레임 & 영수증 OCR 검수 팝업 UI 퍼블리싱 (모바일 액션시트 vs PC 드래그앤드롭 미리보기, 스켈레톤 로딩, 수동 검수 테이블, Fail-Safe 복구 뷰).
    * [x] 소비기한 만료 영역(dDay < 0) 접이식 격리 및 3대 관리 액션(폐기/먹음/연장) 2단 반응형 마크업.
    * [x] 320px 초소형 모바일 반응형 UI/UX 전면 최적화 (CustomDatePicker 인라인 확장, no-scrollbar 스크롤 락 및 모달 배경 스크롤 차단 useBodyScrollLock 연동).
* [x] **Step 3A-4: 레시피 커뮤니티, 매칭 & 상세/등록 UI 퍼블리싱 (모듈 3, 4)** (완료일시: 2026-10-23 11:05 / 담당자: AI 에이전트)
    * [x] 매칭률(%) 배지 포함 레시피 카드 리스트 및 `[🟢 내 냉장고 뚝딱 매칭]` 토글 버튼 UI (주재료 Hard Gate, 가산점, 양념류 상시보유).
    * [x] 레시피 상세 화면 (`/recipes/:id`: 1~10인분 동적 변환 계산기, [보유/부족/대체/양념류] 4색 신호등 배지, 조리 Step 리스트).
    * [x] 레시피 등록/수정 폼 (`/recipes/new`, `/recipes/:id/edit`: 74종 표준 식재료 Combobox, MAIN/SUB, Step 사진 첨부 미리보기) & `[이 레시피로 요리하기]` 2차 확인 2-Step FIFO 차감 모달 UI.
* [x] **Step 3A-5: 마이페이지 & 알림함 UI 퍼블리싱 및 Phase 3A 디자인 락인 (모듈 1, 5)** (완료일시: 2026-10-24 20:30 / 담당자: AI 에이전트)
    * [x] 상단 헤더 종 아이콘 뱃지(Red Dot 실시간 구독) & 알림함 목록 카드, 액션 바, 2차 확인 모달, EmptyState UI 퍼블리싱.
    * [x] 마이페이지 프로필 카드, 1:1 원형 크롭 모달(0.3x~3.0x 줌/팬 조작), 닉네임 수정 및 고유 유저 태그(#1024 고정).
    * [x] 계정 이메일 변경 모달(ChangeEmailModal: 이메일 유저 인증 링크 발송 / 소셜 유저 플랫폼 변경 안내).
    * [x] 야간 방해금지 시간(21:00~08:00) 둥근 라운드형 시간 선택 드롭다운(RoundTimeSelect) 및 상시 안내 배너.
    * [x] 회원 탈퇴 모달(WithdrawModal: 레시피 익명 전환 보존 필수 동의 체크박스).
    * [x] 서비스 이용약관 및 개인정보 처리방침 조회 모달(TermsModal: Pretendard 고딕 font-sans 강제 및 정통 법률 어투) 신설 및 마이페이지/회원가입/소셜 로그인 상시 연동.
    * [x] 데스크톱(PC) 레이아웃 상단 중복/겹침 해소: 헤더 야간모드 토글 lg:hidden 적용, 메뉴명(handle.title) 일관 표기 및 lg:rounded-t-3xl 적용.
    * [x] **★ UI/UX 디자인 퍼블리싱 최종 검수 & 확정 (Phase 3A Design Lock-in 완료)**: 24개 테스트 스위트, 122개 단위 테스트 100% 통과 및 프로덕션 무오류 빌드 검증 완료.

---

##### ⚡ [2단계] Phase 3B: 프론트엔드 로직, 상태 관리 & 백엔드 API 연동 (Logic & API Integration)
> **개념:** 확정된 UI 마크업 위에 Zustand client state, React Query server state, Form Validation, Axios API Client, 백엔드 API 및 Capacitor 네이티브 기능을 연동합니다.
> **테스트 정책 (User Directive):** Step 3B-2부터 Step 3B-5까지는 브라우저를 직접 띄우는 실테스트(WebP 녹화 및 브라우저 서브에이전트)를 패스하고, 단위 테스트(Vitest) 및 TypeScript 빌드 무오류 검증 중심으로 빠르고 견고하게 연동을 완수합니다.

* [x] **Step 3B-1: API Client, 세션/상태 관리 & Auth 연동 (모듈 1)** (완료일시: 2026-10-24 22:20 / 담당자: AI 에이전트)
    * [x] Axios API Client (Interceptor, `X-Trace-Id` 처리, Sonner Toast / Alert Modal 전역 예외 분기).
    * [x] Zustand 세션 스토어 & Supabase OAuth 세션 동기화 (`POST /api/v1/auth/init`) & Protected Route.
* [x] **Step 3B-2: 사용자 세션 완전 전환 & 마이페이지 API 연동 (모듈 1)** (완료일시: 2026-10-25 01:15 / 담당자: AI 에이전트)
    * [x] 전역 UI(`HomePage`, `MyPage`, `DesktopSidePanel`, `Header`)의 `mockAuthStore` 참조를 `useAuthStore` 실세션으로 전면 교체 (로그인 닉네임, 아바타, 고유태그 즉시 동기화).
    * [x] 본인 프로필 조회(`GET /api/v1/auth/me`) 및 수정(`PATCH /api/v1/auth/me`) 연동.
    * [x] 프로필 아바타 이미지 압축(`browser-image-compression`) 및 Supabase Storage `profiles` 버킷 클라이언트 직업로드 연동.
    * [x] 야간 방해금지 시간 설정(`PATCH /api/v1/auth/me/quiet-time`) 연동.
    * [x] 회원 탈퇴(`DELETE /api/v1/auth/withdraw`: 레시피 익명 보존 USER-02) 연동.
* [x] **Step 3B-3: 내 냉장고 관리소 & 메인 홈 브리핑 API 연동 (모듈 2 & 모듈 6)** (완료일시: 2026-10-25 10:15 / 담당자: AI 에이전트)
    * [x] 74종 표준 식재료 마스터 검색 및 카테고리 Combobox 연동 (`GET /api/v1/inventory/master-ingredients`).
    * [x] 내 냉장고 식재료 목록 조회(`GET /api/v1/inventory`) 및 실시간 PostgreSQL KST D-Day 정렬/필터 연동.
    * [x] 식재료 수동 직접 등록(`POST /api/v1/inventory`) - 독립 레코드 원칙(INV-01-2) 적용.
    * [x] 식재료 개별 수정(`PUT /api/v1/inventory/{id}`) 및 소프트 삭제(`DELETE /api/v1/inventory/{id}`).
    * [x] 수동 소비 차감(`PATCH /api/v1/inventory/{id}/consume`: Math.max 방어 연산 및 잔여 0 시 CONSUMED 전이).
    * [x] 소비기한 만료 재료(D-Day < 0) 3대 관리 액션(폐기 DELETE, 먹음 PATCH consume, 연장 PUT) 연동.
    * [x] 바코드 스캔 조회(`GET /api/v1/inventory/barcode/{no}`) & 영수증 Gemini Flash OCR(`POST /api/v1/inventory/scan-ocr`) 연동 및 Fail-Safe 예외 복구 뷰(`ScanFailSafeModal`) 연결.
    * [x] 메인 홈 브리핑(`GET /api/v1/home/briefing`) 선행 연동: 실제 냉장고 임박 식재료 집계 배지 바인딩 및 추천/인기 레시피 0% 폴백 핸들링 반영.
* [x] **Step 3B-4: 레시피 커뮤니티, 스마트 매칭 & 요리완료 FIFO 연동 (모듈 3, 4)** (완료일시: 2026-10-25 14:30 / 담당자: AI 에이전트)
    * [x] 레시피 8대 카테고리 조회(`GET /api/v1/recipes/categories`), 목록 페이징/검색/필터(`GET /api/v1/recipes`).
    * [x] 레시피 상세 조회(`GET /api/v1/recipes/{id}`), 좋아요(`POST /{id}/like`) 및 스크랩(`POST /{id}/scrap`) 토글 연동.
    * [x] 스마트 매칭 맞춤 추천(`GET /api/v1/matching/recommendations`): `[내 냉장고 뚝딱 매칭]` 토글 연동.
    * [x] `react-hook-form` + `zod` 검증 기반 레시피 등록(`POST /`) 및 수정(`PUT /{id}`).
    * [x] 레시피 썸네일 및 조리 Step(1~10) 이미지 압축 후 Supabase Storage `recipes` 버킷 클라이언트 직업로드 연동.
    * [x] 뚝딱 요리완료(`POST /api/v1/matching/cook/{recipeId}`): 2-Way 옵션 및 **No-Mixing FIFO 자동 차감** 연동 (3B-3 내 냉장고 재료 차감 반영 및 캐시 즉시 동기화).

* [ ] **Step 3B-5: 알림 센터 API 연동 & 홈 브리핑-레시피 딥링크 연계 (모듈 5 & 모듈 6)** (완료일시: - / 담당자: -)
    * [ ] 메인 홈 브리핑-레시피 상세 딥링크 연계: Step 3B-3에서 선연동된 홈 브리핑 1위 추천 레시피 클릭 시 Step 3B-4 레시피 상세(`/recipes/:id`) 이동 및 데이터 정합성 검증.
    * [ ] 알림 센터 목록 조회(`GET /api/v1/notifications`), 상단 헤더 Red Dot 뱃지 실시간 동기화.
    * [ ] 단일/전체 읽음(`PATCH /{id}/read`, `PATCH /read-all`), 단일/전체 삭제(`DELETE /{id}`, `DELETE /all`).
    * [ ] 알림 통합 환경설정(`PATCH /api/v1/notifications/settings`) 연동.
    * [ ] 딥링크(`targetId`) 클릭 시 해당 화면(냉장고/레시피) 이동 및 삭제된 콘텐츠 Fallback 토스트 처리.
* [ ] **Step 3B-6: Capacitor 하이브리드 앱 패키징 & 네이티브 연동 (모바일 전용)** (완료일시: - / 담당자: -)
    * [ ] Capacitor 6.x / Android Native 세팅 & ML Kit 네이티브 바코드 스캐너 플러그인 연동.
    * [ ] FCM 푸시 알림 수신기 연동 & 하드웨어 뒤로가기 버튼(Back Button) 제어.

--------------------------------------------------------------------------------

#### Phase 4: 인수 테스트 및 최종 검토 (Testing & Polish)
**목표:**  서비스의 완성도를 높이고 실사용 검증을 거칩니다.
*  [ ]  **Step 4-1: 핵심 비즈니스 인수 테스트 수행**  (완료일시: - / 담당자: -)
    *  [ ] 07_TEST_SCENARIOS.md에 기반하여 JUnit/Mockito 백엔드 단위 테스트 및 주요 시나리오(냉장고 재료 등록 ➔ 레시피 매칭 ➔ FIFO 차감) 흐름 검증.
*  [ ]  **Step 4-2: 빌드 및 배포 환경 점검**  (완료일시: - / 담당자: -)
    *  [ ] 프론트엔드(Vercel) 및 백엔드(Render) 빌드 에러 확인 및 환경 변수(.env) 세팅 점검.
