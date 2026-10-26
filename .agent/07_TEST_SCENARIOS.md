# 🧪 핵심 비즈니스 인수 및 E2E 통합 테스트 명세서 (07_TEST_SCENARIOS.md)

---

## 1. 개요 및 테스트 DoD (Definition of Done) 수칙

본 문서는 **'오늘의 뚝딱'** 프로젝트의 백엔드(Spring Boot 3.x + PostgreSQL)와 프론트엔드(React + TypeScript + Vite + Capacitor 하이브리드) 전체 6대 도메인 모듈 및 모바일 네이티브 연동에 대한 **실제 구현 코드 기준 최신 인수 테스트 및 E2E 통합 테스트 시나리오**를 정의합니다.

### 💡 3중 교차 검증 원칙 (Evidence Triad DoD)
모든 통합 테스트 및 주요 기능 인수는 다음 3가지 증적을 바탕으로 객관적으로 검증 완료(Done)를 판정합니다:
1. **Visual Evidence (시각적 증적)**: `browser_subagent`가 녹화한 무결점 E2E 인터랙션 비디오(WebP) 및 UI 마일스톤/에러 스크린샷
2. **Trace Evidence (트레이스 증적)**: API 응답 헤더의 **`X-Trace-Id`** 및 백엔드 AOP 로깅 콘솔(`[ReqID: xxxxxx]`) 매핑 기록 (호출 인자, 반환값, 실행시간 ms 증명)
3. **Data Integrity Evidence (데이터 무결성 증적)**: PostgreSQL 실제 데이터베이스 레코드 상태 스냅샷 (FIFO 소비 차감, 익명화 보존 등)

---

## 2. 도메인 모듈별 상세 인수 테스트 시나리오

### 2.1. [모듈 1] 회원 & 인증 도메인 (Auth Domain)

#### TC-AUTH-01: Supabase Auth 기반 회원가입/로그인 및 지연 프로필 세션 동기화 (Lazy Profile JIT Sync)
* **API 엔드포인트**: `POST /api/v1/auth/init`
* **사전 조건**: Supabase Auth에 신규 이메일 계정이 등록되었거나 최초 소셜/이메일 로그인이 완료된 상태 (Bearer JWT 토큰 확보).
* **수행 절차**:
  1. 클라이언트에서 Supabase Auth 세션 수립 후 백엔드 `POST /api/v1/auth/init` 호출.
  2. Spring Security `JwtAuthenticationFilter`를 통해 유효 토큰 파싱 및 `UserPrincipal` 생성.
* **검증 기준**:
  1. `user_profile` 테이블에 해당 `user_id` 레코드가 없을 경우, 메타데이터 닉네임(또는 "뚝딱이")과 4자리 무작위 `userTag`(예: `#1234`), 기본 프로필 이미지(`Default Profile.png`)가 자동 생성된다.
  2. 이미 프로필이 존재하는 기존 회원이 호출할 경우 중복 생성되지 않고 기존 프로필 정보가 반환된다 (`isNewUser` 플래그 정확성 확인).
  3. 응답 코드: `200 OK`, `ApiResponseDto<InitProfileResponseDto>`.

#### TC-AUTH-02: 프로필 정보 조회 및 수정
* **API 엔드포인트**: `GET /api/v1/auth/me`, `PATCH /api/v1/auth/me`
* **수행 절차**:
  1. 내 프로필 정보 조회 (`GET /me`).
  2. 닉네임("요리고수뚝딱이") 및 프로필 이미지 URL 수정 요청 (`PATCH /me`).
* **검증 기준**:
  1. 조회 시 본인의 이메일, 닉네임, userTag, 프로필 이미지 URL, 방해금지 시간 설정이 반환된다.
  2. 수정 시 입력된 닉네임과 이미지가 `user_profile`에 반영되며 `UpdateProfileResponseDto`로 즉시 반환된다.
  3. 비어있는 닉네임 등 Bean Validation 위반 시 `AUTH_FIELD_INVALID_NICKNAME` (400 Bad Request) 예외 발생.

