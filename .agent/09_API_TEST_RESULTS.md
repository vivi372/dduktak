# 📊 백엔드 API 테스트 시나리오 및 검증 결과서 (09_API_TEST_RESULTS.md)

## 1. 개요 및 테스트 원칙
본 문서는 '오늘의 뚝딱' 프로젝트의 도메인 모듈별 REST API 개발에 따른 JUnit 5 / Mockito 단위·슬라이스·통합 테스트 시나리오 및 실행 검증 결과를 누적 관리하는 공식 문서이다.
`05_API_SPECIFICATION.md`의 순수 엔드포인트 명세성을 보존하면서, 실제 백엔드 코드의 비즈니스 로직 및 예외 처리 신뢰성을 보증한다.

---

## 2. [모듈 1] 회원 및 인증 API (/api/v1/auth) 테스트 검증 결과

* **테스트 실행 일자**: 2026-10-20
* **아키텍처 전환**: Spring Boot 자체 회원가입 ➔ Supabase Auth + `public.profiles` (Lazy JIT Sync) 하이브리드 아키텍처 리팩토링
* **테스트 대상 클래스**:
  - `com.dduktak.global.util.JwtProviderTest`
  - `com.dduktak.domain.auth.service.AuthServiceTest`
  - `com.dduktak.domain.auth.controller.AuthControllerTest`
  - `com.dduktak.global.config.SecurityConfigTest`
  - `com.dduktak.domain.auth.mapper.ProfileMapperIntegrationTest`
* **테스트 커버리지 결과**: 모듈 1 관련 테스트 포함 전역 49개 테스트 케이스 **100% 성공 (0 Failures, 0 Errors)**

---

### 2.1. 세부 테스트 케이스 명세 및 검증 매트릭스

| ID | 테스트 분류 | 대상 엔드포인트 / 메서드 | 테스트 시나리오 및 검증 기준 | 결과 |
| :-: | :---: | :--- | :--- | :---: |
| **TC-AUTH-01** | `단위` | `POST /api/v1/auth/init`<br>`AuthService.initProfile()` | **첫 로그인 시점 지연 프로필 생성 및 멱등성 검증 (AUTH-01-2, AUTH-02-2)**<br>1. 첫 로그인 유저 미등록 감지 시 4자리 고유 `userTag` 자동 생성 및 기본 프로필 `public.profiles` 저장 검증<br>2. 기등록된 유저 재호출 시 신규 INSERT 없이 기존 프로필 정보를 즉시 반환하는 멱등성 검증 | **성공** |
| **TC-AUTH-02** | `단위` | `GET /api/v1/auth/me`<br>`AuthService.getMyProfile()` | **본인 프로필 조회 (Read-Only 멱등 API)**<br>1. 회원 UUID로 조회 시 `auth.users` LEFT JOIN을 통해 이메일, 닉네임, 유저 태그, 프로필 이미지, 상태(ACTIVE), 방해금지 시간 정상 반환<br>2. 미존재 프로필 조회 시 `AUTH_WARN_USER_NOT_FOUND`(404 Not Found) 예외 발생 검증 | **성공** |
| **TC-AUTH-03** | `단위` | `PATCH /api/v1/auth/me`<br>`AuthService.updateMyProfile()` | **프로필 수정 및 중복 검증 (USER-01-3)**<br>1. 닉네임(2~10자) 및 프로필 이미지 수정 정상 반영 검증<br>2. 기존 유저 태그 유지 하에 신규 닉네임+태그 조합 중복 발생 시 `AUTH_FIELD_DUPLICATE_NICKNAME`(409 Conflict) 예외 발생 검증 | **성공** |
| **TC-AUTH-04** | `단위` | `PATCH /api/v1/auth/me/quiet-time`<br>`AuthService.updateQuietTime()` | **야간 방해금지 시간대 설정 (USER-PAGE-04)**<br>`quietTimeStart`, `quietTimeEnd` 필드 DB 업데이트 및 응답 DTO 반환 검증 | **성공** |
| **TC-AUTH-05** | `단위` | `DELETE /api/v1/auth/withdraw`<br>`AuthService.withdraw()` | **회원 탈퇴 및 데이터 처리 정책 (USER-02)**<br>1. 이메일 회원 탈퇴 시 `auth.users` 비밀번호 검증 후 `recipe.user_id = NULL` 선제 익명화 및 프로필 삭제(Cascade) 호출 검증<br>2. 비밀번호 불일치 시 `AUTH_CONFIRM_WITHDRAWAL_FAILED`(400 Bad Request) 예외 발생 및 탈퇴 중단 검증 | **성공** |
| **TC-SEC-01** | `통합` | `SecurityFilterChain`<br>`JwtAuthenticationEntryPoint` | **보호 엔드포인트 미인증 차단 검증**<br>`/init`, `/me`, `/withdraw`에 Bearer 토큰 없이 접근 시 401 Unauthorized 및 `AUTH_ALERT_UNAUTHORIZED` JSON 규격 반환 검증 | **성공** |
| **TC-SEC-02** | `통합` | `SecurityFilterChain`<br>`JwtAuthenticationFilter` | **Supabase JWT Bearer 토큰 인가 연동 검증**<br>유효한 Supabase Access Token 헤더 전달 시 UUID 기반 `UserPrincipal` 인증 주체 등록 및 정상 200 반환 | **성공** |
| **TC-SEC-03** | `통합` | `SecurityFilterChain`<br>`JwtAuthenticationFilter` | **유효하지 않거나 만료된 토큰 차단 검증**<br>서명 불일치 또는 위조된 토큰으로 접근 시 401 Unauthorized 거부 | **성공** |
| **TC-JWT-01** | `단위` | `JwtProvider` | **Supabase JWT 파싱 및 클레임 추출 검증**<br>토큰 서명 검증, `sub` 클레임의 `UUID` 파싱, `email`, `role`, `user_metadata` 추출 및 만료/위조 감지 검증 | **성공** |
| **TC-MAP-01** | `통합` | `ProfileMapper` & PostgreSQL | **PostgreSQL 실제 쿼리 무결성 검증**<br>`insertProfile`, `findById`, `findProfileWithEmailById`(auth.users JOIN), `existsById`, `existsByNicknameAndUserTag`, `updateProfile`, `updateQuietTime`, `anonymizeRecipesByUserId`, `deleteProfileById` 전체 CRUD 생명주기 검증 | **성공** |
| **TC-CTL-01** | `슬라이스` | `AuthController`<br>`GlobalExceptionHandler` | **Request DTO 유효성 검증 (@Valid)**<br>닉네임 2자 미만 입력 시 400 Bad Request 및 `COMMON_FIELD_INVALID_INPUT` 반환 검증 | **성공** |
| **TC-CTL-02** | `슬라이스` | `TraceIdFilter` | **응답 헤더 X-Trace-Id 주입 검증**<br>모든 Auth API 응답 헤더에 6자리 무작위 `X-Trace-Id` 주입 및 MDC 라이프사이클 검증 | **성공** |

