# 📊 [Cycle 1] E2E 통합 테스트 결과 보고서 (REPORT.md)

---

## 1. 테스트 실행 메타데이터

- **실행 회차**: Cycle 1 (최초 종합 전방위 검증 — 웹 E2E + 모바일 네이티브 실기기 완료)
- **테스트 일자**: 2026-10-29 (KST)
- **테스터**: AI Pair Programming Agent & User (Android 실기기 네이티브 검증)
- **대상 브랜치**: `test/integration-test-setup`
- **테스트 계정 정보**:
  - **메인 테스트 계정 (유저 A)**: `ym970825@naver.com` (`UUID: 93bba128-7a12-4ec0-bd46-eb7388a9fff1`, `뚝딱테스터#1132`)
    - 최초 비밀번호 `Password123!` ➔ Step 1-6 OTP 재설정 `Password1234!` ➔ Step 7-3 마이페이지 변경 `NewPassword123!`
  - **이메일 변경 대상 계정**: `sg970825@gmail.com` (Step 7-5 실제 승인 메일 클릭 후 변경 반영 및 재로그인 검증 완료)
  - **상호작용용 서브 계정 (유저 B)**: `test_helper@dduktak.com` / `Password123!` (`UUID: 22222222-2222-2222-2222-222222222222`, `뚝딱도우미#7777`)
  - **소셜 로그인 및 네이티브 검증**: 구글 OAuth 단독 지원, FCM 네이티브 푸시 및 야간 방해금지, 하드웨어 뒤로가기 (Android 실기기 직접 수행 완료)
- **테스트 결과 요약**:
  - 총 세부 검증 항목: **24개 항목** (웹 E2E 21개 + 네이티브 하이브리드 앱 3개 전수 수행 완료)
  - 통과 (PASS): **21건** (웹 E2E 20건 + 네이티브 1건 완벽 통과)
  - 부분 결함 / 수정 필요 (PARTIAL / DEFECT): **3건**
    - `Step 5-2` (`DEF-01`): 요리완료 모달에서 수동 조절한 개별 재료 차감 수량이 백엔드 API 요청 payload에 포함되지 않고 기본 1인분 정량으로 차감됨
    - `Step 8-2` (`DEF-02`): FCM 네이티브 푸시 수신 및 야간 방해금지 차단은 정상이나, 푸시 알림 탭 시 레시피 상세(`/recipes/{id}`)가 아닌 항상 알림함(`/notifications`)으로만 이동함
    - `Step 8-3` (`DEF-03`): 홈 화면 더블백 종료 및 폼 화면 뒤로가기는 정상이나, 일반 모달(`ManualAddModal`, `CookConfirmationModal` 등) 오픈 상태에서 안드로이드 물리 뒤로가기 버튼 입력 시 모달이 닫히지 않고 유지됨
  - 블로커 결함 (Blocker): **0건**
  - 최종 판정: **Cycle 1 전 과정 완주 (조건부 통과 — Cycle 2 패치 대상 결함 3건 도출)**

---

## 2. 8단계 유저 저니별 세부 실행 결과표 (실전 엣지케이스 & 네이티브 앱)

