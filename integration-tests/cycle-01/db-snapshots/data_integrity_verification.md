# 🗄️ [Cycle 1] 데이터베이스 무결성 교차 검증 스냅샷 (`data_integrity_verification.md`)

본 문서는 Cycle 1 통합 테스트 중 Supabase MCP (`execute_sql`) 도구를 통해 PostgreSQL 데이터베이스(`hefryhbaoovrhgzevfad`)에서 직접 조회한 주요 단계별 데이터 무결성 스냅샷입니다.

---

## 1. [Step 2] 냉장고 식재료 등록·수정·삭제 직후 스냅샷 (`public.user_ingredient`)

**실행 쿼리**:
```sql
SELECT ingredient_id, user_id, master_ingredient_id, category_id, name, storage_type, quantity, unit, expire_date, memo, status
FROM public.user_ingredient
WHERE user_id = '93bba128-7a12-4ec0-bd46-eb7388a9fff1'
ORDER BY ingredient_id ASC;
```

**조회 결과 (JSON 스냅샷)**:
```json
[
  {"ingredient_id":184,"master_ingredient_id":28,"category_id":6,"name":"식용유","storage_type":"REFRIGERATED","quantity":"1.00","unit":"통","expire_date":"2027-10-29","memo":"영수증 OCR 자동인식 (식용유)","status":"DELETED"},
  {"ingredient_id":185,"master_ingredient_id":85,"category_id":6,"name":"설탕","storage_type":"REFRIGERATED","quantity":"1.00","unit":"봉","expire_date":"2028-10-28","memo":"영수증 OCR 자동인식 (설탕)","status":"DELETED"},
  {"ingredient_id":186,"master_ingredient_id":4,"category_id":1,"name":"감자","storage_type":"REFRIGERATED","quantity":"1.00","unit":"팩","expire_date":"2026-11-18","memo":"영수증 OCR 자동인식 (감자)","status":"DELETED"},
  {"ingredient_id":187,"master_ingredient_id":9,"category_id":2,"name":"계란","storage_type":"REFRIGERATED","quantity":"1.00","unit":"판","expire_date":"2026-11-19","memo":"영수증 OCR 자동인식 (계란)","status":"DELETED"},
  {"ingredient_id":188,"master_ingredient_id":49,"category_id":2,"name":"돼지고기 (삼겹살/목살)","storage_type":"REFRIGERATED","quantity":"600.00","unit":"g","expire_date":"2026-10-30","memo":"찌개용 앞다리 (수정완료)","status":"ACTIVE"},
  {"ingredient_id":189,"master_ingredient_id":49,"category_id":2,"name":"돼지고기 (삼겹살/목살)","storage_type":"FROZEN","quantity":"800.00","unit":"g","expire_date":"2026-11-13","memo":"구이용 삼겹살","status":"ACTIVE"},
  {"ingredient_id":190,"master_ingredient_id":19,"category_id":5,"name":"배추김치","storage_type":"REFRIGERATED","quantity":"1000.00","unit":"g","expire_date":"2026-11-05","memo":"묵은지","status":"ACTIVE"},
  {"ingredient_id":191,"master_ingredient_id":1,"category_id":1,"name":"양파","storage_type":"ROOM_TEMP","quantity":"1.00","unit":"개","expire_date":"2026-11-01","memo":"삭제용양파","status":"DELETED"}
]
```

---

## 2. [Step 5] 3-Way 요리 완료 및 FIFO(선입선출) 차감 직후 스냅샷

**실행 쿼리**:
```sql
SELECT ingredient_id, name, storage_type, quantity, unit, expire_date, status
FROM public.user_ingredient
WHERE user_id = '93bba128-7a12-4ec0-bd46-eb7388a9fff1' AND status = 'ACTIVE'
ORDER BY ingredient_id ASC;
```