#### TC-AUTH-03: 야간 방해금지 시간 설정 (Quiet Time)
* **API 엔드포인트**: `PATCH /api/v1/auth/me/quiet-time`
* **수행 절차**: 시작 시간(`quietStartHour: 22`), 종료 시간(`quietEndHour: 8`) 전달.
* **검증 기준**:
  1. 0~23 범위를 벗어난 시간 입력 시 Validation 에러 발생.
  2. 정상 시간 설정 시 `user_profile` 테이블에 저장되고, 알림 발송 스케줄러에서 해당 시간대 푸시 발송이 차단된다.

#### TC-AUTH-04: 회원 탈퇴 시 개인 데이터 영구 파기 및 레시피 익명화 보존 (USER-02)
* **API 엔드포인트**: `DELETE /api/v1/auth/withdraw`
* **수행 절차**: 레시피를 1건 이상 등록하고 냉장고 재료를 보유한 회원이 탈퇴 요청.
* **검증 기준**:
  1. 유저의 개인정보(`user_profile`), 냉장고 재료(`user_ingredient`), 알림 내역(`notification`)은 완전 삭제(Hard Delete)된다.
  2. 해당 회원이 등록했던 레시피(`recipe`)는 삭제되지 않으며, `author_id`가 `NULL`로 안전하게 업데이트되어 커뮤니티 공용 레시피로 영구 보존된다.
  3. 탈퇴 사유(`WithdrawRequestDto.reason`)는 통계 분석을 위해 익명 탈퇴 로그 테이블에 별도 적재된다.

#### TC-AUTH-05: 중복 이메일 회원가입 차단 및 비밀번호 찾기(재설정 메일 발송)
* **API / Auth 기능**: Supabase Auth Signup & Password Reset
* **수행 절차**:
  1. 이미 가입된 이메일(`ym970825@naver.com`)로 신규 회원가입 폼 제출.
  2. 로그인 화면에서 [비밀번호 찾기] ➔ 해당 이메일로 비밀번호 재설정 링크 요청.
* **검증 기준**:
  1. 중복 이메일 가입 시 400 Bad Request 또는 "이미 존재하는 계정입니다" 에러가 노출되어 가입이 차단된다.
  2. 비밀번호 재설정 메일 발송 요청 시 200 OK와 함께 재설정 안내 메일이 정상 발송된다.

#### TC-AUTH-06: 마이페이지 계정 보안 관리 (비밀번호 변경 및 이메일 변경 신청)
* **API 엔드포인트**: Supabase Auth Update User & 백엔드 `PATCH /api/v1/auth/me`
* **수행 절차**:
  1. 마이페이지 ➔ [비밀번호 변경] ➔ 신규 비밀번호(`NewPassword123!`) 입력 및 변경.
  2. 마이페이지 ➔ [이메일 변경] ➔ 신규 이메일(`sg970825@gmail.com`) 입력 및 인증 요청.
* **검증 기준**:
  1. 비밀번호 변경 후 로그아웃 시 기존 비밀번호로 로그인이 차단되고 신규 비밀번호로만 로그인이 성공한다.
  2. 이메일 변경 요청 시 인증 안내 메일이 발송되며, 유저 인증 완료 시 프로필 및 DB에 신규 이메일이 반영된다.

---

### 2.2. [모듈 2] 내 재료 관리소 (Inventory Domain)

#### TC-INV-01: 표준 마스터 식재료 조회 및 자동완성 검색
* **API 엔드포인트**: `GET /api/v1/inventory/master-ingredients?query={query}&categoryId={categoryId}`
* **수행 절차**:
  1. 검색어 "계란" 입력 시 마스터 식재료 조회.
  2. 카테고리 필터(예: 축산물) 적용 조회.