| Step | 검증 도메인 | 세부 검증 내용 | 상태 | X-Trace-Id | 비고 |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **Step 1-1** | Splash & Warmup | 100% 불투명 스플래시, 백엔드 무음 핑(Silent Ping) 웜업 및 스켈레톤 노출 차단 | ✅ PASS | - | 100% 불투명 렌더링 확인 |
| **Step 1-2** | Onboarding | 최초 접속 유저 `/onboarding` 3단계 슬라이드 ➔ 시작하기 클릭 시 `/login` 안전 이동 | ✅ PASS | - | 슬라이드 1~3 및 권한 모달 확인 |
| **Step 1-3** | Auth / Validation | 폼 모드 전환 초기화, 비밀번호 복잡도 친절한 한글 에러 및 이메일 중복 가입 방어 | ✅ PASS | - | `identities: []` 중복 가입 방어 토스트 확인 |
| **Step 1-4** | Auth / Bridge | 실제 이메일 가입(`ym970825@naver.com`) ➔ 메일 수신 ➔ 인증 및 `POST /api/v1/auth/init` 프로필 생성 | ✅ PASS | `INIT_OK` | `뚝딱테스터#1132` DB 생성 확인 |
| **Step 1-5** | Auth / OTP | 비밀번호 찾기 ➔ 화면 이탈 없는 OTP(`11445304`) 검증 ➔ `/reset-password` 진입 및 변경(`Password1234!`) | ✅ PASS | - | 기존 비번 동일 입력 방어 확인 |
| **Step 2-1** | Inventory / OCR | 영수증 이미지(`receipt.jpg`) 첨부 ➔ 단계별 캡션(25%/70%/88%) ➔ 검수 모달 전이 & 4종 일괄 등록 | ✅ PASS | `OCR_200` | 비식품 제외 4종 추출 및 일괄 등록 |
| **Step 2-2** | Inventory / UX | 마스터 74종 실제 DB ID 매핑, 수량 백스페이스 빈값 타이핑, 1000g 오버플로우 방어 등록 | ✅ PASS | `INV_201` | 돼지고기 2건(D-1, D-15), 김치(1000g), 양파 등록 |
| **Step 2-3** | Inventory / CRUD | F5 새로고침 캐시 보존, 2-Tier 아코디언 D-Day(`D-1`), 수정(`188`)/소비 모달 오픈 및 삭제(`191`) | ✅ PASS | `INV_200` | 총 1400g 아코디언 그룹핑 확인 |
| **Step 3-1** | Recipe / UX | 조리시간 15분/수량 200g `step="any"` 방어, 타이핑 포커스 유지, 엔터 새로고침 방어, 3중 에러 피드백 | ✅ PASS | - | 토스트+포커스+인라인 에러 확인 |
| **Step 3-2** | Recipe / Lazy Upload | [방안 3] 썸네일/순서 사진 지연 업로드(`blob:` 미리보기) ➔ 제출 시 일괄 WebP 압축 업로드 & 등록(`recipeId: 38`) | ✅ PASS | `REC_201` | 뒤로가기 시 `/recipes` 복귀(`replace: true`) 확인 |
| **Step 3-3** | Recipe / Cleanup | [방안 3] 레시피 수정 시 이전 이미지 정리 & 자체 삭제 모달(`RecipeDeleteModal`), 404 재조회 방어 및 버킷 삭제 | ✅ PASS | `REC_200` | 임시 레시피(`39`) 삭제 시 404 토스트 미발생 |
| **Step 4-1** | Home / Briefing | 홈 형태유지 스켈레톤, 실제 작성자(`뚝딱테스터#1132`)/관리자 바인딩 및 매칭 배지(`100% 뚝딱 매칭`) 가드 | ✅ PASS | `7E2AF2` | 임박 브리핑(`돼지고기 D-1`) 정상 노출 |
| **Step 4-2** | Recipe / Feed | 목록 내 좋아요(`isLiked`) 식별, 검색어(`?q=%EA%B9%80%EC%B9%98`) URL 동기화 및 필터링 | ✅ PASS | `55418D` | 검색 결과 2건 정확 필터링 |
| **Step 5-1** | Cook / No-Deduct | [1차] 차감 없이 요리 완료(`deductInventory: false`) ➔ 재료 수량 불변, `cooked_count = 1` | ✅ PASS | `COOK_1` | 식재료 수량 불변 확인 |
| **Step 5-2** | Cook / Portion | [2차] 수량 수동 조절 차감 모달 UI(`-300g`, `-0g`) 동작 확인 ➔ API 요청 시 기본 정량(`-200g`, `-150g`) 차감됨 | ⚠️ PARTIAL | `COOK_2` | **결함 `DEF-01` 발견** (커스텀 수량 payload 미전달) |
| **Step 5-3** | Cook / FIFO | [3차] 기본 정량 차감 완료 ➔ D-1 임박분(`188`) 우선 소진(`600g ➔ 200g`) 및 D-15(`189`, `800g`) 보존 확인 | ✅ PASS | `COOK_3` | PostgreSQL DB FIFO 정합성 100% 일치 |
| **Step 6-1** | Notification / Self | 본인 좋아요/요리완료 시 백엔드 자추 필터링(`0건`) 및 서브 계정(유저 B) 상호작용 시 헤더 Red Dot 점등(`2건`) | ✅ PASS | `18BDF1` | `뚝딱도우미` 좋아요·요리완료 알림 수신 |
| **Step 6-2** | Notification / Split | 푸시 OFF 시에도 인앱 알림 정상 적재(분리 정합성), 삭제된 레시피(`9999`) 클릭 시 404 토스트 방어 및 전체 삭제 모달 | ✅ PASS | `A301B9` | `"삭제되었거나 더 이상 존재하지 않는 콘텐츠입니다"` 확인 |
| **Step 7-1** | MyPage / Profile | 프로필 수정 미리보기 유지, 커스텀 이미지 업로드 및 `[사진 삭제 (기본 이미지로)]` 리셋/버킷 정리 | ✅ PASS | - | `Default Profile.png` 즉시 복원 확인 |
| **Step 7-2** | MyPage / Security | 비밀번호 변경(`NewPassword123!`), 이메일 변경 중복 방어 및 실제 변경(`sg970825@gmail.com`), 로그아웃 뒤로가기 방어 | ✅ PASS | `3766A1` | 유저 메일 승인 완료 및 401 토스트 억제 확인 |
| **Step 7-3** | MyPage / Withdraw | 최종 회원 탈퇴 (`USER-02`) ➔ 개인정보 전량 삭제(`0건`) 및 작성 레시피(`38`) 익명화(`user_id IS NULL`, `'관리자'`) 보존 | ✅ PASS | `34E430` | DB 하드 딜리트 및 레시피 익명 보존(`388FA5`) 확인 |
| **Step 8-1** | Native / OAuth | 구글 소셜 로그인 ➔ 시스템 브라우저 인증 ➔ 앱 딥링크 복귀 ➔ 메인 홈 진입 & 마이페이지 소셜 유저 분기(비번/이메일 변경 은폐) | ✅ PASS | - | **유저 실기기 수행 완료** (`step8/` 증적 4장) |
| **Step 8-2** | Native / FCM Push | 백그라운드 FCM 네이티브 푸시 수신 및 야간 방해금지 정상 ➔ 단, 푸시 탭 시 항상 알림함(`/notifications`)으로만 이동 | ⚠️ PARTIAL | - | **결함 `DEF-02` 발견** (`step8/` 증적 5장) |
| **Step 8-3** | Native / Hardware Back | 홈 더블백 종료 및 폼 뒤로가기는 정상 ➔ 단, 모달(`재료 직접 넣기` 등) 오픈 시 물리 뒤로가기 버튼으로 모달이 안 닫힘 | ❌ FAIL | - | **결함 `DEF-03` 발견** (`step8/` 증적 4장) |

