# 🧪 핵심 비즈니스 인수 테스트 명세서 (07_TEST_SCENARIOS.md)

## 1. 개요 및 테스트 DoD (Definition of Done) 수칙

본 문서는 '오늘의 뚝딱' 프로젝트의 백엔드/프론트엔드 전체 모듈별 핵심 비즈니스 인수 테스트 시나리오를 정의한다. 개발자 및 AI 에이전트는 코드 작성 시 본 명세서의 테스트 케이스를 바탕으로 검증 코드를 구현해야 한다.

### 💡 백엔드 API 개발 및 테스트 검증 규칙 (DoD)
1. **단위/통합 테스트 작성 의무화 (JUnit 5 + Mockito)**:
   - 컨트롤러 및 서비스 계층 구현 시 비즈니스 로직에 대한 단위 및 통합 테스트 코드를 `src/test/java/com/dduktak/` 아래에 반드시 작성한다.
   - 정상 응답 케이스뿐만 아니라, `GlobalExceptionHandler`와 연동되는 **주요 예외 케이스(잘못된 요청, 리소스 없음, 비즈니스 규칙 위반 등)** 검증을 포함한다.
2. **API 검증 결과 누적 기록 (`.agent/09_API_TEST_RESULTS.md`)**:
   - API 스펙 문서(`05_API_SPECIFICATION.md`)는 순수 엔드포인트 및 DTO 규격 위주로 유지한다.
   - 신규 API를 개발하거나 수정할 때마다, 실제 실행된 테스트 시나리오 및 검증 결과를 `.agent/09_API_TEST_RESULTS.md` 문서에 누적 기록한다.

---

## 2. 도메인 모듈별 인수 테스트 시나리오 (Acceptance Test Scenarios)

### 2.1. [모듈 1] 회원 & 인증 (Auth Domain)
* **TC-AUTH-01: 이메일 회원가입 및 중복 검증 예외**
  - **수행 내용**: 신규 이메일 및 닉네임으로 가입 요청 (`POST /api/v1/auth/signup`).
  - **검증 기준**: 
    1. 성공 시 HTTP 200 OK 및 `userId`, `nickname`, 4자리 무작위 `userTag` 반환.
    2. 이미 존재하는 이메일로 가입 시도 시 `AUTH_FIELD_DUPLICATE_EMAIL` (400 Bad Request) 예외 발생 검증.
* **TC-AUTH-02: 로그인 및 JWT 토큰(Access/Refresh) 발급**
  - **수행 내용**: 올바른 이메일/비밀번호로 로그인 요청 (`POST /api/v1/auth/login`).
  - **검증 기준**: `accessToken` 및 `refreshToken`이 정상 발급되며, 잘못된 비밀번호 입력 시 `AUTH_WARN_INVALID_CREDENTIALS` 예외 발생.
* **TC-AUTH-03: Refresh Token을 활용한 Access Token 재발급**
  - **수행 내용**: 만료된 Access Token 대신 유효한 Refresh Token으로 재발급 요청 (`POST /api/v1/auth/refresh`).
  - **검증 기준**: 신규 `accessToken` 및 `refreshToken` 세트가 정상 반환됨.
* **TC-AUTH-04: 회원 탈퇴 시 개인 데이터 파기 및 레시피 익명화 (USER-02)**
  - **수행 내용**: 회원 탈퇴 요청 (`DELETE /api/v1/auth/withdraw`).
  - **검증 기준**:
    1. 유저 개인 정보, 내 냉장고 식재료(`user_ingredient`), 알림 데이터 즉시 파기(Hard Delete / Soft Delete).
    2. 해당 유저가 작성한 레시피(`recipe`)의 `author_id`는 `NULL`로 업데이트되어 커뮤니티 레시피로 익명화 보존됨을 검증.

---

