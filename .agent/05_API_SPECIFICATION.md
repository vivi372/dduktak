###### REST API 엔드포인트 및 DTO 규격 명세서
###### 1. 개요
본 문서는 '오늘의 뚝딱' 프로젝트의 HTTP RESTful API 규격을 정의한다. 모든 요청과 응답은 02_ARCHITECTURE_AND_CONVENTIONS.md에 명시된 공통 응답 규격(ApiResponseDto<T>, ErrorResponseDto) 및 공통 트레이싱 헤더(X-Trace-Id)를 준수한다.

--------------------------------------------------------------------------------

###### 2. 공통 응답 규격 & 트레이싱 헤더 요약
###### 2.1. 공통 응답 헤더 (Common Response Headers)
```text
X-Trace-Id: e4a3f1 (6자리 무작위 트레이스 ID)
Content-Type: application/json;charset=UTF-8



```
*   **트레이스 헤더 연동**    : 백엔드 TraceIdFilter가 모든 API 응답 헤더에 X-Trace-Id를 주입하여 반환합니다.
*   **프론트엔드 연동**    : Axios Response Interceptor에서 X-Trace-Id를 추출하여 에러 토스트, 모달, 및 고객지원 모듈의 백엔드 로그 추적용 식별 키로 활용합니다.
###### 2.2. 성공 응답 (ApiResponseDto<T>)
```json
{
  "success": true,
  "data": { ... },
  "message": "성공적으로 처리되었습니다."
}



```
###### 2.3. 에러 응답 (ErrorResponseDto)
```json
{
  "success": false,
  "code": "INV_WARN_IMMINENT_EXPIRATION",
  "message": "소비기한이 임박한 재료가 존재합니다.",
  "timestamp": "2026-10-09T14:00:00",
  "fieldErrors": []
}



```

--------------------------------------------------------------------------------

###### 3. 모듈별 API 엔드포인트 명세
###### 3.1. [모듈 1] 회원 & 인증 API (/api/v1/auth)
**참고** : 회원 가입, 로그인, 이메일 승인, 비밀번호 재설정 및 토큰 재발급은 Supabase Auth Client SDK (auth.users)에서 직접 처리합니다. 백엔드(Spring Boot)는 Supabase JWT 토큰을 검증한 후 public.profiles 관련 세션 동기화, 프로필 관리 및 탈퇴 처리만 관장합니다.
| Method | Endpoint | Description | Auth | Request Body / Query | Response Data (data) |
| ------ | ------ | ------ | ------ | ------ | ------ |
| POST | /init | 세션 동기화 및 지연 프로필 생성 | O | Header Authorization | { "userId": "3f7f754c-d561-4b93-b79b-9d73a4f29f2a", "nickname": "뚝딱이", "userTag": "1024", "profileImage": "..." } |
| GET | /me | 내 정보 조회 (Read-Only 멱등 API) | O | Header Authorization | { "userId": "3f7f754c-d561-4b93-b79b-9d73a4f29f2a", "email": "user@dduktak.com", "nickname": "뚝딱이", "userTag": "1024", "profileImage": "...", "status": "ACTIVE", "quietTimeStart": "21:00:00", "quietTimeEnd": "08:00:00" } |
| PATCH | /me | 프로필 정보 수정 (닉네임, 프로필 이미지) | O | nickname, profileImage | { "userId": "3f7f754c-d561-4b93-b79b-9d73a4f29f2a", "nickname": "뚝딱이", "profileImage": "..." } |
| DELETE | /withdraw | 회원 탈퇴 (USER-02 적용) | O | password (이메일 회원일 때) | null |


--------------------------------------------------------------------------------

###### 3.2. [모듈 2] 표준 식재료 & 내 냉장고 관리 API (/api/v1/inventory)
> **비즈니스 & 보안 처리 가이드**:
> 1. **소유권 검증(Ownership Validation)**: 단일 재료 수정(`PUT`), 소비(`PATCH`), 삭제(`DELETE`) 요청 시 SecurityContext의 `user_id`(UUID)와 `ingredient_id` 복합 조건을 검증하여 타인의 재료 조작 시 `INV_WARN_NOT_FOUND`(404)를 반환합니다.
> 2. **SQL D-Day 연산**: `GET /` 조회 시 `dDay`는 서버 메모리가 아닌 PostgreSQL SQL 쿼리(`expire_date - CURRENT_DATE`)로 실시간 계산하여 반환합니다.
> 3. **수동 소비 차감**: 프론트엔드에서 `consumeQuantity <= quantity` 유효성 검증을 수행하며, 백엔드는 `Math.max(0, quantity - consumeQuantity)` 방어적 차감 후 잔여 수량이 0이 되면 `status = 'CONSUMED'`로 변경합니다.
> 4. **외부 스캔 실패 예외 복구**:
>    - 바코드 미등록 시: `404 Not Found` (`code: "INV_WARN_BARCODE_NOT_FOUND"`) 반환 ➔ 프론트엔드 수동 등록 폼 유도.
>    - OCR 인식 실패 시: `200 OK` 및 빈 배열 `data: []` 반환 ➔ 수동 입력 화면으로 가이드.