* **검증 기준**:
  1. 74종 마스터 테이블(`ingredient_master`)에서 유사 검색된 식재료 목록과 카테고리, 표준 보관방법, 권장 소비기한 일수가 반환된다.

#### TC-INV-02: 식재료 수동 직접 등록 및 독립 레코드(Independent Record) 원칙 (INV-01-2)
* **API 엔드포인트**: `POST /api/v1/inventory`
* **수행 절차**:
  1. 마스터 재료 "계란"(소비기한: 오늘+3일, 메모: "마트 10구") 1회 등록.
  2. 동일한 "계란"(소비기한: 오늘+10일, 메모: "유정란 선물") 1회 추가 등록.
* **검증 기준**:
  1. 기존 레코드의 수량이 합산(UPDATE)되지 않고, `user_ingredient` 테이블에 각각 독립된 PK로 2건이 신규 INSERT된다.
  2. 응답 코드: `201 Created`, 생성된 `ingredientId` 반환.

#### TC-INV-03: 2-Tier Accordion 그룹화, SQL D-Day 연산 및 만료 영역 분리 (INV-02-1, INV-02-4)
* **API 엔드포인트**: `GET /api/v1/inventory`
* **수행 절차**: 다양한 소비기한(D-1, D-3, D+5 만료)을 가진 식재료들을 보유한 상태에서 냉장고 목록 조회.
* **검증 기준**:
  1. 동일한 마스터 식재료들은 프론트엔드 2-Tier Accordion 대표 카드로 그룹화된다.
  2. 대표 카드의 D-Day 배지는 그룹 내 가장 소비기한이 임박한 재료의 D-Day를 기준으로 표기된다.
  3. `dDay`는 서버 메모리 계산이 아닌 PostgreSQL SQL 쿼리(`expire_date - CURRENT_DATE`)로 실시간 산출된다.
  4. 소비기한이 지난 재료(`expire_date < CURRENT_DATE`)도 DB `status = 'ACTIVE'`를 유지하되, 백엔드 쿼리에서 만료 영역으로 동적 분류되어 UI 하단 '소비기한 만료' 섹션으로 격리된다.

#### TC-INV-04: 식재료 수정, 소프트 삭제 및 소유권 방어
* **API 엔드포인트**: `PUT /api/v1/inventory/{id}`, `DELETE /api/v1/inventory/{id}`
* **수행 절차**:
  1. 본인 소유의 식재료 수량/보관방법/소비기한 수정 및 삭제 요청.
  2. 타인 소유의 `ingredientId`로 수정/삭제 조작 시도.
* **검증 기준**:
  1. 본인 재료는 정상 수정되며, 삭제 시 DB에서 `status = 'DELETED'`로 소프트 삭제된다.
  2. 타인 식재료 접근 시 `SecurityUtil.getCurrentUserId()` 검증에 의해 `INV_WARN_NOT_FOUND` (404 Not Found)가 발생하며 변경이 원천 차단된다.

#### TC-INV-05: 식재료 수동 소비 처리 및 잔여 수량 방어 (INV-04-1)
* **API 엔드포인트**: `PATCH /api/v1/inventory/{id}/consume`
* **수행 절차**: 수량 5개 보유 중인 식재료에 대해 3개 소비 요청 ➔ 이어서 2개 추가 소비 요청 ➔ 보유 수량 초과(10개) 소비 시도.
* **검증 기준**:
  1. 3개 소비 시 잔여 수량 2개로 차감되고 `status = 'ACTIVE'` 유지.
  2. 잔여 2개 추가 소비 시 잔여 수량 0개 도달과 동시에 `status = 'CONSUMED'`로 자동 상태 전이.
  3. `Math.max(0, quantity - consumeQuantity)` 방어 로직에 의해 음수 수량 발생이 원천 방지된다.