### 2.2. [모듈 2] 내 재료 관리소 (Inventory Domain)
* **TC-INV-01: 표준 식재료 수동 등록 및 독립 레코드 저장 (INV-01-2)**
  - **수행 내용**: 동일한 표준 식재료("계란")를 다른 메모("엄마표", "편의점 1+1") 및 유통기한으로 2회 연속 등록 (`POST /api/v1/inventory`).
  - **검증 기준**: 기존 레코드 수량이 합산(UPDATE)되지 않고, `user_ingredient` 테이블에 각각 독립된 PK 레코드로 2건 저장됨을 확인.
* **TC-INV-02: 2-Tier Accordion 대표 카드 그룹화 및 만료 영역 분리 (INV-02-1, INV-02-4)**
  - **수행 내용**: 내 냉장고 목록 조회 (`GET /api/v1/inventory`).
  - **검증 기준**:
    1. 동일 마스터 재료들이 대표 카드로 그룹화되고, 가장 임박한 D-Day 배지가 대표 카드로 표기됨.
    2. 소비기한이 도과한 재료(`D-Day < 0`)는 메인 리스트에서 제외되어 최하단 '소비기한 만료 영역'으로 이동.
* **TC-INV-03: 식재료 수동 소비(status=CONSUMED) vs 수동 삭제(status=DELETED) 상태 분리 (INV-04-1)**
  - **수행 내용**: 아코디언 상세 뷰에서 [소비 완료] (`PATCH /inventory/{id}/consume`) 및 [삭제] (`DELETE /inventory/{id}`) 실행.
  - **검증 기준**: 소비 시 `status = 'CONSUMED'`, 삭제 시 `status = 'DELETED'`로 DB 상태 전이가 엄격히 구분됨을 검증.
* **TC-INV-04: 외부 스캔(바코드/영수증 OCR) 실패 시 예외 복구 흐름 (INV-01-3)**
  - **수행 내용**: 인식 불가능한 바코드 스캔 또는 영수증 사진 업로드 (`POST /scan-ocr`).
  - **검증 기준**: 서버 에러(500)가 발생하지 않고, 스캔 실패 안내 팝업과 함께 [다시 촬영하기] / [수동 등록하기] 선택권 제공.

---

### 2.3. [모듈 3] 뚝딱 레시피 커뮤니티 (Recipe Domain)
* **TC-RCP-01: 표준 식재료 기반 레시피 신규 등록 (REC-01-2)**
  - **수행 내용**: `ingredient_master` 표준 재료를 바인딩하여 주재료(MAIN)/부재료(SUB) 구분 및 조리 단계(Step) 입력 후 등록 (`POST /api/v1/recipes`).
  - **검증 기준**: 레시피 및 `recipe_ingredient`, `recipe_step` 데이터가 트랜잭션 내에 정상 등록됨.
* **TC-RCP-02: 레시피 상세 조회 및 본인 상호작용 플래그 (`isLiked`, `isScrapped`)**
  - **수행 내용**: 레시피 상세 페이지 조회 (`GET /api/v1/recipes/{recipeId}`).
  - **검증 기준**: 해당 유저의 좋아요 여부(`isLiked`) 및 스크랩 여부(`isScrapped`) 불리언 플래그가 정확히 반환되어 UI 하트/북마크 렌더링 지원.
* **TC-RCP-03: 본인 작성 레시피 수정/삭제 권한 검증 (REC-01-4)**
  - **수행 내용**: 타인이 작성한 레시피에 대해 수정(`PUT`) 또는 삭제(`DELETE`) 요청.
  - **검증 기준**: `RCP_WARN_NOT_AUTHOR` (403 Forbidden) 예외가 발생하며 처리가 거부됨을 검증.
* **TC-RCP-04: 마이페이지 레시피 목록 필터링 (`filter=ALL, MY, SCRAP`)**
  - **수행 내용**: 레시피 목록 조회 시 `filter=MY` 및 `filter=SCRAP` 파라미터 전달 (`GET /api/v1/recipes`).
  - **검증 기준**: 내가 작성한 레시피 및 내가 북마크한 레시피 목록만 정상 필터링되어 반환됨.

---