| Method | Endpoint | Description | Auth | Request Body / Query | Response Data (data) |
| ------ | ------ | ------ | ------ | ------ | ------ |
| GET | /master-ingredients | 표준 식재료 검색/조회 | O | query (검색어), categoryId | [ { "masterIngredientId": 1, "categoryId": 2, "categoryName": "정육/계란", "name": "계란", "defaultUnit": "개", "defaultShelfDays": 7 } ] |
| GET | / | 내 냉장고 재료 목록 조회 (SQL D-Day 연산) | O | query (재료명/메모 검색어, 선택), categoryId (선택), storageType (REFRIGERATED, FROZEN, ROOM_TEMP), sort (expireDate) | [ { "ingredientId": 10, "masterIngredientId": 2, "categoryId": 2, "name": "계란", "storageType": "REFRIGERATED", "quantity": 10.00, "unit": "개", "expireDate": "2026-10-15", "dDay": 6, "memo": "엄마표 김치" } ] |
| POST | / | 수동 재료 추가 | O | masterIngredientId, categoryId, name, storageType, quantity, unit, expireDate, memo (선택) | { "ingredientId": 11, "name": "계란", "memo": "엄마표 김치" } |
| PUT | /{ingredientId} | 재료 수량/보관장소/소비기한/메모 전체 수정 (소유권 검증) | O | storageType, quantity, unit, expireDate, memo (선택) | { "ingredientId": 11, "quantity": 5.00, "memo": "수정된 메모" } |
| PATCH | /{ingredientId}/consume | 식재료 수동 소비 처리 (프론트 validation & 클램핑) | O | consumeQuantity (선택, 기본 전체 차감) | { "ingredientId": 10, "remainingQuantity": 0.00, "status": "CONSUMED" } |
| DELETE | /{ingredientId} | 재료 직접 삭제 (status=DELETED, 소유권 검증) | O | Path Variable | null |
| GET | /barcode/{barcodeNo} | 바코드(EAN-13) 스캔 조회 (미등록 시 404) | O | Path Variable | { "masterIngredientId": 2, "name": "계란", "categoryId": 2, "recommendedUnit": "개", "recommendedExpireDate": "2026-10-16" } |
| POST | /scan-ocr | 영수증 OCR 이미지 스캔 (실패 시 빈 배열 [] 반환) | O | multipart/form-data (image) | [ { "masterIngredientId": 2, "name": "계란", "quantity": 10.00, "unit": "개", "recommendedExpireDate": "2026-10-16" } ] |


--------------------------------------------------------------------------------