#### TC-INV-06: 바코드 조회 및 영수증 OCR 외부 연동 예외 방어 (INV-01-3)
* **API 엔드포인트**: `GET /api/v1/inventory/barcode/{barcodeNo}`, `POST /api/v1/inventory/scan-ocr`
* **수행 절차**:
  1. 미등록 바코드 번호("8800000000000") 조회.
  2. 글씨가 판독 불가능하거나 훼손된 영수증 이미지 OCR 업로드.
* **검증 기준**:
  1. 미등록 바코드 조회 시 500 에러 없이 `404 Not Found` (`code: "INV_WARN_BARCODE_NOT_FOUND"`) 표준 에러 반환.
  2. 영수증 OCR 실패 시 500 에러를 방지하고 `200 OK` 및 빈 배열 `data: []`를 반환하여 클라이언트 충돌을 방지한다.

---

### 2.3. [모듈 3] 뚝딱 레시피 커뮤니티 (Recipe Domain)

#### TC-RCP-01: 레시피 신규 등록 (표준 식재료 바인딩 & Step 구성)
* **API 엔드포인트**: `POST /api/v1/recipes`
* **수행 절차**: 레시피 기본 정보(제목, 설명, 조리시간, 난이도, 썸네일) + 재료 목록(주재료 MAIN, 부재료 SUB, 양념 SAUCE) + 조리 단계(Step 순서, 내용, 이미지) 전달.
* **검증 기준**:
  1. 단일 트랜잭션 내에서 `recipe`, `recipe_ingredient`, `recipe_step` 테이블에 원자적으로 INSERT된다.
  2. 응답 코드: `201 Created`, 생성된 `recipeId` 반환.

#### TC-RCP-02: 레시피 상세 조회 및 사용자 인터랙션 플래그 (`isLiked`, `isScrapped`)
* **API 엔드포인트**: `GET /api/v1/recipes/{recipeId}`
* **수행 절차**: 레시피 상세 페이지 진입.
* **검증 기준**:
  1. 조회수(`view_count`)가 1 증가한다.
  2. 로그인한 유저가 해당 레시피에 좋아요/스크랩을 누른 상태인지 여부(`isLiked`, `isScrapped` 불리언 값)가 함께 반환되어 UI 버튼 활성화 상태를 제어한다.
  3. 작성자가 탈퇴하여 `author_id IS NULL`인 경우 작성자명이 "(알 수 없음)" 또는 익명으로 안전하게 표시된다.

#### TC-RCP-03: 본인 작성 레시피 수정/삭제 권한 검증 (REC-01-4)
* **API 엔드포인트**: `PUT /api/v1/recipes/{recipeId}`, `DELETE /api/v1/recipes/{recipeId}`
* **수행 절차**:
  1. 본인이 작성한 레시피의 내용 수정 및 삭제.
  2. 타인이 작성한 레시피 또는 익명화된 레시피에 대해 수정/삭제 시도.
* **검증 기준**:
  1. 본인 레시피는 정상 수정 및 삭제 처리된다.
  2. 타인 또는 익명 레시피 접근 시 `RCP_WARN_NOT_AUTHOR` (403 Forbidden) 예외가 발생하며 요청이 거부된다.

#### TC-RCP-04: 레시피 목록 필터링 및 좋아요/스크랩 토글
* **API 엔드포인트**: `GET /api/v1/recipes?filter={ALL|MY|SCRAP}`, `POST /{id}/like`, `POST /{id}/scrap`
* **수행 절차**:
  1. 좋아요/스크랩 토글 실행.
  2. `filter=MY`(내가 쓴 레시피) 및 `filter=SCRAP`(내가 북마크한 레시피) 필터 조회.
* **검증 기준**:
  1. 좋아요 토글 시 `recipe_like` 레코드가 INSERT/DELETE되며 `like_count`가 실시간 동기화된다.
  2. `filter=MY` 조회 시 로그인 유저의 작성 레시피만, `filter=SCRAP` 조회 시 북마크한 레시피만 정확히 필터링되어 반환된다.