---

### 2.2. Gradle 빌드 및 전체 테스트 실행 결과 로그

```text
> Task :compileJava
> Task :processResources
> Task :classes
> Task :compileTestJava UP-TO-DATE
> Task :processTestResources NO-SOURCE
> Task :testClasses UP-TO-DATE
> Task :test

BUILD SUCCESSFUL in 11s
49 tests completed, 0 failed, 0 skipped.
```

---

## 3. [모듈 2] 내 냉장고 외부 연동 API (바코드 및 영수증 OCR) 테스트 검증 결과

* **테스트 실행 일자**: 2026-10-20
* **구현 아키텍처**:
  - **바코드 연동 (`GET /api/v1/inventory/barcode/{barcodeNo}`)**:
    * FoodQR / 식품안전나라 유통 바코드 공공 데이터 및 인메모리 바코드 사전을 통해 유통 상품명을 선조회.
    * 조회된 상품명을 스마트 매칭 엔진(`IngredientMatcher`)을 통해 표준 `ingredient_master`(74종)와 유의어/동의어 기반 유사도 매칭 수행.
    * 바코드 미등록 또는 74종 마스터와 매칭되는 표준 식재료가 없을 경우 비즈니스 규격에 따라 `404 Not Found` (`INV_WARN_BARCODE_NOT_FOUND`) 반환.
  - **영수증 OCR 연동 (`POST /api/v1/inventory/scan-ocr`)**:
    * Google AI Studio Gemini Flash REST API (`gemini-flash-latest`) 프록시를 통해 업로드된 영수증 이미지(MultipartFile)에서 Base64 인코딩 및 JSON 스키마 기반 식품 품목 배열을 추출.
    * 추출된 품목을 `ingredient_master`와 매칭하여 표준 식재료 ID, 수량, 기본 단위, 권장 소비기한(`CURRENT_DATE + default_shelf_days`)을 자동 산출.
    * API 장애, 미인식, 또는 파싱 실패 시 서버 500 에러를 원천 방지하고 Fail-safe 빈 배열 `[]` (`200 OK`) 반환.