###### 3.3. [모듈 3] 뚝딱 레시피 커뮤니티 API (/api/v1/recipes)
| Method | Endpoint | Description | Auth | Request Body / Query | Response Data (data) |
| ------ | ------ | ------ | ------ | ------ | ------ |
| GET | /categories | 레시피 카테고리 목록 조회 | O | None | [ { "recipeCategoryId": 1, "categoryName": "국/찌개/탕", "displayOrder": 1 }, { "recipeCategoryId": 2, "categoryName": "메인반찬", "displayOrder": 2 } ] |
| GET | / | 레시피 목록 조회 (검색/필터/카테고리/정렬) | O | query (검색어, 선택), filter (ALL, MY, SCRAP, 기본값 ALL), recipeCategoryId, sort (latest, like, cooked), page, size | { "recipes": [ { "recipeId": 1, "recipeCategoryId": 4, "categoryName": "한그릇/밥", "title": "계란볶음밥", "thumbnailUrl": "...", "likeCount": 12, "cookedCount": 5, "authorNickname": "셰프", "authorTag": "1024" } ], "totalPages": 5 } |
| GET | /{recipeId} | 레시피 상세 조회 | O | Path Variable | { "recipeId": 1, "recipeCategoryId": 4, "categoryName": "한그릇/밥", "title": "계란볶음밥", "description": "...", "servings": 1, "cookingTime": 15, "difficulty": "쉬움", "isLiked": false, "isScrapped": true, "ingredients": [ { "recipeIngId": 101, "masterIngredientId": 2, "altIngredientId": null, "name": "계란", "quantity": 2.00, "unit": "개", "typeCode": "MAIN", "isOptional": false } ], "steps": [ { "stepNo": 1, "description": "파를 기름에 볶습니다.", "imageUrl": "..." } ] } |
| POST | / | 레시피 신규 등록 | O | recipeCategoryId, title, description, servings, cookingTime, difficulty, thumbnailUrl, ingredients: [{ masterIngredientId, altIngredientId, categoryId, name, quantity, unit, typeCode, isOptional }], steps: [{ stepNo, description, imageUrl }] | { "recipeId": 2, "title": "신규 레시피" } |
| PUT | /{recipeId} | 본인 작성 레시피 수정 | O | Path Variable, Request Body: recipeCategoryId, title, description, servings, cookingTime, difficulty, thumbnailUrl, ingredients, steps | { "recipeId": 1, "title": "수정된 레시피" } |
| DELETE | /{recipeId} | 본인 작성 레시피 삭제 | O | Path Variable | null |
| POST | /{recipeId}/like | 레시피 좋아요 Toggle | O | Path Variable | { "liked": true, "likeCount": 13 } |
| POST | /{recipeId}/scrap | 레시피 스크랩 Toggle | O | Path Variable | { "scrapped": true } |


--------------------------------------------------------------------------------

###### 3.4. [모듈 4] 스마트 매칭 엔진 API (/api/v1/matching)
| Method | Endpoint | Description | Auth | Request Body / Query | Response Data (data) |
| ------ | ------ | ------ | ------ | ------ | ------ |
| GET | /recommendations | 냉장고 기반 맞춤 레시피 추천 | O | recipeCategoryId (카테고리 필터, 선택), page, size | [ { "recipeId": 1, "title": "계란볶음밥", "matchingRate": 85, "matchIngredients": ["계란", "대파"], "missingIngredients": ["찬밥"] } ] |
| POST | /cook/{recipeId} | 뚝딱 요리완료 (FIFO 자동 차감 / 2-Way) | O | Path Variable, Request Body: deductInventory (Boolean, 기본값 true), servings (Integer, 기본값 1) | { "recipeId": 1, "isDeducted": true, "cookedCount": 6, "deductedIngredients": [ { "name": "계란", "deductedQuantity": 2.00, "remainingQuantity": 8.00 } ] } |


--------------------------------------------------------------------------------

###### 3.5. [모듈 5] 알림 센터 API (/api/v1/notifications)
| Method | Endpoint | Description | Auth | Request Body / Query | Response Data (data) |
| ------ | ------ | ------ | ------ | ------ | ------ |
| GET | / | 알림 목록 조회 | O | page, size | [ { "notificationId": 1, "type": "EXPIRE_WARN", "title": "소비기한 임박", "content": "계란의 소비기한이 2일 남았습니다.", "isRead": false, "createdAt": "2026-10-09T09:00:00" } ] |
| PATCH | /{notificationId}/read | 단일 알림 읽음 처리 | O | Path Variable | { "notificationId": 1, "isRead": true } |
| PATCH | /read-all | 모든 알림 읽음 처리 | O | None | { "updatedCount": 5 } |
| PATCH | /settings | 알림 수신 토글 및 방해금지 시간 통합 설정 (USER-PAGE-04) | O | isExpireWarnEnabled (Boolean, 선택), isReactionNoticeEnabled (Boolean, 선택), quietTimeStart (Time, 선택), quietTimeEnd (Time, 선택) | { "isExpireWarnEnabled": true, "isReactionNoticeEnabled": true, "quietTimeStart": "21:00:00", "quietTimeEnd": "08:00:00" } |


--------------------------------------------------------------------------------

###### 3.6. [모듈 6] 메인 화면 브리핑 API (/api/v1/home)
| Method | Endpoint | Description | Auth | Request Body / Query | Response Data (data) |
| ------ | ------ | ------ | ------ | ------ | ------ |
| GET | /briefing | 메인 화면 종합 브리핑 | O | None | { "nickname": "뚝딱이", "expiringIngredientsCount": 3, "imminentIngredients": [ { "ingredientId": 10, "name": "계란", "dDay": 2 } ], "topRecipe": { "recipeId": 1, "title": "계란볶음밥", "matchingRate": 90 } } |