---

### 2.4. [모듈 4] 스마트 매칭 엔진 (Smart Matching Domain)

#### TC-MATCH-01: 주재료 필수 하드 게이트 필터링 (Hard Gate - MATCH-01-1)
* **API 엔드포인트**: `GET /api/v1/matching/recommendations`
* **수행 절차**: 내 냉장고에 해당 레시피의 주재료(MAIN)가 단 1개도 없는 상태에서 추천 목록 요청.
* **검증 기준**:
  1. 주재료가 0개 매칭된 레시피는 매칭 점수 0% 처리되며, 뚝딱 추천 레시피 목록에서 완전히 제외(Drop)된다.

#### TC-MATCH-02: 매칭 점수 산출 및 소비기한 임박 가산점 연산 (Base + Bonus)
* **API 엔드포인트**: `GET /api/v1/matching/recommendations`
* **수행 절차**: 내 냉장고에 [돼지고기 김치찌개]의 주재료인 "돼지고기(D-1 임박)"와 "김치(D-10 여유)"를 보유한 상태에서 추천 목록 요청.
* **검증 기준**:
  1. 기본 매칭률(보유 주재료/부재료 비율)에 소비기한 임박(D-1~D-2) 주재료 가산점이 합산되어 최종 매칭 점수가 산출된다.
  2. 가산점이 반영된 고득점 레시피가 추천 목록 최상단(정렬 1위)에 노출된다.

#### TC-MATCH-03: 뚝딱 요리 완료 - 선입선출(FIFO) 차감 및 차감 예외 규칙 (INV-04-2, REC-03-1)
* **API 엔드포인트**: `POST /api/v1/matching/cook/{recipeId}`
* **사전 조건**: 동일한 "돼지고기" 2건 보유 (레코드 A: D-1 임박 수량 200g, 레코드 B: D-10 여유 수량 300g). 레시피 필요 수량 300g.
* **수행 절차**: `deductInventory: true` 설정으로 요리 완료 호출.
* **검증 기준**:
  1. **선입선출(FIFO)**: 소비기한이 가장 임박한 레코드 A(200g)가 전량 차감되어 `status = 'CONSUMED'`가 되고, 부족분 100g은 레코드 B에서 차감되어 200g이 남는다.
  2. **양념/소스 제외**: 양념 카테고리(`is_sauce = TRUE`, 소금/간장/참기름 등) 재료는 냉장고 차감 연산 대상에서 자동 제외된다.
  3. **부분 차감(Partial Deduction)**: 냉장고 보유량이 레시피 필요량보다 모자라도 에러를 내지 않고 보유분만 전량 차감 후 정상 응답한다.
  4. **요리 카운트**: 해당 레시피의 `cookedCount`가 +1 증가한다.

#### TC-MATCH-04: 요리 완료 2-Way 옵션 (`deductInventory: false`)
* **API 엔드포인트**: `POST /api/v1/matching/cook/{recipeId}`
* **수행 절차**: Request Body에 `deductInventory: false` 전달하여 요리 완료 실행.
* **검증 기준**:
  1. 냉장고 식재료 수량은 전혀 차감되지 않는다 (`isDeducted: false`).
  2. 레시피의 요리 완료 횟수(`cookedCount`)만 +1 정상 증가한다.

---

### 2.5. [모듈 5] 알림 센터 (Notification Domain)

#### TC-NOTI-01: 알림 목록 조회, 미읽음 뱃지 및 일괄 읽음 처리
* **API 엔드포인트**: `GET /api/v1/notifications`, `PATCH /api/v1/notifications/read-all`
* **수행 절차**:
  1. 알림 센터 진입 및 목록 조회.
  2. [모두 읽음] 버튼 클릭.