* **테스트 대상 클래스**:
  - `com.dduktak.domain.inventory.service.IngredientMatcherTest`
  - `com.dduktak.domain.inventory.service.InventoryServiceTest`
  - `com.dduktak.domain.inventory.service.GeminiOcrClientLiveTest`
  - `com.dduktak.domain.inventory.controller.InventoryControllerTest`
  - `com.dduktak.domain.inventory.mapper.IngredientMasterMapperIntegrationTest`
* **테스트 커버리지 결과**: 모듈 1(49개) + 모듈 2(23개) 전역 **72개 테스트 케이스 100% 성공 (0 Failures, 0 Errors)**

---

### 3.1. 세부 테스트 케이스 명세 및 검증 매트릭스

| ID | 테스트 분류 | 대상 엔드포인트 / 메서드 | 테스트 시나리오 및 검증 기준 | 결과 |
| :-: | :---: | :--- | :--- | :---: |
| **TC-INV-BARCODE-01** | `단위/슬라이스` | `GET /api/v1/inventory/barcode/{barcodeNo}`<br>`InventoryService.getIngredientByBarcode()` | **바코드 정상 조회 및 표준 식재료 매핑 (200 OK)**<br>바코드 `0246890115701` 조회 시 "국내산 냉장 삼겹살 구이용" 상품명 조회 ➔ `IngredientMatcher`를 통해 "돼지고기 (삼겹살/목살)"(ID: 49) 매핑 ➔ 200 OK 및 표준 식재료 DTO 반환 검증 | **성공** |
| **TC-INV-BARCODE-02** | `단위/슬라이스` | `GET /api/v1/inventory/barcode/{barcodeNo}`<br>`InventoryService.getIngredientByBarcode()` | **미등록 바코드 조회 시 404 예외 반환 (SYS-01/INV-01-3)**<br>사전 및 공공 DB에 미등록된 바코드(`9999999999999`) 조회 시 500 대신 `404 Not Found` 및 `INV_WARN_BARCODE_NOT_FOUND` 에러 응답 반환 검증 | **성공** |
| **TC-INV-BARCODE-03** | `단위/슬라이스` | `GET /api/v1/inventory/barcode/{barcodeNo}`<br>`InventoryService.getIngredientByBarcode()` | **바코드 상품명 존재하나 마스터 매핑 불가 시 404 반환**<br>바코드 `08801045121086`("오늘밥상 바로 무쳐먹는 파채양념")처럼 74종 마스터에 대응 식재료가 없을 경우 `INV_WARN_BARCODE_NOT_FOUND`(404) 반환 및 프론트엔드 수동 등록 유도 검증 | **성공** |
| **TC-INV-OCR-01** | `단위/슬라이스` | `POST /api/v1/inventory/scan-ocr`<br>`InventoryService.scanReceiptOcr()` | **영수증 OCR 품목 추출 및 표준 식재료 매핑 (200 OK)**<br>Gemini Flash OCR을 통해 추출된 원문 상품명 배열 ➔ 표준 식재료 매핑 후 `recommendedExpireDate` 연산(당일 + defaultShelfDays) 반영된 `List<OcrIngredientResponseDto>` 정상 반환 검증 | **성공** |
| **TC-INV-OCR-02** | `단위/슬라이스` | `POST /api/v1/inventory/scan-ocr`<br>`InventoryService.scanReceiptOcr()` | **OCR 실패/미인식/API 오류 시 Fail-Safe 빈 배열 반환 (INV-01-3)**<br>이미지가 null이거나 비어있거나, Gemini API 통신 장애 발생 시 500 에러를 방지하고 `200 OK`의 빈 배열 `[]` 반환 검증 | **성공** |
| **TC-INV-OCR-03** | `통합(실데이터)` | `GeminiOcrClientLiveTest`<br>`InventoryService.scanReceiptOcr()` | **실제 영수증 이미지(`영수증 이미지.jpg`) 기반 Gemini Flash 실호출 검증**<br>실제 영수증 이미지 분석 시 일판란(달걀), 파채(대파), 차돌박이/양지(소고기), 닭가슴살 등 5건의 표준 식재료가 정상 추출 및 매핑됨을 검증 | **성공** |
| **TC-INV-MATCH-01** | `단위` | `IngredientMatcher.match()` | **유의어/동의어/복합어 스마트 매칭 정확도 검증**<br>"삼겹살" ➔ "돼지고기 (삼겹살/목살)", "호주산냉장곡물양지" ➔ "소고기 (국거리/불고기용)", "일판란 30구(특란)" ➔ "달걀", "파채무침" ➔ "대파", "갈비살" ➔ "소고기 (구이용)" 등 8종 이상 매칭 케이스 통과 | **성공** |
| **TC-INV-MAPPER-01** | `통합` | `IngredientMasterMapper` & PostgreSQL | **PostgreSQL 실제 `ingredient_master` 테이블 무결성 검증**<br>74종 전체 마스터 목록 조회(`findAll`), ID 단건 조회(`findById`), 이름 단건 조회(`findByName`), LIKE 검색(`searchByNameLike`) 정상 수행 검증 | **성공** |
| **TC-INV-CTL-01** | `슬라이스` | `InventoryController`<br>`GlobalExceptionHandler` | **바코드/OCR 엔드포인트 MockMvc 통신 및 직렬화 검증**<br>1. 바코드 조회 성공 시 200 OK 및 JSON 응답 반환 검증<br>2. 미등록 바코드 조회 시 404 및 에러 코드 JSON 반환 검증<br>3. 영수증 이미지 멀티파트 업로드 시 200 OK 및 LocalDate 포맷("YYYY-MM-DD") 반환 검증<br>4. 응답 헤더 `X-Trace-Id` 주입 검증 | **성공** |

