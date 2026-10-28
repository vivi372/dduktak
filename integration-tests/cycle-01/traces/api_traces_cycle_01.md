# 🔍 [Cycle 1] API 호출 및 AOP/SQL 트레이스 증적 (`api_traces_cycle_01.md`)

본 문서는 Cycle 1 E2E 통합 테스트(Step 1 ~ Step 7) 수행 중 백엔드(`Spring Boot 3.4.13`, `LoggingAspect`, `TraceIdFilter`, `log4jdbc-log4j2`)에서 발생한 실제 `X-Trace-Id`, 메서드 실행 시간(Execution Time), 그리고 바인딩된 SQL 실행 결과를 기록한 증적 문서입니다.

---

## 1. [Step 1] 회원가입 프로필 초기화 & 웜업 (`AuthController`)
- **엔드포인트**: `POST /api/v1/auth/init`
- **유저 ID**: `93bba128-7a12-4ec0-bd46-eb7388a9fff1` (`ym970825@naver.com`)
- **생성 프로필**: `뚝딱테스터#1132`
- **AOP & SQL 로그 요약**:
  ```text
  --> [START] [CONTROLLER] AuthController.initProfile(...)
  --> [START] [SERVICE] AuthService.initProfile(userId=93bba128-7a12-4ec0-bd46-eb7388a9fff1, email=ym970825@naver.com)
  INSERT INTO public.profiles (id, nickname, user_tag, profile_image, quiet_time_start, quiet_time_end, is_expire_warn_enabled, is_reaction_notice_enabled)
  VALUES ('93bba128-7a12-4ec0-bd46-eb7388a9fff1', '뚝딱테스터', '1132', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/profiles/Default%20Profile.png', '22:00:00', '08:00:00', TRUE, TRUE)
  <-- [END] [CONTROLLER] AuthController.initProfile() | Return: <200 OK>
  ```

---

## 2. [Step 2] 냉장고 식재료 OCR 분석 및 CRUD (`InventoryController`)
- **영수증 OCR 스캔**: `POST /api/v1/inventory/scan-ocr` ➔ `200 OK` (비식품 제외 식용유, 설탕, 감자, 계란 4건 추출)
- **OCR 일괄 등록**: `POST /api/v1/inventory/batch` ➔ `201 Created` (`ingredient_id`: 184, 185, 186, 187)
- **수동 식재료 4건 등록**: `POST /api/v1/inventory` ➔ `201 Created`
  - `ingredient_id = 188`: `돼지고기 (삼겹살/목살)` | `REFRIGERATED` | `600.00 g` | `2026-10-30 (D-1)` | `"찌개용 앞다리"`
  - `ingredient_id = 189`: `돼지고기 (삼겹살/목살)` | `FROZEN` | `800.00 g` | `2026-11-13 (D-15)` | `"구이용 삼겹살"`
  - `ingredient_id = 190`: `배추김치` | `REFRIGERATED` | `1000.00 g` | `2026-11-05 (D-7)` | `"묵은지"`
  - `ingredient_id = 191`: `양파` | `ROOM_TEMP` | `1.00 개` | `2026-11-01 (D-3)` | `"삭제용양파"`
- **식재료 수정**: `PUT /api/v1/inventory/188` ➔ `200 OK` (메모 `"찌개용 앞다리 (수정완료)"` 반영)
- **식재료 삭제**: `DELETE /api/v1/inventory/191` ➔ `200 OK` (`status = 'DELETED'` 소프트 딜리트 전환)

---

## 3. [Step 3] 레시피 등록, 수정, 삭제 (`RecipeController`)
- **레시피 등록**: `POST /api/v1/recipes` ➔ `201 Created` (`recipe_id = 38`, `"초간단 뚝딱 돼지고기 김치찌개"`)
  - 썸네일 및 조리 순서 1, 2 이미지가 제출 시점에 WebP로 압축되어 Supabase Storage `recipes` 버킷에 업로드된 후 Public URL만 DTO로 전달됨.