* **검증 기준**:
  1. 알림 타입(`EXPIRE_WARN`, `EXPIRE_D_DAY`, `LIKE_NOTICE`, `COOKED_NOTICE`, `SYSTEM`)별 내용이 반환된다.
  2. 전체 읽음 처리 시 미읽음 알림들의 `is_read`가 TRUE로 변경되며 상단 헤더 Red Dot 뱃지가 즉시 사라진다.

#### TC-NOTI-02: 알림 딥링크 및 삭제된 콘텐츠 404 Fallback 방어
* **API 엔드포인트**: `GET /api/v1/recipes/{targetId}` 연계
* **수행 절차**: 이미 삭제된 레시피에 대한 좋아요/요리완료 알림 카드를 클릭.
* **검증 기준**:
  1. 백엔드에서 `RECIPE_WARN_NOT_FOUND` (404) 발생 시 화면이 깨지거나 빈 페이지로 이동하지 않는다.
  2. Sonner Toast로 *"삭제되었거나 더 이상 존재하지 않는 콘텐츠입니다"* 경고를 노출하고 알림 센터 목록 화면을 안전하게 유지한다.

---

### 2.6. [모듈 6] 홈 종합 브리핑 (Home Domain)

#### TC-HOME-01: 홈 종합 브리핑 위젯 및 1위 추천 레시피 딥링크
* **API 엔드포인트**: `GET /api/v1/home/briefing`
* **수행 절차**:
  1. 홈 탭 진입 시 브리핑 데이터 조회.
  2. 1위 추천 레시피(`topRecipe`) 카드 클릭.
* **검증 기준**:
  1. 보유 중인 D-3 이내 임박 식재료 총 개수와 상위 3개 재료 목록이 반환된다.
  2. 최고 매칭률을 기록한 1위 추천 레시피 카드 클릭 시 해당 레시피 상세 페이지(`/recipes/{id}`)로 매끄럽게 라우팅된다.

---

### 2.7. [모바일 네이티브] 하이브리드 앱 전용 인수 테스트 (Hybrid Mobile Native)

#### TC-NAT-01: 인트로 스플래시 애니메이션 & 3단계 사용자 가이드 온보딩
* **수행 절차**: 앱 최초 실행 (또는 로컬 스토리지 초기화 후 진입).
* **검증 기준**:
  1. 공식 심볼 로고(`logo-icon.png`)와 브랜드 코랄/민트 팔레트의 스플래시 오프닝 모션이 부드럽게 렌더링된 후 온보딩 화면으로 진입한다.
  2. 3단계 감성 일러스트 비주얼 슬라이드가 스와이프/다음 버튼으로 원활히 넘어가며, [시작하기] 클릭 시 메인/로그인 화면으로 이동하고 완료 플래그(`hasSeenOnboarding`)가 로컬에 저장된다.

#### TC-NAT-02: 안드로이드 하드웨어 뒤로가기 버튼 제어 (Hardware Back Button)
* **수행 절차**: 모달 팝업 열림 상태, 하위 페이지(레시피 상세 등), 그리고 홈 화면에서 각각 안드로이드 물리 뒤로가기 키 실행.
* **검증 기준**:
  1. 모달/바텀시트가 열려 있을 때는 모달만 닫힌다.
  2. 하위 상세 페이지에서는 이전 화면으로 안전하게 복귀한다.
  3. 홈 화면에서는 앱이 불시에 꺼지지 않고 종료 안내 확인 토스트/다이얼로그가 동작한다.

#### TC-NAT-03: FCM 푸시 알림 수신 및 딥링크 라우팅
* **수행 절차**: 백엔드에서 소비기한 알림 발송 시 백그라운드 앱에서 시스템 푸시 알림 클릭.
* **검증 기준**:
  1. 알림 탭 시 앱이 포그라운드로 올라오며 페이로드의 대상 화면(`route: /notifications` 또는 `/recipes/{id}`)으로 자동 딥링크 이동한다.

---