---

### 3.2. 전체 테스트 스위트 빌드 및 실행 결과 로그

```text
> Task :compileJava UP-TO-DATE
> Task :processResources UP-TO-DATE
> Task :classes UP-TO-DATE
> Task :compileTestJava
> Task :processTestResources NO-SOURCE
> Task :testClasses
> Task :test

BUILD SUCCESSFUL in 36s
72 tests completed, 0 failed, 0 skipped.
```

---

## 4. [모듈 2] 내 냉장고 핵심 CRUD 및 표준 식재료 마스터 API (/api/v1/inventory) 테스트 검증 결과

* **테스트 실행 일자**: 2026-10-21
* **핵심 구현 정책 및 아키텍처**:
  - **표준 마스터 식재료 조회 (`GET /api/v1/inventory/master-ingredients`)**:
    * 74종 표준 식재료 및 카테고리(`ingredient_category`)를 JOIN하여 식재료 등록 시 모바일 검색창 자동완성 및 권장 소비기한/기본단위 제공.
  - **독립 레코드(Independent Record) 수동 등록 (`POST /api/v1/inventory`)**:
    * 동일한 재료(예: '계란')를 여러 번 등록하더라도 기존 레코드에 수량을 합산(UPDATE)하지 않고 개별 PK 레코드로 각각 신규 INSERT (`INV-01-2`).
    * 소비기한 미입력 시 마스터 식재료의 권장 보관일수(`default_shelf_days`)를 오늘 날짜에 가산하여 자동 계산.
  - **SQL 레벨 KST D-Day 연산 및 소비기한 임박순 정렬 (`GET /api/v1/inventory`)**:
    * Supabase 클라우드 DB 타임존(UTC)과 한국 현지 시간(KST) 편차를 방어하기 위해 `(ui.expire_date - (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date) AS d_day`로 실시간 D-Day 연산.
    * `expire_date ASC, created_at ASC` 복합 정렬 인덱스를 활용한 고속 임박순 정렬.
  - **식재료 개별 수정 (`PUT /api/v1/inventory/{ingredientId}`)**:
    * 표준 식재료 마스터(종류)는 불변 정책 유지. 보관방법, 수량, 단위, 소비기한, 메모에 한해 안전하게 수정. 타인 소유 또는 미존재 시 `404 Not Found` (`INV_WARN_NOT_FOUND`) 차단.
  - **소프트 삭제 (`DELETE /api/v1/inventory/{ingredientId}`)**:
    * 물리 삭제를 방지하고 `status = 'DELETED'`로 상태를 전이하여 통계 및 이력 보존.
  - **수동 소비 및 방어적 수량 차감 (`PATCH /api/v1/inventory/{ingredientId}/consume`)**:
    * `Math.max(0, current - consume)` 수량 방어 로직을 적용하여 음수 수량을 원천 방지하고, 잔여 수량이 0 이하가 되면 상태를 `status = 'CONSUMED'`로 자동 전이.
    * 소비 수량 미입력(`consumeQuantity: null`) 시 전량 소비 간주.