---

## 3. 테스트 준비 에셋 목록 (`assets/`)

| 에셋 파일명 | 파일 크기 | 용도 | 상태 |
| :--- | :---: | :--- | :---: |
| `profile_avatar.jpg` | 507 KB | Step 7 마이페이지 신규 프로필 사진 업로드 | ✅ 검증 완료 |
| `recipe_thumb.jpg` | 822 KB | Step 3 김치찌개 완성 레시피 대표 썸네일 업로드 | ✅ 검증 완료 |
| `recipe_step1.jpg` | 933 KB | Step 3 레시피 Step 1 조리 사진 (고기 볶기) | ✅ 검증 완료 |
| `recipe_step2.jpg` | 889 KB | Step 3 레시피 Step 2 조리 사진 (김치 넣고 끓이기) | ✅ 검증 완료 |
| `receipt.jpg` | 940 KB | Step 2 영수증 OCR 스캔 식재료 일괄 등록 | ✅ 검증 완료 |

---

## 4. 3중 증적 목록 (Evidence Reference)

1. **시각적 증적 (Visual Evidence)**:
   - **웹 E2E 단계별 캡처 이미지 (36장)**: [`evidence/screenshots/`](file:///c:/Dev/오늘의%20뚝딱/dduktak/integration-tests/cycle-01/evidence/screenshots/) (`step1_1_splash.png` ~ `step7_8_withdraw_modal.png` 복사 완료)
   - **네이티브 실기기 캡처 이미지 (13장)**: [`evidence/screenshots/step8/`](file:///c:/Dev/오늘의%20뚝딱/dduktak/integration-tests/cycle-01/evidence/screenshots/step8/)
     - `Step 8_1_앱 기동.jpg`, `Step 8_1_구글 로그인 성공.jpg`, `Step 8_1_구글계정 마이페이지1.jpg`, `Step 8_1_구글계정 마이페이지2.jpg`
     - `Step 8_2_푸시알림1.jpg`, `Step 8_2_푸시알림2.jpg`, `Step 8_2_푸시 딥링크.jpg`, `Step 8_2_야간방해금지1.jpg`, `Step 8_2_야간방해금지2.jpg`
     - `Step 8_3_모달 백버튼 테스트1_실패.jpg`, `Step 8_3_폼 백버튼 테스트1.jpg`, `Step 8_3_폼 백버튼 테스트2.jpg`, `Step 8_3_홈 백버튼 테스트.jpg`
2. **트레이스 로그 (Trace Evidence)**:
   - [api_traces_cycle_01.md](file:///c:/Dev/오늘의%20뚝딱/dduktak/integration-tests/cycle-01/traces/api_traces_cycle_01.md)
3. **데이터베이스 무결성 (DB Snapshot)**:
   - [data_integrity_verification.md](file:///c:/Dev/오늘의%20뚝딱/dduktak/integration-tests/cycle-01/db-snapshots/data_integrity_verification.md)

---

## 5. 발견된 결함 목록 (Defect Tickets — Cycle 2 패치 대상)

### 🐛 [DEF-01] 요리 완료 2단계 검수 모달(`CookConfirmationModal`)에서 수동 조절한 개별 식재료 차감량이 백엔드 API 요청에 반영되지 않는 현상
- **발견 단계**: Step 5-2 (`Cook / Portion` — 수량 수동 조절 차감)
- **심각도**: **Medium (기능 불일치)**
- **증상**:
  - 사용자가 `[이 레시피로 요리하기]` ➔ 2단계 `냉장고 재료 차감 검수` 모달에서 연필 아이콘(✏️)을 눌러 `돼지고기 (삼겹살/목살)` 차감 수량을 `-300g`으로, `배추김치` 차감 수량을 `-0g`으로 직접 조절하면 모달 UI 상의 잔여량 프리뷰(`1100g`, `1000g`)는 즉시 갱신됨.
  - 그러나 `[냉장고 차감하고 요리 완료 🎉]` 클릭 시 실제 전송되는 `POST /api/v1/matching/cook/{recipeId}` 요청 Payload는 `{"deductInventory": true, "servings": 1}`만 전송됨.
  - 이로 인해 백엔드(`MatchingService.cookRecipe`)는 사용자가 수동 입력한 `customQuantities`를 알지 못하고 레시피 기본 1인분 정량(`돼지고기 200g`, `배추김치 150g`)을 차감함.
- **원인 코드 위치**:
  - **프론트엔드**: [`frontend/src/components/recipe/CookConfirmationModal.tsx`](file:///c:/Dev/오늘의%20뚝딱/dduktak/frontend/src/components/recipe/CookConfirmationModal.tsx#L120-L133)의 `handleFinalConfirm()`에서 `customQuantities` 상태를 DTO에 포함하지 않고 `{ deductInventory: true, servings }`만 전달함.
  - **백엔드**: [`backend/src/main/java/com/dduktak/domain/matching/dto/CookRequestDto.java`](file:///c:/Dev/오늘의%20뚝딱/dduktak/backend/src/main/java/com/dduktak/domain/matching/dto/CookRequestDto.java#L14-L28) 및 [`MatchingService.java`](file:///c:/Dev/오늘의%20뚝딱/dduktak/backend/src/main/java/com/dduktak/domain/matching/service/MatchingService.java#L174-L185)에 개별 재료별 사용자 지정 차감량(`Map<Long, BigDecimal> customDeductions`) 수신 및 오버라이드 로직이 누락되어 있음.
- **권장 조치 방안**:
  1. `CookRequestDto`에 `Map<Long, BigDecimal> customDeductions` (Key: `masterIngredientId`, Value: 사용자 지정 차감 수량) 필드를 추가.
  2. `MatchingService.cookRecipe()`에서 `customDeductions`에 해당 `masterIngredientId`가 존재하면 `needQty`를 레시피 기본 비례 계산값 대신 사용자 지정 수량으로 대체(0일 경우 차감 스킵).
  3. 프론트엔드 `CookConfirmationModal.tsx`의 `handleFinalConfirm()`에서 `customQuantities`를 `dto.customDeductions`로 함께 전달하도록 수정.

---

### 🐛 [DEF-02] FCM 네이티브 푸시 알림 탭 시 알림 유형(`type`)별 상세 화면이 아닌 항상 알림함(`/notifications`)으로만 이동하는 현상
- **발견 단계**: Step 8-2 (`Native / FCM Push` — 푸시 알림 딥링크 라우팅)
- **심각도**: **Low / Medium (UX 및 시나리오 라우팅 정합성)**
- **증상**:
  - 백엔드에서 소셜 알림(`LIKE_NOTICE`, `COOKED_NOTICE`)이나 소비기한 임박 알림(`EXPIRE_WARN`) FCM 발송 시 `data` 맵에 `{"type": "...", "targetId": "38"}`을 정상적으로 담아 전송함([`NotificationService.java`](file:///c:/Dev/오늘의%20뚝딱/dduktak/backend/src/main/java/com/dduktak/domain/notification/service/NotificationService.java#L222-L225)).
  - 그러나 프론트엔드 [`App.tsx`](file:///c:/Dev/오늘의%20뚝딱/dduktak/frontend/src/App.tsx#L19-L25)의 `NativePushService.initPushNotifications` 콜백에서:
    ```ts
    if (data?.route) {
      router.navigate(data.route);
    } else if (data?.targetId) {
      router.navigate(ROUTES.NOTIFICATIONS);
    }
    ```
    로만 분기되어 있어, `data.type`이 `LIKE_NOTICE` / `COOKED_NOTICE`인 레시피 알림을 탭해도 `/recipes/{targetId}`가 아닌 무조건 `/notifications`(알림함)으로 이동함.
- **권장 조치 방안**:
  - [`App.tsx`](file:///c:/Dev/오늘의%20뚝딱/dduktak/frontend/src/App.tsx#L19-L25) (또는 백엔드 FCM data payload)에서 `data.type === 'LIKE_NOTICE' || data.type === 'COOKED_NOTICE'`이고 `data.targetId`가 존재할 경우 `/recipes/${data.targetId}`로 이동하고, `EXPIRE_WARN`인 경우 `/inventory`(내 냉장고) 또는 `/notifications`로 이동하도록 라우팅 분기 보강.

---

### 🐛 [DEF-03] 모달(`ManualAddModal`, `CookConfirmationModal` 등) 오픈 상태에서 안드로이드 물리 뒤로가기 버튼 입력 시 모달이 닫히지 않는 현상
- **발견 단계**: Step 8-3 (`Native / Hardware Back` — 모달/바텀시트 오버레이 방어)
- **심각도**: **High (네이티브 모바일 핵심 UX 결함)**
- **증상**:
  - `재료 직접 넣기` 모달(`ManualAddModal`) 등 모달이 열려 있을 때 안드로이드 하단 물리/제스처 뒤로가기 버튼을 누르면 앱이 종료되거나 페이지가 뒤로 가지는 않지만(DOM 감지 자체는 작동), **정작 열려 있는 모달이 닫히지 않고 화면에 계속 떠 있음** ([`Step 8_3_모달 백버튼 테스트1_실패.jpg`](file:///c:/Dev/오늘의%20뚝딱/dduktak/integration-tests/cycle-01/evidence/screenshots/step8/Step%208_3_모달%20백버튼%20테스트1_실패.jpg)).
- **원인 코드 위치**:
  1. [`frontend/src/hooks/useNativeBackButton.ts`](file:///c:/Dev/오늘의%20뚝딱/dduktak/frontend/src/hooks/useNativeBackButton.ts#L28-L37)에서는 `[role="dialog"], [aria-modal="true"]` 요소가 존재하면 `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`만 발생시키고 리턴함.
  2. 그러나 `QuickAddTray.tsx`를 제외한 **대부분의 커스텀 모달 컴포넌트([`ManualAddModal.tsx`](file:///c:/Dev/오늘의%20뚝딱/dduktak/frontend/src/components/inventory/ManualAddModal.tsx), `EditIngredientModal.tsx`, `ConsumeModal.tsx`, `ReceiptOcrModal.tsx`, [`CookConfirmationModal.tsx`](file:///c:/Dev/오늘의%20뚝딱/dduktak/frontend/src/components/recipe/CookConfirmationModal.tsx), `RecipeDeleteModal.tsx`, 마이페이지 모달들)**에 `keydown` (`Escape`) 이벤트 리스너가 등록되어 있지 않아, `Escape` 이벤트가 발생해도 `onClose()`가 호출되지 않음!
- **권장 조치 방안**:
  - **방법 A (공통 훅 일괄 처리 — 권장)**: 모든 모달이 공통으로 호출하는 [`useBodyScrollLock.ts`](file:///c:/Dev/오늘의%20뚝딱/dduktak/frontend/src/hooks/useBodyScrollLock.ts)에 선택적 `onClose?: () => void` 콜백을 받거나, `useNativeBackButton.ts`에서 `Escape` 키 디스패치 후에도 모달이 닫히지 않는 경우 활성 다이얼로그 내부의 닫기 버튼(`button[aria-label="닫기"]`)을 찾아 `.click()`을 트리거하고, 추가로 각 모달에도 `Escape` 키 리스너를 연결하여 웹(ESC 키)과 모바일(네이티브 백버튼) 양쪽에서 100% 닫히도록 보장.

---

### ℹ️ [OBS-01] 레시피 상세 화면 상단 커스텀 `[뒤로가기]` 버튼 클릭 시 검색 쿼리 초기화 관찰 (Minor UX)
- **발견 단계**: Step 4-2 (`Recipe / Feed`)
- **증상**: `/recipes?q=김치` 검색 상태에서 레시피 카드를 눌러 상세 화면(`/recipes/38`)에 진입한 뒤, 브라우저 자체 뒤로가기(History Back)를 누르면 `/recipes?q=김치`가 유지되나, 화면 좌측 상단 헤더의 뒤로가기 버튼을 클릭하면 `ROUTES.RECIPES`(`'/recipes'`)로 이동하여 검색어가 초기화됨.
- **권장 조치 방안**: 상단 헤더 뒤로가기 클릭 시 `navigate(-1)`(히스토리 존재 시)을 우선 사용하도록 개선 가능.
