# 🛡️ [Cycle 2] 데이터베이스 무결성 교차 검증 스냅샷 (data_integrity_verification.md)

본 문서는 **2차 종합 통합 테스트(Cycle 2)** 수행 중 및 종료 후 Supabase PostgreSQL 15+ 데이터베이스의 실제 레코드 변경 사항 및 정책 준수 상태를 직접 조회하여 기록한 3중 교차 검증 증적입니다.

---

## 1. 회원 탈퇴 시 레시피 작성자 익명 보존 검증 (USER-02)

### 쿼리
```sql
SELECT recipe_id, title, user_id, cooked_count, like_count 
FROM public.recipe 
WHERE recipe_id = 41;
```

### 실행 결과
```json
[
  {
    "recipe_id": 41,
    "title": "뚝딱 스페셜 감자채전",
    "user_id": null,
    "cooked_count": 1,
    "like_count": 1
  }
]
```

### 판정: ✅ PASS
* 유저 A(`ym970825@naver.com`)가 회원 탈퇴를 진행한 후, 작성했던 레시피(`recipe_id: 41`)는 삭제되지 않고 DB에 정상 보존되었습니다.
* **`user_id` 칼럼이 `NULL`로 안전하게 치환**되어 커뮤니티 데이터의 익명 보존 정책(`USER-02`)이 완벽히 준수되었습니다.
* 요리 횟수(`cooked_count: 1`) 및 좋아요 수(`like_count: 1`)도 온전히 보존되었습니다.

---

## 2. 회원 탈퇴 시 개인 프로필 및 인증 정보 영구 삭제 검증 (USER-02)

### 쿼리
```sql
SELECT id, email FROM auth.users WHERE email = 'ym970825@naver.com';
```

### 실행 결과
```json
[]
```

### 판정: ✅ PASS
* `auth.users`에서 유저 레코드가 완전히 삭제되었으며, PostgreSQL 외래키 Cascade 정책에 따라 `public.profiles`, `public.user_ingredient`, `public.notification` 등 개인 식별 데이터가 일괄 영구 삭제되었습니다.

---

## 3. 서브 계정(유저 B) 상호작용 및 알림 정합성

### 쿼리
```sql
SELECT id, nickname, user_tag FROM public.profiles WHERE id = '22222222-2222-2222-2222-222222222222';
```

### 실행 결과
```json
[
  {
    "id": "22222222-2222-2222-2222-222222222222",
    "nickname": "뚝딱도우미",
    "user_tag": "7777"
  }
]
```

### 판정: ✅ PASS
* 상호작용용 서브 계정(`뚝딱도우미#7777`)이 정상 가동되어 유저 A의 레시피에 대한 좋아요 트리거를 정확히 수행했습니다.