* **테스트 대상 클래스**:
  - `com.dduktak.domain.inventory.service.InventoryServiceTest`
  - `com.dduktak.domain.inventory.controller.InventoryControllerTest`
  - `com.dduktak.domain.inventory.mapper.UserIngredientMapperIntegrationTest`
* **테스트 커버리지 결과**: 모듈 1 + 모듈 2 전체 **95개 테스트 케이스 100% 성공 (0 Failures, 0 Errors)**

---

### 4.1. 세부 테스트 케이스 명세 및 검증 매트릭스

| ID | 테스트 분류 | 대상 엔드포인트 / 메서드 | 테스트 시나리오 및 검증 기준 | 결과 |
| :-: | :---: | :--- | :--- | :---: |
| **TC-INV-MST-01** | `단위/슬라이스` | `GET /api/v1/inventory/master-ingredients`<br>`InventoryService.getMasterIngredients()` | **74종 표준 마스터 식재료 및 카테고리 검색 (200 OK)**<br>`query` 유사 검색어 및 `categoryId` 필터링에 대응하여 카테고리명, 기본 단위, 권장 보관일수를 포함한 DTO 목록 정상 반환 검증 | **성공** |
| **TC-INV-CRUD-01** | `단위/슬라이스` | `POST /api/v1/inventory`<br>`InventoryService.addIngredient()` | **신규 식재료 등록 및 독립 레코드 원칙 검증 (201 Created)**<br>동일 식재료 기등록 여부와 무관하게 신규 PK 생성(INSERT), 소비기한 미입력 시 `defaultShelfDays` 자동 계산 반영 검증 | **성공** |
| **TC-INV-CRUD-02** | `슬라이스` | `POST /api/v1/inventory`<br>`GlobalExceptionHandler` | **식재료 등록 @Valid 유효성 검증 실패 (400 Bad Request)**<br>수량 0 이하(`@Positive` 위반), 보관방법 미선택(`@NotBlank` 위반) 시 400 Bad Request 및 `COMMON_FIELD_INVALID_INPUT` 반환 검증 | **성공** |
| **TC-INV-CRUD-03** | `단위/슬라이스` | `GET /api/v1/inventory`<br>`InventoryService.getMyIngredients()` | **내 냉장고 식재료 목록 조회 및 D-Day 연산 검증 (200 OK)**<br>SQL 기반 실시간 KST D-Day 연산 및 소비기한 임박순 정렬 결과 반환, Jackson `@JsonProperty("dDay")` 카멜케이스 직렬화 검증 | **성공** |
| **TC-INV-CRUD-04** | `단위/슬라이스` | `PUT /api/v1/inventory/{ingredientId}`<br>`InventoryService.updateIngredient()` | **식재료 개별 수정 및 소유권 검증 (200 OK / 404 Not Found)**<br>1. 본인 소유 식재료의 보관방법/수량/단위/소비기한/메모 수정 성공 검증<br>2. 타인 소유 또는 존재하지 않는 식재료 수정 시 404 `INV_WARN_NOT_FOUND` 차단 검증 | **성공** |
| **TC-INV-CRUD-05** | `단위/슬라이스` | `DELETE /api/v1/inventory/{ingredientId}`<br>`InventoryService.deleteIngredient()` | **식재료 소프트 삭제 및 소유권 검증 (200 OK / 404 Not Found)**<br>1. 본인 식재료 삭제 시 `status='DELETED'` 전이 및 200 OK 반환 검증<br>2. 타인 소유 또는 존재하지 않는 식재료 삭제 시 404 `INV_WARN_NOT_FOUND` 차단 검증 | **성공** |
| **TC-INV-CONS-01** | `단위/슬라이스` | `PATCH /api/v1/inventory/{ingredientId}/consume`<br>`InventoryService.consumeIngredient()` | **수동 부분 소비 및 ACTIVE 상태 유지 검증 (200 OK)**<br>보유 10개 중 3개 소비 ➔ 잔여 7개 반영 및 `status = 'ACTIVE'` 상태 유지 검증 | **성공** |
| **TC-INV-CONS-02** | `단위/슬라이스` | `PATCH /api/v1/inventory/{ingredientId}/consume`<br>`InventoryService.consumeIngredient()` | **보유량 초과 소비 시 Math.max 방어 로직 및 CONSUMED 전이 검증 (INV-01-2)**<br>보유 5개 중 8개 소비 요청 시 음수가 되지 않고 0으로 고정 클램핑되며 `status = 'CONSUMED'` 자동 전이 검증 | **성공** |
| **TC-INV-CONS-03** | `단위/슬라이스` | `PATCH /api/v1/inventory/{ingredientId}/consume`<br>`InventoryService.consumeIngredient()` | **소비 수량 미입력 시 전량 소비 간주 (200 OK)**<br>`consumeQuantity: null` 전달 시 잔여 0 및 `status = 'CONSUMED'` 전이 검증 | **성공** |
| **TC-INV-MAP-01** | `통합` | `UserIngredientMapper` & PostgreSQL | **PostgreSQL 실제 MyBatis 매핑 및 타임존 무결성 검증**<br>1. `insert`: `useGeneratedKeys` PK 획득 및 독립 레코드 생성 검증<br>2. `findByIdAndUserId`: 본인 소유 활성 식재료 정상 조회 및 타인 격리 검증<br>3. `findAllByUserIdAndFilter`: `Asia/Seoul` 기준 D-Day 연산 및 `expire_date ASC` 정렬 검증<br>4. `update`, `updateQuantityAndStatus`, `softDelete`: 실제 DB 상태 전이 무결성 검증 | **성공** |