- **레시피 수정**: `PUT /api/v1/recipes/38` ➔ `200 OK` (소개글 `"자취생 필수 김치찌개 레시피 (수정됨)"` 및 대표 썸네일 교체, 이전 썸네일 Storage 클린업 완료)
- **임시 레시피 등록 및 삭제**:
  - `POST /api/v1/recipes` ➔ `201 Created` (`recipe_id = 39`, `"삭제 테스트용 임시 레시피"`)
  - `DELETE /api/v1/recipes/39` ➔ `200 OK` (삭제 후 `/recipes` 복귀 시 404 재조회 에러 미발생 및 Storage 이미지 삭제 확인)

---

## 4. [Step 4] 홈 브리핑, 실시간 매칭률 및 레시피 피드 검색 (`HomeController`, `MatchingController`, `RecipeController`)
- **홈 브리핑 조회 (`X-Trace-Id: 7E2AF2`)**: `GET /api/v1/home/briefing` ➔ `200 OK`
  ```text
  2026-10-29 01:04:51.120 INFO [nio-8080-exec-6] [7E2AF2] c.dduktak.global.aspect.LoggingAspect : --> [START] [CONTROLLER] HomeController.getBriefing()
  2026-10-29 01:04:51.120 INFO [nio-8080-exec-6] [7E2AF2] c.dduktak.global.aspect.LoggingAspect : --> [START] [SERVICE] HomeService.getBriefing(userId=93bba128-7a12-4ec0-bd46-eb7388a9fff1)
  ```
- **레시피 피드 목록 및 검색 (`X-Trace-Id: 55418D`)**: `GET /api/v1/recipes?query=김치&sort=latest&page=0&size=30` ➔ `200 OK` (36ms)
  ```text
  |recipe_id |title                         |cooking_time |difficulty |like_count |cooked_count |author_nickname |author_tag |is_liked |
  |38        |초간단 뚝딱 돼지고기 김치찌개 |15           |쉬움       |2          |4            |뚝딱테스터      |1132       |true     |
  ```

---

## 5. [Step 5] 3-Way 요리 완료 & FIFO 차감 (`MatchingController`)
- **1차 요리 완료 (차감 없음)**: `POST /api/v1/matching/cook/38` (`{"deductInventory":false,"servings":1}`) ➔ `200 OK` (`cookedCount: 1`, 식재료 수량 불변)
- **2차 요리 완료 (수량 조절 모달 검수 후 차감)**: `POST /api/v1/matching/cook/38` (`{"deductInventory":true,"servings":1}`) ➔ `200 OK` (`cookedCount: 2`, D-1 돼지고기 600g ➔ 400g, 배추김치 1000g ➔ 850g)
  - *비고*: 프론트엔드 `CookConfirmationModal`에서 수정한 커스텀 수량(`customQuantities`)이 요청 DTO에 포함되지 않아 1인분 기본 정량(200g, 150g)이 차감됨을 확인 (결함 티켓 `DEF-01` 등록).
- **3차 요리 완료 (기본 정량 FIFO 차감)**: `POST /api/v1/matching/cook/38` (`{"deductInventory":true,"servings":1}`) ➔ `200 OK` (`cookedCount: 3`, D-1 돼지고기 400g ➔ 200g, D-15 돼지고기 800g 보존, 배추김치 850g ➔ 700g)

---

## 6. [Step 6] 알림 센터, 자추 필터링, 다중 계정 상호작용 및 404 Fallback (`NotificationController`)
- **본인 상호작용(자추) 알림 필터링**: 유저 A가 본인 레시피(`recipe_id = 38`)에 좋아요 및 요리완료를 수행했을 때 `NotificationService`에서 본인 여부가 감지되어 알림 레코드가 생성되지 않음 (`unreadCount = 0`).
- **유저 B (`test_helper@dduktak.com`, `22222222-2222-2222-2222-222222222222`) 상호작용**:
  - `POST /api/v1/recipes/38/like` ➔ `200 OK` (`notification_id = 100` 생성)
  - `POST /api/v1/recipes/38/scrap` ➔ `200 OK`
  - `POST /api/v1/matching/cook/38` ➔ `200 OK` (`notification_id = 101` 생성)
