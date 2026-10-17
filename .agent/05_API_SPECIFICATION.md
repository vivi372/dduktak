# REST API 엔드포인트 및 DTO 규격 명세서

## 1. 개요
본 문서는 '오늘의 뚝딱' 프로젝트의 HTTP RESTful API 규격을 정의한다. 모든 요청과 응답은 `02_ARCHITECTURE_AND_CONVENTIONS.md`에 명시된 공통 응답 규격(`ApiResponseDto`, `ErrorResponseDto`)을 준수한다.

## 2. 공통 응답 규격 요약
### 2.1. 성공 응답 (`ApiResponseDto<T>`)
```json
{
  "success": true,
  "data": { ... },
  "message": "성공적으로 처리되었습니다."
}
```

### 2.2. 에러 응답 (`ErrorResponseDto`)
```json
{
  "success": false,
  "code": "INV_WARN_IMMINENT_EXPIRATION",
  "message": "소비기한이 임박한 재료가 존재합니다.",
  "timestamp": "2026-10-09T14:00:00"
}
```

## 3. 모듈별 API 엔드포인트 명세
##### 3.1. [모듈 1] 회원 & 인증 API (/api/v1/auth)
| Method | Endpoint | Description | Auth | Request Body / Query | Response Data (data) |
| ------ | ------ | ------ | ------ | ------ | ------ |
| POST | /signup | 이메일 회원가입 | X | email, password, nickname | { "userId": 1, "nickname": "뚝딱이", "userTag": "1024" } |
| POST | /login | 이메일 로그인 | X | email, password | { "accessToken": "JWT...", "refreshToken": "JWT..." } |
| POST | /social-login | 소셜 로그인 (Kakao/Google) | X | provider, providerId, email, nickname | { "accessToken": "JWT...", "refreshToken": "JWT..." } |
| GET | /me | 내 정보 조회 | O | Header Authorization | { "userId": 1, "email": "...", "nickname": "뚝딱이", "userTag": "1024", "profileImage": "...", "quietTimeStart": "21:00:00", "quietTimeEnd": "08:00:00" } |
| PATCH | /me | 프로필 정보 수정 | O | nickname, profileImage | { "userId": 1, "nickname": "뚝딱이", "profileImage": "..." } |
| PATCH | /me/quiet-time | 방해금지 시간 설정 | O | quietTimeStart, quietTimeEnd | { "quietTimeStart": "21:00:00", "quietTimeEnd": "08:00:00" } |
| DELETE | /withdraw | 회원 탈퇴 | O | password | null |

##### 3.2. [모듈 2] 표준 식재료 & 내 냉장고 관리 API (/api/v1/inventory)
| Method | Endpoint | Description | Auth | Request Body / Query | Response Data (data) |
| ------ | ------ | ------ | ------ | ------ | ------ |
| GET | /master-ingredients | 표준 식재료 검색/조회 | O | query, categoryId | [ { "masterIngredientId": 1, "categoryId": 2, "categoryName": "정육/계란", "name": "계란", "defaultUnit": "개", "defaultShelfDays": 7 } ] |
| GET | / | 내 냉장고 재료 목록 조회 | O | storageType, sort | [ { "ingredientId": 10, "masterIngredientId": 2, "categoryId": 2, "name": "계란", "storageType": "REFRIGERATED", "quantity": 10.00, "unit": "개", "expireDate": "2026-10-15", "dDay": 6 } ] |
| POST | / | 수동 재료 추가 | O | masterIngredientId, categoryId, name, storageType, quantity, unit, expireDate | { "ingredientId": 11, "name": "계란" } |
| PUT | /{ingredientId} | 재료 전체 수정 | O | storageType, quantity, unit, expireDate | { "ingredientId": 11, "quantity": 5.00 } |
| DELETE | /{ingredientId} | 재료 직접 삭제 | O | Path Variable | null |
| GET | /barcode/{barcodeNo} | 바코드 스캔 조회 | O | Path Variable | { "masterIngredientId": 2, "name": "계란", "categoryId": 2, "recommendedUnit": "개", "recommendedExpireDate": "2026-10-16" } |
| POST | /scan-ocr | 영수증 OCR 이미지 스캔 | O | multipart/form-data | [ { "masterIngredientId": 2, "name": "계란", "quantity": 10.00, "unit": "개" } ] |

##### 3.3. [모듈 3] 뚝딱 레시피 커뮤니티 API (/api/v1/recipes)
| Method | Endpoint | Description | Auth | Request Body / Query | Response Data (data) |
| ------ | ------ | ------ | ------ | ------ | ------ |
| GET | /categories | 레시피 카테고리 목록 조회 | O | None | [ { "recipeCategoryId": 1, "categoryName": "국/찌개/탕", "displayOrder": 1 } ] |
| GET | / | 레시피 목록 조회 | O | recipeCategoryId, sort, page, size | { "recipes": [ { "recipeId": 1, "title": "계란볶음밥", "recipeCategoryId": 4, "categoryName": "한그릇/밥", "thumbnailUrl": "...", "likeCount": 12 } ] } |
| GET | /{recipeId} | 레시피 상세 조회 | O | Path Variable | { "recipeId": 1, "title": "계란볶음밥", "recipeCategoryId": 4, "categoryName": "한그릇/밥", "ingredients": [...] } |
| POST | / | 레시피 신규 등록 | O | recipeCategoryId, title, description, servings, cookingTime, difficulty, ingredients, steps | { "recipeId": 2, "title": "신규 레시피" } |
| POST | /{recipeId}/like | 레시피 좋아요 Toggle | O | Path Variable | { "liked": true, "likeCount": 13 } |
| POST | /{recipeId}/scrap | 레시피 스크랩 Toggle | O | Path Variable | { "scrapped": true } |

##### 3.4. [모듈 4] 스마트 매칭 엔진 API (/api/v1/matching)
| Method | Endpoint | Description | Auth | Request Body / Query | Response Data (data) |
| ------ | ------ | ------ | ------ | ------ | ------ |
| GET | /recommendations | 맞춤 레시피 추천 | O | page, size | [ { "recipeId": 1, "title": "계란볶음밥", "matchingRate": 85, "matchIngredients": ["계란"], "missingIngredients": ["찬밥"] } ] |
| POST | /cook/{recipeId} | 뚝딱 요리완료 (FIFO 차감) | O | Path Variable | { "recipeId": 1, "deductedIngredients": [ { "name": "계란", "deductedQuantity": 2.00, "remainingQuantity": 8.00 } ] } |

##### 3.5. [모듈 5] 알림 센터 API (/api/v1/notifications)
| Method | Endpoint | Description | Auth | Request Body / Query | Response Data (data) |
| ------ | ------ | ------ | ------ | ------ | ------ |
| GET | / | 알림 목록 조회 | O | page, size | [ { "notificationId": 1, "type": "EXPIRE_WARN", "title": "소비기한 임박", "isRead": false } ] |
| PATCH | /{notificationId}/read | 단일 알림 읽음 처리 | O | Path Variable | { "notificationId": 1, "isRead": true } |
| PATCH | /read-all | 모든 알림 읽음 처리 | O | None | { "updatedCount": 5 } |

##### 3.6. [모듈 6] 메인 화면 브리핑 API (/api/v1/home)
| Method | Endpoint | Description | Auth | Request Body / Query | Response Data (data) |
| ------ | ------ | ------ | ------ | ------ | ------ |
| GET | /briefing | 메인 화면 종합 브리핑 | O | None | { "nickname": "뚝딱이", "expiringIngredientsCount": 3, "imminentIngredients": [...] } |