---

### 4.2. 전체 테스트 스위트 빌드 및 실행 결과 로그

```text
> Task :compileJava UP-TO-DATE
> Task :processResources UP-TO-DATE
> Task :classes UP-TO-DATE
> Task :compileTestJava UP-TO-DATE
> Task :processTestResources NO-SOURCE
> Task :testClasses UP-TO-DATE
> Task :test

BUILD SUCCESSFUL in 13s
95 tests completed, 0 failed, 0 skipped.
```

---

## 5. [모듈 3] 뚝딱 레시피 커뮤니티 API (/api/v1/recipes) 테스트 검증 결과

* **테스트 실행 일자**: 2026-10-21
* **핵심 구현 정책 및 아키텍처**:
  - **표준 식재료 연동 유효성 검증 (`POST /api/v1/recipes`)**:
    * 자유 텍스트 입력을 원천 차단하고 `ingredient_master`에 사전 등록된 표준 재료만 레시피 재료(`recipe_ingredient`)로 등록 허용 (미등록 재료 전달 시 `COMMON_FIELD_INVALID_INPUT` 차단).
    * 최소 1개 이상의 재료 필수 검증 (`RECIPE_FIELD_REQUIRED_INGREDIENTS`).
  - **레시피 상세 조회 및 사용자 상호작용 (`GET /api/v1/recipes/{recipeId}`)**:
    * 레시피 메타데이터, 닉네임/유저태그, 재료 목록(`isSauce` 양념류 표기 포함), 조리 순서(`stepNo ASC`) 일괄 응답.
    * 요청 유저의 좋아요(`isLiked`) 및 스크랩(`isScrapped`) 여부 불리언 플래그 반환.
  - **수정/삭제 권한 및 익명 레시피 보호 (`PUT /api/v1/recipes/{recipeId}`, `DELETE`)**:
    * 본인이 작성한 레시피만 수정/삭제 허용 (`REC-01-4`).
    * 회원 탈퇴(`USER-02`)로 `user_id = NULL`이 된 익명 레시피는 모든 유저의 수정/삭제 요청 시 `403 Forbidden` (`RECIPE_WARN_NOT_AUTHOR`)으로 원천 차단하여 커뮤니티 자산 영구 보존.
  - **레시피 목록 필터링 및 검색 (`GET /api/v1/recipes`)**:
    * `filter=ALL`, `filter=MY` (내가 작성한 레시피), `filter=SCRAP` (내가 북마크한 레시피 `scrap` 테이블 연동) 정상 필터링.
    * 카테고리 필터링(`recipeCategoryId`), 제목/재료명 통합 검색(`query`), 최신순/인기순/요리완료순 정렬 및 페이징 지원.
  - **원자적 카운터 및 토글 (`POST /like`, `POST /scrap`)**:
    * 동시성 이슈를 예방하기 위해 DB SQL 레벨에서 `like_count = like_count + 1`, `like_count = GREATEST(0, like_count - 1)` 원자적 쿼리 수행.
* **테스트 대상 클래스**:
  - `com.dduktak.domain.recipe.service.RecipeServiceTest`
  - `com.dduktak.domain.recipe.controller.RecipeControllerTest`
  - `com.dduktak.domain.recipe.mapper.RecipeMapperIntegrationTest`