### 2.4. [모듈 4] 스마트 매칭 엔진 (Smart Matching Engine Domain)
* **TC-MATCH-01: 주재료 필수 하드 필터링 (Hard Gate - MATCH-01-1)**
  - **수행 내용**: 내 냉장고에 주재료(MAIN)가 0개 포함된 레시피에 대해 매칭 추천 요청 (`GET /api/v1/matching/recommendations`).
  - **검증 기준**: 해당 레시피의 매칭 점수가 0% 처리되며, 뚝딱 매칭 추천 목록에서 완전히 제외됨을 검증.
* **TC-MATCH-02: 매칭 점수 산출 및 소비기한 임박 가산점 연산 (Base + Bonus Score)**
  - **수행 내용**: D-1 임박 주재료("돼지고기")를 보유한 상태에서 [돼지고기 김치찌개] 매칭 추천 실행.
  - **검증 기준**: Base Score(77.5점) + 임박 주재료 가산점(+10점)이 반영되어 최종 매칭률 88%로 정렬 최상단 노출.
* **TC-MATCH-03: 요리 완료 시 선입선출(FIFO) 자동 차감 및 양념류 차감 제외 (INV-04-2, REC-03-1)**
  - **수행 내용**: [돼지고기 김치찌개] 요리 완료 (`POST /api/v1/matching/cook/{recipeId}`) 실행.
  - **검증 기준**:
    1. 유저 냉장고의 동일 재료 중 소비기한이 가장 임박한 레코드(`expire_date ASC`)부터 수량이 순차 차감됨.
    2. 양념/소스 카테고리 재료(`is_sauce = TRUE`)는 차감 대상에서 자동 제외됨.
* **TC-MATCH-04: 요리 완료 2-Way 옵션 및 `cookedCount` 연동**
  - **수행 내용**: Request Body에 `deductInventory: false`, `servings: 2` 전달하여 요리 완료 실행.
  - **검증 기준**: 냉장고 수량 차감 없이(`isDeducted: false`), 레시피 요리 완료 카운트(`cookedCount`)만 +1 증가함.

---

### 2.5. [모듈 5 & 6] 알림 센터 및 메인 브리핑 (Notification & Main Briefing Domain)
* **TC-NOTI-01: 매일 09시 D-3, D-1 소비기한 임박 알림 그룹화 및 야간 제한**
  - **수행 내용**: @Scheduled 스케줄러 실행 시 임박 재료 보유 유저 대상 알림 생성.
  - **검증 기준**: 유저별 임박 재료가 1개의 단일 알림 메시지로 그룹화 생성되며, 방해금지 시간 설정 시 발송 제외 처리.
* **TC-HOME-01: 메인 화면 종합 브리핑 위젯 조회**
  - **수행 내용**: 메인 화면 진입 시 브리핑 정보 요청 (`GET /api/v1/home/briefing`).
  - **검증 기준**: 닉네임, 임박 재료 개수, D-Day 임박 리스트 top 3, 최고 매칭률 레시피 위젯 데이터가 200ms 이내 응답.

---

## 3. 전역 예외 처리 & AOP 로깅 트레이싱 테스트

* **TC-GLOBAL-01: LoggingAspect & TraceIdFilter MDC 트레이싱**
  - **수행 내용**: API 요청 실행 및 응답 헤더 확인.
  - **검증 기준**:
    1. HTTP 응답 헤더에 `X-Trace-Id: [6자리]` 주입 확인.
    2. 콘솔 로그에 `[START] [ReqID: xxxxxx] [Controller]` 포맷 기록 및 요청 종료 시 `MDC.clear()` 메모리 누수 방지 검증.
* **TC-GLOBAL-02: Validation & CustomException UX 태그 변환**
  - **수행 내용**: 잘못된 요청 파라미터 전송.
  - **검증 기준**: `GlobalExceptionHandler`에서 `@Valid` 에러를 캡처하여 `[도메인]_[UX태그]_[상세원인]` 포맷의 표준 `ErrorResponseDto`로 변환하여 HTTP 400 응답 반환.