## 3. E2E 풀 유저 저니(Full User Journey) 통합 테스트 7단계

실제 E2E 통합 테스트(Cycle-01) 실행 시 위 개별 테스트 케이스들을 아래 단일 사용자 생애주기 흐름으로 연결하여 전방위 검증합니다:

```text
[Step 1] 신규 회원가입, 메일 인증, 계정 보안 & 세션 동기화 (TC-AUTH-01, TC-AUTH-05)
   │  - 실제 이메일 가입 ➔ 유저 수동 인증 완료 알림 후 로그인
   │  - 중복 가입 차단 예외 & 비밀번호 찾기 메일 발송 확인
   ⬇
[Step 2] 냉장고 식재료 전체 CRUD & 영수증 OCR 일괄 등록 (TC-INV-02, TC-INV-03, TC-INV-04, TC-INV-06)
   │  - 영수증 OCR 스캔 식재료 일괄 등록 (`receipt.jpg`)
   │  - 다회차 요리 대비 넉넉한 수량 수동 등록(돼지고기 600g D-1, 800g D-15, 김치 1kg D-7)
   │  - 수량/소비기한 수정(U), 삭제용 재료 1건 삭제(D) 및 2-Tier 아코디언 검증
   ⬇
[Step 3] 레시피 폼 무결성 검증, 이미지 첨부 & CRUD (TC-RCP-01, TC-RCP-02, TC-RCP-03, TC-RCP-04)
   │  - 폼 유효성 검사(Validation) 빈 값 제출 차단 확인
   │  - 대표 썸네일(`recipe_thumb.jpg`) & Step 1/2 조리 사진 업로드 (Storage 직접 업로드)
   │  - 신규 레시피 등록, 내용 수정(U) 및 임시 레시피 1건 작성 후 삭제(D)
   ⬇
[Step 4] 홈 브리핑 확인 & 스마트 매칭 추천 1위 레시피 진입 (TC-HOME-01, TC-MATCH-02)
   │  - 홈 브리핑 D-1 임박 재료 배너 노출 확인
   │  - 스마트 매칭 1위 추천 레시피 상세 화면으로 딥링크 이동
   ⬇
[Step 5] 3-Way 요리 완료 실행 ➔ 냉장고 FIFO 차감 정밀 검증 (TC-MATCH-03)
   │  - 1차: 차감 없이 요리 완료 ➔ 재료 수량 불변, `cooked_count` +1
   │  - 2차: 2인분/모달 수량 수동 조절 차감 ➔ 지정 수량(300g) 정확 차감
   │  - 3차: 기본 정량 차감 요리 완료 ➔ D-1 임박분 잔여 100g 유지 및 다중 레코드 관통 FIFO 검증
   ⬇
[Step 6] 알림 센터, 자추 방지 필터링 & 다중 계정 상호작용 (TC-NOTI-01, TC-NOTI-02)
   │  - 자추(본인 레시피 좋아요) 시 알림 미발송(필터링) 확인
   │  - 서브 계정(유저 B: test_helper) 좋아요 클릭 ➔ 유저 A Red Dot 점등 및 알림 수신
   │  - 특정 알림 1건 개별 삭제 및 모두 읽음 처리
   ⬇
[Step 7] 마이페이지 계정/보안 관리 ➔ 최종 회원 탈퇴 & 데이터 익명화 보존 (TC-AUTH-02, TC-AUTH-03, TC-AUTH-04, TC-AUTH-06)
      - 프로필 수정(닉네임, 프로필 사진 `profile_avatar.jpg` 업로드)
      - 푸시 알림 설정 토글 변경 확인
      - 비밀번호 변경(`NewPassword123!`) 및 이메일 변경(`sg970825@gmail.com`) 확인
      - 최종 회원 탈퇴(DELETE) ➔ 개인정보 파기 및 레시피 `author_id IS NULL` 익명화 보존 최종 DB 검증
```