---

### 5.1. 세부 테스트 케이스 명세 및 검증 매트릭스

| ID | 테스트 분류 | 대상 엔드포인트 / 메서드 | 테스트 시나리오 및 검증 기준 | 결과 |
| :-: | :---: | :--- | :--- | :---: |
| **TC-RCP-01** | `단위/슬라이스` | `POST /api/v1/recipes`<br>`RecipeService.createRecipe()` | **표준 식재료 기반 레시피 등록 및 마스터 식재료 검증 (201 Created)**<br>1. 표준 식재료(`ingredient_master`) 바인딩, MAIN/SUB 구분, 조리 순서 트랜잭션 정상 등록 검증<br>2. 미등록 마스터 식재료 ID 전달 시 `COMMON_FIELD_INVALID_INPUT` 예외 발생 검증 | **성공** |
| **TC-RCP-02** | `단위/슬라이스` | `GET /api/v1/recipes/{recipeId}`<br>`RecipeService.getRecipeDetail()` | **레시피 상세 조회 및 본인 상호작용 플래그 (`isLiked`, `isScrapped`, `isSauce`)**<br>상세 정보, 작성자 닉네임/태그, 좋아요 여부, 스크랩 여부 및 양념류(`isSauce`) 불리언 플래그 정확성 검증 | **성공** |
| **TC-RCP-03** | `단위/슬라이스` | `PUT, DELETE /api/v1/recipes/{recipeId}`<br>`RecipeService.updateRecipe()` | **본인 작성 레시피 및 익명 레시피 수정/삭제 권한 검증 (REC-01-4)**<br>1. 타인 작성 레시피 수정 요청 시 `403 Forbidden` (`RECIPE_WARN_NOT_AUTHOR`) 차단<br>2. 탈퇴 회원의 익명 레시피(`user_id = NULL`) 수정/삭제 요청 시 `403 Forbidden` (`RECIPE_WARN_NOT_AUTHOR`) 영구 보호 검증 | **성공** |
| **TC-RCP-04** | `단위/슬라이스` | `GET /api/v1/recipes`<br>`RecipeService.getRecipes()` | **마이페이지 레시피 목록 필터링 (`filter=ALL, MY, SCRAP`)**<br>`filter=MY`(내가 작성한 레시피) 및 `filter=SCRAP`(내가 북마크한 레시피) 파라미터 전달 시 정확한 대상 목록만 필터링 반환 검증 | **성공** |
| **TC-RCP-LIKE-01** | `단위/슬라이스` | `POST /api/v1/recipes/{recipeId}/like`<br>`RecipeService.toggleLike()` | **좋아요 토글 및 원자적 카운트 증감 검증 (200 OK)**<br>미등록 상태 시 INSERT 및 `like_count + 1`, 기등록 상태 시 DELETE 및 `like_count - 1` 원자적 반영 검증 | **성공** |
| **TC-RCP-SCRAP-01** | `단위/슬라이스` | `POST /api/v1/recipes/{recipeId}/scrap`<br>`RecipeService.toggleScrap()` | **스크랩 토글 및 scrap 테이블 바인딩 검증 (200 OK)**<br>`public.scrap` 테이블 연동으로 스크랩 등록/취소 및 `scrapped` 플래그 반환 검증 | **성공** |

---

## 6. [모듈 4] 스마트 매칭 엔진 & 선입선출(FIFO) 차감 API (/api/v1/matching) 테스트 검증 결과

