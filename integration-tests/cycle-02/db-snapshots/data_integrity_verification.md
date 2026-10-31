# 🗄️ [Cycle 2] 데이터베이스 무결성 검증 스냅샷 (data_integrity_verification.md)

본 문서는 **2차 E2E 통합 테스트(Cycle 2)** 수행 전/후 PostgreSQL 데이터베이스의 테이블 상태와 데이터 무결성 검증 쿼리 결과를 기록합니다.

---

## 1. 사전 기준선(Baseline) 점검 (테스트 시작 전)
* `recipe`: 공식 시드 레시피 30선 (`recipe_id: 1 ~ 30`) 정상 보존 여부
* `storage.objects`: 15종 고화질 썸네일(`thumbnails/recipe_*_v2.png`) 적재 및 구형 이미지 0건 확인
* `ingredient_master`: 74종 마스터 식재료 정합성

---

## 2. 주요 시나리오별 DB 상태 검증 쿼리

### ① 냉장고 식재료 등록 결과 (`user_ingredient`)
```sql
SELECT ingredient_id, name, quantity, unit, expire_date, status 
FROM user_ingredient 
WHERE user_id = :userId 
ORDER BY expire_date ASC;
```

### ② 요리완료 FIFO 선입선출 차감 검증
```sql
-- D-1 인스턴스가 우선 CONSUMED 되었는지 확인
SELECT ingredient_id, name, quantity, expire_date, status 
FROM user_ingredient 
WHERE user_id = :userId AND name LIKE '%돼지고기%'
ORDER BY expire_date ASC;
```

### ③ 회원 탈퇴 시 레시피 익명 보존 검증 (USER-02)
```sql
-- 유저 프로필 및 냉장고는 즉시 소거되고, 작성 레시피는 user_id = NULL 처리 확인
SELECT recipe_id, title, user_id FROM recipe WHERE recipe_id = :createdRecipeId;
SELECT count(*) FROM public.profiles WHERE id = :userId;
SELECT count(*) FROM user_ingredient WHERE user_id = :userId;
```