- **삭제된 레시피(`target_id = 9999`) 알림 클릭 시 404 응답**:
  - `GET /api/v1/recipes/9999` ➔ `404 Not Found` (`RECIPE_WARN_NOT_FOUND`) 반환 시 프론트엔드가 크래시 없이 `"삭제되었거나 더 이상 존재하지 않는 콘텐츠입니다"` 토스트 출력.
- **알림 전체 삭제**: `DELETE /api/v1/notifications` ➔ `200 OK`

---

## 7. [Step 7] 마이페이지 프로필/보안 관리 및 최종 회원 탈퇴 (`AuthController`)
- **이메일 변경 반영 조회 (`X-Trace-Id: 3766A1`)**: `GET /api/v1/auth/me` ➔ `200 OK` (16ms)
  ```text
  |user_id                              |email              |nickname   |user_tag |status |is_expire_warn_enabled |is_reaction_notice_enabled |
  |93bba128-7a12-4ec0-bd46-eb7388a9fff1 |sg970825@gmail.com |뚝딱테스터 |1132     |ACTIVE |true                   |true                       |
  ```
- **최종 회원 탈퇴 및 레시피 익명화 보존 (`X-Trace-Id: 34E430`)**: `DELETE /api/v1/auth/withdraw` ➔ `200 OK` (91ms)
  ```text
  2026-10-29 01:05:34.772 INFO  [nio-8080-exec-9] [34E430] c.dduktak.global.aspect.LoggingAspect    : --> [START] [CONTROLLER] AuthController.withdraw(...)
  2026-10-29 01:05:34.772 INFO  [nio-8080-exec-9] [34E430] c.dduktak.global.aspect.LoggingAspect    : --> [START] [SERVICE] AuthService.withdraw(userId=93bba128-7a12-4ec0-bd46-eb7388a9fff1, requestDto=null)
  2026-10-29 01:05:34.801 INFO  [nio-8080-exec-9] [34E430] log4jdbc.log4j2                          : 19. UPDATE public.recipe SET user_id = NULL, updated_at = NOW() WHERE user_id = 93bba128-7a12-4ec0-bd46-eb7388a9fff1 {executed in 12 ms} (Updates: 1)
  2026-10-29 01:05:34.810 INFO  [nio-8080-exec-9] [34E430] log4jdbc.log4j2                          : 19. DELETE FROM public.profiles WHERE id = 93bba128-7a12-4ec0-bd46-eb7388a9fff1 {executed in 9 ms} (Updates: 1)
  2026-10-29 01:05:34.854 INFO  [nio-8080-exec-9] [34E430] log4jdbc.log4j2                          : 19. DELETE FROM auth.users WHERE id = 93bba128-7a12-4ec0-bd46-eb7388a9fff1 {executed in 44 ms} (Updates: 1)
  2026-10-29 01:05:34.863 INFO  [nio-8080-exec-9] [34E430] c.dduktak.global.aspect.LoggingAspect    : <-- [END] [SERVICE] AuthService.withdraw() - 91ms | Return: void/null
  2026-10-29 01:05:34.863 INFO  [nio-8080-exec-9] [34E430] c.dduktak.global.aspect.LoggingAspect    : <-- [END] [CONTROLLER] AuthController.withdraw() - 91ms | Return: <200 OK OK>
  ```
- **탈퇴 후 익명화된 레시피 상세 조회 (`X-Trace-Id: 388FA5`)**: `GET /api/v1/recipes/38` ➔ `200 OK` (72ms, 작성자 `'관리자'`로 안전하게 반환)