**조회 결과 (JSON 스냅샷)**:
```json
[
  {"ingredient_id":188,"name":"돼지고기 (삼겹살/목살)","storage_type":"REFRIGERATED","quantity":"200.00","unit":"g","expire_date":"2026-10-30","status":"ACTIVE"},
  {"ingredient_id":189,"name":"돼지고기 (삼겹살/목살)","storage_type":"FROZEN","quantity":"800.00","unit":"g","expire_date":"2026-11-13","status":"ACTIVE"},
  {"ingredient_id":190,"name":"배추김치","storage_type":"REFRIGERATED","quantity":"700.00","unit":"g","expire_date":"2026-11-05","status":"ACTIVE"}
]
```
- **검증 결과**:
  - `ingredient_id: 188` (`2026-10-30`, D-1 임박분): 초기 `600.00 g`에서 2차(`-200g`), 3차(`-200g`) 요리 완료 시 가장 먼저 차감되어 **`200.00 g`** 잔여.
  - `ingredient_id: 189` (`2026-11-13`, D-15 여유분): 초기 **`800.00 g`** 그대로 100% 보존됨으로써 **선입선출(FIFO) 차감 알고리즘**의 무결성 입증.
  - `ingredient_id: 190` (`배추김치`, D-7): 초기 `1000.00 g`에서 `-150g × 2회 = -300g` 차감되어 **`700.00 g`** 잔여.

---

## 3. [Step 7-5] 이메일 변경 승인 직후 스냅샷 (`auth.users`)

**실행 쿼리**:
```sql
SELECT id, email, email_change, email_change_sent_at, email_change_confirm_status
FROM auth.users
WHERE id = '93bba128-7a12-4ec0-bd46-eb7388a9fff1';
```

**조회 결과 (JSON 스냅샷)**:
```json
[
  {
    "id": "93bba128-7a12-4ec0-bd46-eb7388a9fff1",
    "email": "sg970825@gmail.com",
    "email_change": "",
    "email_change_sent_at": "2026-10-28 16:00:07.842971+00",
    "email_change_confirm_status": 0
  }
]
```

---

## 4. [Step 7-8] 최종 회원 탈퇴 (`USER-02`) 직후 개인정보 파기 및 레시피 익명 보존 스냅샷

**실행 쿼리 1 (개인 데이터 완전 파기 검증)**:
```sql
SELECT
  (SELECT COUNT(*) FROM auth.users WHERE id = '93bba128-7a12-4ec0-bd46-eb7388a9fff1') AS auth_user_count,
  (SELECT COUNT(*) FROM public.profiles WHERE id = '93bba128-7a12-4ec0-bd46-eb7388a9fff1') AS profile_count,
  (SELECT COUNT(*) FROM public.user_ingredient WHERE user_id = '93bba128-7a12-4ec0-bd46-eb7388a9fff1') AS ingredient_count,
  (SELECT COUNT(*) FROM public.notification WHERE user_id = '93bba128-7a12-4ec0-bd46-eb7388a9fff1') AS notification_count;
```

**조회 결과 1**:
```json
[
  {
    "auth_user_count": 0,
    "profile_count": 0,
    "ingredient_count": 0,
    "notification_count": 0
  }
]
```

**실행 쿼리 2 (작성 레시피 익명 보존 검증)**:
```sql
SELECT recipe_id, title, user_id, cooked_count, like_count, description
FROM public.recipe
WHERE recipe_id = 38;
```

**조회 결과 2**:
```json
[
  {
    "recipe_id": 38,
    "title": "초간단 뚝딱 돼지고기 김치찌개",
    "user_id": null,
    "cooked_count": 4,
    "like_count": 2,
    "description": "자취생 필수 김치찌개 레시피 (수정됨)"
  }
]
```
- **검증 결과**: `USER-02` 정책에 따라 탈퇴 회원의 계정(`auth.users`), 프로필(`public.profiles`), 냉장고 식재료(`public.user_ingredient`), 알림(`public.notification`)은 **0건으로 즉시 하드 딜리트(Hard Delete)** 되었으며, 작성한 레시피(`recipe_id = 38`)는 `user_id = null`로 익명화되어 커뮤니티에 영구 보존됨을 100% 확인했습니다.