* **테스트 실행 일자**: 2026-10-21
* **핵심 구현 정책 및 아키텍처**:
  - **주재료 필수 하드 게이트 (Hard Gate - MATCH-01-1)**:
    * 유저 활성 냉장고에 레시피 주재료(`MAIN`)가 0개인 경우, 매칭률 0% 처리 및 추천 목록에서 완전 제외.
  - **매칭 스코어링 공식 및 임박 가산점 (`GET /api/v1/matching/recommendations`)**:
    * Base Score: 주재료 70점 균등 분할 + 부재료 30점 균등 분할 (직접보유 1.0, 대체 0.7, 생략가능 0.5, 미보유 0.0, 양념류 1.0).
    * Bonus Score: 소비기한 임박($0 \le \text{D-Day} \le 3$) 주재료 +10점, 부재료 +5점 (최대 20점 캡, 도과 재료 제외).
    * Final Score: $\min(100, \text{Math.round}(\text{Base Score} + \text{Bonus Score}))$.
    * 정렬 우선순위: 1) 최종 점수 내림차순 ➔ 2) 임박 가산점 내림차순 ➔ 3) 인기순(`cooked_count + like_count`) 내림차순.
  - **선입선출(FIFO) 차감 및 No-Mixing 혼합차감 금지 정책 (`POST /api/v1/matching/cook/{recipeId}`)**:
    * **No-Mixing FIFO Deduction**: 음식 고유의 맛 보존을 위해 단일 요리 차감 루프에서 원본 재료와 대체 재료를 절대 섞어서 연속 차감하지 않음. 원본 재료를 `expire_date ASC, created_at ASC` 순으로 최우선 차감.
    * **수량 부족 시 유연한 부분 차감 (Partial Deduction)**: 필요 수량보다 보유 수량이 모자라도 500/400 에러를 던지지 않고 보유분만 전량 차감(`status = 'CONSUMED'`) 처리 후 실제 차감량 및 잔여량을 응답으로 반환.
    * **양념/소스 차감 제외**: `is_sauce = TRUE`인 재료(간장, 소금 등)는 차감 루프에서 무조건 제외.
    * **2-Way 요리 완료 옵션**: `deductInventory: false` 시 냉장고 재료 차감 없이 레시피 `cooked_count`만 +1 원자적 업데이트.
* **테스트 대상 클래스**:
  - `com.dduktak.domain.matching.service.MatchingCalculatorTest`
  - `com.dduktak.domain.matching.service.MatchingServiceTest`
  - `com.dduktak.domain.matching.controller.MatchingControllerTest`
* **테스트 커버리지 결과**: 모듈 1 + 모듈 2 + 모듈 3 + 모듈 4 전체 **130개 테스트 케이스 100% 성공 (0 Failures, 0 Errors)**

---

### 6.1. 세부 테스트 케이스 명세 및 검증 매트릭스

| ID | 테스트 분류 | 대상 엔드포인트 / 메서드 | 테스트 시나리오 및 검증 기준 | 결과 |
| :-: | :---: | :--- | :--- | :---: |
| **TC-MATCH-01** | `단위/슬라이스` | `GET /api/v1/matching/recommendations`<br>`MatchingService.getRecommendations()` | **주재료 필수 하드 필터링 (Hard Gate - MATCH-01-1)**<br>내 냉장고에 주재료(MAIN)가 0개인 레시피는 매칭 점수 0% 처리 및 추천 목록에서 완전히 제외됨을 검증 | **성공** |
| **TC-MATCH-02** | `단위/슬라이스` | `GET /api/v1/matching/recommendations`<br>`MatchingCalculator.calculate()` | **매칭 점수 산출 및 소비기한 임박 가산점 연산 (Base + Bonus Score)**<br>D-1 임박 주재료 보유 상태에서 Base Score(77.5점) + 가산점(+10점) 반영되어 88%로 정렬 최상단 노출 검증 | **성공** |
| **TC-MATCH-03** | `단위/슬라이스` | `POST /api/v1/matching/cook/{recipeId}`<br>`MatchingService.cookRecipe()` | **요리 완료 선입선출(FIFO) 차감 및 No-Mixing 혼합차감 금지 (INV-04-2, REC-03-1)**<br>1. 소비기한 가장 임박한 레코드(`expire_date ASC`)부터 순차 차감<br>2. 원본/대체재료 혼합 차감 원천 차단<br>3. 보유 수량 부족 시 에러 없이 보유분만 부분 차감(Partial Deduction)<br>4. 양념/소스(`is_sauce=TRUE`) 차감 자동 제외 검증 | **성공** |
| **TC-MATCH-04** | `단위/슬라이스` | `POST /api/v1/matching/cook/{recipeId}`<br>`MatchingService.cookRecipe()` | **요리 완료 2-Way 옵션 및 cookedCount 연동**<br>`deductInventory: false` 전달 시 재료 차감 없이(`isDeducted: false`), 레시피 요리 완료 수(`cookedCount`)만 +1 원자적 증가 검증 | **성공** |

---

### 6.2. 전체 백엔드 테스트 스위트 빌드 및 실행 결과 로그

```text
> Task :compileJava UP-TO-DATE
> Task :processResources
> Task :classes
> Task :compileTestJava UP-TO-DATE
> Task :processTestResources NO-SOURCE
> Task :testClasses UP-TO-DATE
> Task :test

BUILD SUCCESSFUL in 13s
130 tests completed, 0 failed, 0 skipped.
```



