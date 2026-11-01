# 오늘의 뚝딱 (Dduktak) REST API 명세서

> **1인 가구를 위한 냉장고 관리 및 맞춤 요리 솔루션 서비스**  
> 본 문서는 '오늘의 뚝딱' 프로젝트의 HTTP RESTful API 엔드포인트, DTO 규격, 비즈니스 예외 규칙 및 트레이싱 규격을 정의합니다.

---

## 목차 (Table of Contents)

1. [공통 통신 규격 및 트레이싱 헤더](#1-공통-통신-규격-및-트레이싱-헤더)
   - [기본 환경 정보](#11-기본-환경-정보)
   - [공통 응답 헤더](#12-공통-응답-헤더-response-headers)
   - [표준 응답 DTO 규격](#13-표준-응답-dto-규격)
2. [전역 비즈니스 규칙 및 UX 에러 태그 체계](#2-전역-비즈니스-규칙-및-ux-에러-태그-체계)
   - [선입선출(FIFO) 차감 및 양념류 제외 규칙](#21-선입선출fifo-차감-및-양념류-제외-규칙)
   - [UX 에러 태그 기반 프론트엔드 연동 수칙](#22-ux-에러-태그-기반-프론트엔드-연동-수칙)
3. [도메인별 상세 API 명세](#3-도메인별-상세-api-명세)
   - [모듈 1. 회원 및 인증 API (`/api/v1/auth`)](#모듈-1-회원-및-인증-api-apiv1auth)
   - [모듈 2. 식재료 및 내 냉장고 관리 API (`/api/v1/inventory`)](#모듈-2-식재료-및-내-냉장고-관리-api-apiv1inventory)
   - [모듈 3. 뚝딱 레시피 커뮤니티 API (`/api/v1/recipes`)](#모듈-3-뚝딱-레시피-커뮤니티-api-apiv1recipes)
   - [모듈 4. 스마트 레시피 매칭 & 요리완료 API (`/api/v1/matching`)](#모듈-4-스마트-레시피-매칭--요리완료-api-apiv1matching)
   - [모듈 5. 알림 센터 API (`/api/v1/notifications`)](#모듈-5-알림-센터-api-apiv1notifications)
   - [모듈 6. 메인 홈 브리핑 API (`/api/v1/home`)](#모듈-6-메인-홈-브리핑-api-apiv1home)

---

## 1. 공통 통신 규격 및 트레이싱 헤더

### 1.1. 기본 환경 정보

| 구분 | URL | 비고 |
| :--- | :--- | :--- |
| **운영 서버 (Production)** | `https://dduktak-backend.onrender.com/api/v1` | Render Cloud PaaS (512MB RAM) |
| **로컬 서버 (Local Dev)** | `http://localhost:8080/api/v1` | Spring Boot 3.3.x |
| **인증 방식 (Auth)** | `Authorization: Bearer <Supabase_JWT_Token>` | Supabase GoTrue Auth 연동 |

### 1.2. 공통 응답 헤더 (Response Headers)

```http
Content-Type: application/json;charset=UTF-8
X-Trace-Id: e4a3f1
```

- **`X-Trace-Id`**: Servlet Filter(`TraceIdFilter`)가 HTTP 요청 진입 즉시 6자리 무작위 난수 Trace ID를 발급하여 MDC 및 응답 헤더에 주입합니다.
- **클라이언트 연동**: Axios Response Interceptor에서 `X-Trace-Id`를 추출하여 에러 토스트(Sonner Toast) 및 디버깅 콘솔에 자동 매핑합니다.

### 1.3. 표준 응답 DTO 규격

#### 성공 응답 (`ApiResponseDto<T>`)
```json
{
  "success": true,
  "data": {
    "userId": "3f7f754c-d561-4b93-b79b-9d73a4f29f2a",
    "nickname": "뚝딱이"
  },
  "message": "성공적으로 처리되었습니다."
}
```

#### 에러 응답 (`ErrorResponseDto`)
```json
{
  "success": false,
  "code": "INV_WARN_IMMINENT_EXPIRATION",
  "message": "소비기한이 임박한 재료가 존재합니다.",
  "timestamp": "2026-11-01T20:30:00",
  "fieldErrors": []
}
```

---

## 2. 전역 비즈니스 규칙 및 UX 에러 태그 체계

### 2.1. 선입선출(FIFO) 차감 및 양념류 제외 규칙

- **선입선출(FIFO) 자동 차감 (`INV-01 / SYS-03`)**:
  - 요리 완료 시 동일 식재료가 여러 개 등록되어 있을 경우, 소비기한이 가장 빠른(`ORDER BY expire_date ASC`) 활성 재료부터 순차적으로 차감합니다.
  - **0g 클램핑 & 상태 전이**: 백엔드는 `Math.max(0, quantity - deductQuantity)`로 차감하며, 잔여 수량이 `0`이 되면 식재료의 상태를 즉시 `status = 'CONSUMED'`로 전이합니다.
- **양념/소스 차감 제외 정책 (`REC-02`)**:
  - 간장, 고추장, 설탕, 식용유 등 양념/조미료(`category_id = 5` 또는 `type_code = 'SEASONING'`)는 요리 완료 차감 연산 대상에서 자동으로 배제되어 수량이 보존됩니다.
- **소유권 검증 (Ownership Validation)**:
  - 식재료 수정/삭제/소비 요청 시 SecurityContext의 `user_id`와 대상 엔티티의 소유자를 교차 검증하여 타인의 자원 조작을 원천 차단(`404 INV_WARN_NOT_FOUND`)합니다.
- **회원 탈퇴 데이터 익명 보존 (`USER-02`)**:
  - 회원 탈퇴 시 개인 식재료 및 알림은 즉시 영구 삭제하되, 커뮤니티에 등록된 레시피는 작성자 식별자를 `user_id = NULL`로 처리하여 "관리자" 명의로 익명 보존합니다.

### 2.2. UX 에러 태그 기반 프론트엔드 연동 수칙

백엔드는 에러 코드 작성 시 `[도메인]_[UX태그]_[상세원인]` 규격을 강제하며, 프론트엔드는 에러 코드의 UX 태그를 파싱하여 적절한 UI 피드백을 자동으로 분기 노출합니다:

| UX 태그 | HTTP 상태 | UI 노출 방식 | 비즈니스 사례 |
| :---: | :---: | :--- | :--- |
| **`_FIELD_`** | `400 Bad Request` | react-hook-form 해당 입력 폼 필드 하단 에러 메시지 바인딩 | `USER_FIELD_DUPLICATE_NICKNAME` |
| **`_INFO_`** | `200 OK / 400` | Sonner Toast (기본/블루 테마, 3초 자동 닫힘) | `RECIPE_INFO_ALREADY_SCRAPPED` |
| **`_WARN_`** | `400 / 404` | Sonner Toast (주황/옐로우 경고 테마, 4초 유지) | `INV_WARN_INSUFFICIENT_STOCK` |
| **`_ERROR_`** | `500 Server Error` | Sonner Toast (레드 에러 테마) + 콘솔 `X-Trace-Id` 표출 | `SYS_ERROR_INTERNAL_SERVER` |

---

## 3. 도메인별 상세 API 명세

---

### 모듈 1. 회원 및 인증 API (`/api/v1/auth`)

> 회원 가입, 로그인, 이메일 인증, 비밀번호 재설정은 Supabase Auth Client SDK에서 처리합니다.  
> 백엔드(Spring Boot)는 Supabase JWT 토큰을 검증한 후 `profiles` 세션 동기화, 프로필 관리 및 탈퇴를 담당합니다.

#### 엔드포인트 목록 요약
| HTTP Method | 엔드포인트 | 설명 | 인증 |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/init` | 세션 동기화 및 지연 프로필 초기화 (`AUTH-01-2`) | 필수 |
| `GET` | `/api/v1/auth/me` | 내 프로필 정보 조회 (멱등 Read-Only) | 필수 |
| `PATCH` | `/api/v1/auth/me` | 프로필 정보 수정 (닉네임, 프로필 이미지) | 필수 |
| `PATCH` | `/api/v1/auth/me/quiet-time` | 야간 방해금지 시간 단독 설정 | 필수 |
| `DELETE` | `/api/v1/auth/withdraw` | 회원 탈퇴 (데이터 익명화 보존 `USER-02`) | 필수 |

---

#### 1. 세션 동기화 및 지연 프로필 초기화
- **Method**: `POST`
- **URL**: `/api/v1/auth/init`
- **비즈니스 규칙**:
  - Supabase Auth 회원가입 후 최초 앱 진입 시 호출하여 `profiles` 테이블에 비즈니스 계정을 원자적으로 생성합니다.
  - 중복 호출 시 `ON CONFLICT (id) DO NOTHING` 업서트 쿼리를 통해 멱등성을 100% 보장합니다.

**Request Header**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "userId": "3f7f754c-d561-4b93-b79b-9d73a4f29f2a",
    "nickname": "뚝딱이",
    "userTag": "1024",
    "profileImage": "https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/profiles/Default%20Profile.png"
  },
  "message": "프로필이 성공적으로 동기화되었습니다."
}
```

---

#### 2. 내 프로필 정보 조회
- **Method**: `GET`
- **URL**: `/api/v1/auth/me`

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "userId": "3f7f754c-d561-4b93-b79b-9d73a4f29f2a",
    "email": "user@dduktak.com",
    "nickname": "뚝딱이",
    "userTag": "1024",
    "profileImage": "https://.../profiles/my_profile.webp",
    "status": "ACTIVE",
    "quietTimeStart": "21:00:00",
    "quietTimeEnd": "08:00:00"
  },
  "message": "성공적으로 처리되었습니다."
}
```

---

#### 3. 프로필 정보 수정
- **Method**: `PATCH`
- **URL**: `/api/v1/auth/me`
- **비즈니스 규칙**:
  - `nickname` 변경 시 중복 검사를 수행하며, 중복 시 `USER_FIELD_DUPLICATE_NICKNAME` 에러를 반환합니다.
  - 프로필 이미지는 Supabase Storage 클라이언트 Direct Upload로 획득한 Public URL만 전달합니다.

**Request Body**
```json
{
  "nickname": "요리왕뚝딱",
  "profileImage": "https://.../profiles/new_avatar.webp"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "userId": "3f7f754c-d561-4b93-b79b-9d73a4f29f2a",
    "nickname": "요리왕뚝딱",
    "profileImage": "https://.../profiles/new_avatar.webp"
  },
  "message": "프로필 정보가 수정되었습니다."
}
```

---

#### 4. 회원 탈퇴
- **Method**: `DELETE`
- **URL**: `/api/v1/auth/withdraw`
- **비즈니스 규칙 (`USER-02`)**:
  - 회원의 개인 식재료(`user_ingredient`)와 알림(`notification`)은 즉시 삭제됩니다.
  - 회원이 작성한 레시피(`recipe`)는 삭제되지 않으며 `user_id = NULL`로 전환되어 "관리자" 명의로 익명 보존됩니다.

**Response (200 OK)**
```json
{
  "success": true,
  "data": null,
  "message": "회원 탈퇴 및 데이터 처리가 완료되었습니다."
}
```

---

### 모듈 2. 식재료 및 내 냉장고 관리 API (`/api/v1/inventory`)

> 사용자의 식재료 등록, 보관 장소 분류, 소비기한 D-Day 계산 및 영수증 OCR 스캔을 담당합니다.

#### 엔드포인트 목록 요약
| HTTP Method | 엔드포인트 | 설명 | 인증 |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/inventory/master-ingredients` | 표준 식재료 마스터 검색 및 카테고리 조회 | 필수 |
| `GET` | `/api/v1/inventory` | 내 냉장고 식재료 목록 조회 (SQL 실시간 D-Day 연산) | 필수 |
| `POST` | `/api/v1/inventory` | 신규 식재료 수동 등록 | 필수 |
| `PUT` | `/api/v1/inventory/{ingredientId}` | 식재료 전체 정보 수정 (소유권 검증) | 필수 |
| `PATCH` | `/api/v1/inventory/{ingredientId}/consume` | 식재료 수동 소비 처리 (클램핑 & CONSUMED 전이) | 필수 |
| `DELETE` | `/api/v1/inventory/{ingredientId}` | 식재료 삭제 (status = 'DELETED' 소프트 삭제) | 필수 |
| `POST` | `/api/v1/inventory/scan-ocr` | 마트 영수증 OCR 제로샷 분석 (Gemini Flash Lite 프록시) | 필수 |

---

#### 1. 내 냉장고 식재료 목록 조회
- **Method**: `GET`
- **URL**: `/api/v1/inventory`
- **Query Parameters**:
  - `storageType`: `REFRIGERATED` (냉장), `FROZEN` (냉동), `ROOM_TEMP` (실온) (선택)
  - `categoryId`: 식재료 카테고리 ID (선택)
  - `query`: 재료명/메모 검색어 (선택)
- **비즈니스 규칙**:
  - `dDay`는 서버 메모리가 아닌 PostgreSQL SQL(`expire_date - CURRENT_DATE`)로 실시간 연산하여 반환합니다.

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "ingredientId": 10,
      "masterIngredientId": 2,
      "categoryId": 2,
      "name": "계란",
      "storageType": "REFRIGERATED",
      "quantity": 10.00,
      "unit": "개",
      "expireDate": "2026-11-05",
      "dDay": 4,
      "memo": "무항생제 신선란"
    }
  ],
  "message": "성공적으로 처리되었습니다."
}
```

---

#### 2. 신규 식재료 수동 등록
- **Method**: `POST`
- **URL**: `/api/v1/inventory`

**Request Body**
```json
{
  "masterIngredientId": 2,
  "categoryId": 2,
  "name": "계란",
  "storageType": "REFRIGERATED",
  "quantity": 10.00,
  "unit": "개",
  "expireDate": "2026-11-05",
  "memo": "무항생제 신선란"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "ingredientId": 11,
    "name": "계란",
    "quantity": 10.00,
    "unit": "개",
    "expireDate": "2026-11-05"
  },
  "message": "식재료가 성공적으로 등록되었습니다."
}
```

---

#### 3. 식재료 수동 소비 처리
- **Method**: `PATCH`
- **URL**: `/api/v1/inventory/{ingredientId}/consume`
- **비즈니스 규칙**:
  - `consumeQuantity` 생략 시 잔여 수량 전체를 소비 처리합니다.
  - 잔여 수량이 `0`이 되면 `status = 'CONSUMED'`로 자동 전이됩니다.
  - 요청 수량이 보유 수량보다 크면 `Math.max(0, quantity - consumeQuantity)`로 안전하게 클램핑 처리됩니다.

**Request Body**
```json
{
  "consumeQuantity": 2.00
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "ingredientId": 10,
    "remainingQuantity": 8.00,
    "status": "ACTIVE"
  },
  "message": "식재료가 성공적으로 소비되었습니다."
}
```

---

#### 4. 영수증 OCR 스캔 및 AI 제로샷 추출
- **Method**: `POST`
- **URL**: `/api/v1/inventory/scan-ocr`
- **Content-Type**: `multipart/form-data`
- **비즈니스 규칙**:
  - 백엔드는 클라이언트에서 리사이즈된 영수증 이미지(최대 2MB)를 수신하여 Google Gemini 2.5 Flash Lite Vision API에 스트림 전달합니다.
  - 영수증 내 비정형 텍스트를 파싱하여 표준 규격 품목명, 수량, 단위, 추천 유통기한 JSON 배열을 반환합니다.
  - 스캔 실패 시 500 에러 대신 빈 배열 `data: []`를 반환하여 유저가 수동 입력 화면으로 매끄럽게 전환되도록 유도합니다.

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "masterIngredientId": 2,
      "name": "계란",
      "quantity": 10.00,
      "unit": "개",
      "recommendedExpireDate": "2026-11-15"
    },
    {
      "masterIngredientId": 15,
      "name": "감자",
      "quantity": 3.00,
      "unit": "개",
      "recommendedExpireDate": "2026-11-20"
    }
  ],
  "message": "영수증 식재료가 추출되었습니다."
}
```

---

### 모듈 3. 뚝딱 레시피 커뮤니티 API (`/api/v1/recipes`)

> 레시피 등록, 상세 조회, 검색, 필터링, 좋아요 및 스크랩 기능을 제공합니다.

#### 엔드포인트 목록 요약
| HTTP Method | 엔드포인트 | 설명 | 인증 |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/recipes/categories` | 레시피 카테고리 목록 조회 | 필수 |
| `GET` | `/api/v1/recipes` | 레시피 목록 검색/필터/정렬 페이징 조회 | 필수 |
| `GET` | `/api/v1/recipes/{recipeId}` | 레시피 상세 정보 및 조리 Step 조회 | 필수 |
| `POST` | `/api/v1/recipes` | 신규 레시피 등록 (Direct Upload 이미지 URL 연동) | 필수 |
| `PUT` | `/api/v1/recipes/{recipeId}` | 본인 작성 레시피 수정 (소유권 검증) | 필수 |
| `DELETE` | `/api/v1/recipes/{recipeId}` | 본인 작성 레시피 삭제 (소유권 검증) | 필수 |
| `POST` | `/api/v1/recipes/{recipeId}/like` | 레시피 좋아요 토글 (Toggle) | 필수 |
| `POST` | `/api/v1/recipes/{recipeId}/scrap` | 레시피 북마크 스크랩 토글 (Toggle) | 필수 |

---

#### 1. 레시피 상세 조회
- **Method**: `GET`
- **URL**: `/api/v1/recipes/{recipeId}`

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "recipeId": 1,
    "recipeCategoryId": 4,
    "categoryName": "한그릇/밥",
    "title": "계란볶음밥",
    "description": "찬밥과 계란으로 5분 만에 만드는 초간단 볶음밥",
    "servings": 1,
    "cookingTime": 15,
    "difficulty": "쉬움",
    "likeCount": 12,
    "cookedCount": 5,
    "isLiked": false,
    "isScrapped": true,
    "authorNickname": "자취셰프",
    "authorTag": "1024",
    "ingredients": [
      {
        "recipeIngId": 101,
        "masterIngredientId": 2,
        "altIngredientId": null,
        "name": "계란",
        "quantity": 2.00,
        "unit": "개",
        "typeCode": "MAIN",
        "isOptional": false
      },
      {
        "recipeIngId": 102,
        "masterIngredientId": 50,
        "altIngredientId": null,
        "name": "식용유",
        "quantity": 1.00,
        "unit": "스푼",
        "typeCode": "SEASONING",
        "isOptional": false
      }
    ],
    "steps": [
      {
        "stepNo": 1,
        "description": "달군 팬에 식용유를 두르고 파를 볶아 기름을 냅니다.",
        "imageUrl": "https://.../recipes/step_1.webp"
      },
      {
        "stepNo": 2,
        "description": "계란 2개를 풀어 스크램블을 만든 후 밥과 함께 볶습니다.",
        "imageUrl": "https://.../recipes/step_2.webp"
      }
    ]
  },
  "message": "성공적으로 처리되었습니다."
}
```

---

#### 2. 레시피 신규 등록
- **Method**: `POST`
- **URL**: `/api/v1/recipes`
- **비즈니스 규칙**:
  - 썸네일 및 Step 이미지는 클라이언트가 Supabase Storage `/recipes` 버킷에 사전 직접 업로드(Direct Upload)한 Public URL 문자열만 전송합니다.

**Request Body**
```json
{
  "recipeCategoryId": 4,
  "title": "계란볶음밥",
  "description": "5분 만에 만드는 초간단 볶음밥",
  "servings": 1,
  "cookingTime": 15,
  "difficulty": "쉬움",
  "thumbnailUrl": "https://.../recipes/egg_rice_thumb.webp",
  "ingredients": [
    {
      "masterIngredientId": 2,
      "categoryId": 2,
      "name": "계란",
      "quantity": 2.00,
      "unit": "개",
      "typeCode": "MAIN",
      "isOptional": false
    }
  ],
  "steps": [
    {
      "stepNo": 1,
      "description": "달군 팬에 계란을 볶습니다.",
      "imageUrl": "https://.../recipes/step1.webp"
    }
  ]
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "recipeId": 2,
    "title": "계란볶음밥"
  },
  "message": "레시피가 성공적으로 등록되었습니다."
}
```

---

### 모듈 4. 스마트 레시피 매칭 & 요리완료 API (`/api/v1/matching`)

> 사용자의 냉장고 재고를 기반으로 최적의 레시피를 추천하고, 조리 완료 시 선입선출(FIFO) 차감을 처리합니다.

#### 엔드포인트 목록 요약
| HTTP Method | 엔드포인트 | 설명 | 인증 |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/matching/recommendations` | 냉장고 기반 스마트 2-Tier 매칭 레시피 추천 피드 | 필수 |
| `POST` | `/api/v1/matching/cook/{recipeId}` | 3-Way 요리 완료 및 선입선출(FIFO) 자동 차감 | 필수 |

---

#### 1. 냉장고 기반 맞춤 레시피 추천
- **Method**: `GET`
- **URL**: `/api/v1/matching/recommendations`
- **Query Parameters**:
  - `recipeCategoryId`: 카테고리 필터 (선택)
  - `page`: 페이지 번호 (기본값 `0`)
  - `size`: 페이지 크기 (기본값 `10`)
- **비즈니스 규칙**:
  - 냉장고 보유 재료와 레시피 필요 재료를 실시간 연산하여 `matchingRate`(0~100%)를 산출합니다.
  - 소비기한 임박 재료(D-0 ~ D-3)가 포함된 레시피에는 가산점을 부여하여 상단에 노출합니다.

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "recipeId": 1,
      "title": "계란볶음밥",
      "matchingRate": 100,
      "matchIngredients": ["계란", "식용유"],
      "missingIngredients": []
    },
    {
      "recipeId": 5,
      "title": "감자채전",
      "matchingRate": 75,
      "matchIngredients": ["감자"],
      "missingIngredients": ["부침가루"]
    }
  ],
  "message": "성공적으로 처리되었습니다."
}
```

---

#### 2. 요리 완료 및 선입선출(FIFO) 차감
- **Method**: `POST`
- **URL**: `/api/v1/matching/cook/{recipeId}`
- **비즈니스 규칙 (`INV-01 / REC-02`)**:
  - `deductInventory = true`인 경우, 유통기한이 가장 빠른 재료부터 차감됩니다.
  - **양념/소스 제외**: `SEASONING` 타입의 재료는 차감 대상에서 자동 제외되어 보존됩니다.
  - 잔여 수량이 `0` 이하가 되면 `status = 'CONSUMED'`로 자동 전이됩니다.
  - 조리 완료 카운트(`cooked_count`)가 1 증가합니다.

**Request Body**
```json
{
  "deductInventory": true,
  "servings": 1
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "recipeId": 1,
    "isDeducted": true,
    "cookedCount": 6,
    "deductedIngredients": [
      {
        "name": "계란",
        "deductedQuantity": 2.00,
        "remainingQuantity": 8.00
      }
    ]
  },
  "message": "요리가 완료되었으며 냉장고 재료가 차감되었습니다."
}
```

---

### 모듈 5. 알림 센터 API (`/api/v1/notifications`)

> 소비기한 임박 알림, 소셜 인터랙션 알림(좋아요/요리완료) 및 방해금지 시간 관리를 담당합니다.

#### 엔드포인트 목록 요약
| HTTP Method | 엔드포인트 | 설명 | 인증 |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/notifications` | 알림 목록 및 미읽음 카운트 조회 (`idx_notification_user_created`) | 필수 |
| `PATCH` | `/api/v1/notifications/{notificationId}/read` | 단일 알림 읽음 처리 | 필수 |
| `PATCH` | `/api/v1/notifications/read-all` | 모든 알림 일괄 읽음 처리 | 필수 |
| `DELETE` | `/api/v1/notifications/{notificationId}` | 단일 알림 삭제 | 필수 |
| `DELETE` | `/api/v1/notifications/all` | 모든 알림 일괄 삭제 | 필수 |
| `PATCH` | `/api/v1/notifications/settings` | 알림 수신 토글 및 방해금지 시간 통합 설정 | 필수 |

---

#### 1. 알림 목록 조회
- **Method**: `GET`
- **URL**: `/api/v1/notifications`
- **비즈니스 규칙**:
  - `unreadCount` 및 `hasUnread`를 반환하여 상단 종 아이콘의 Red Dot을 제어합니다.
  - 본인 액션(자추) 알림은 백엔드에서 사전 필터링되어 생성되지 않습니다.

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "unreadCount": 1,
    "hasUnread": true,
    "notifications": [
      {
        "notificationId": 45,
        "type": "EXPIRE_WARN",
        "title": "소비기한 임박 알림",
        "content": "계란의 소비기한이 2일 남았습니다. 서둘러 뚝딱 요리해 보세요!",
        "targetId": 10,
        "isRead": false,
        "createdAt": "2026-11-01T09:00:00"
      }
    ]
  },
  "message": "성공적으로 처리되었습니다."
}
```

---

#### 2. 알림 설정 및 방해금지 시간 수정
- **Method**: `PATCH`
- **URL**: `/api/v1/notifications/settings`

**Request Body**
```json
{
  "isExpireWarnEnabled": true,
  "isReactionNoticeEnabled": true,
  "quietTimeStart": "22:00:00",
  "quietTimeEnd": "08:00:00"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "isExpireWarnEnabled": true,
    "isReactionNoticeEnabled": true,
    "quietTimeStart": "22:00:00",
    "quietTimeEnd": "08:00:00"
  },
  "message": "알림 설정이 저장되었습니다."
}
```

---

### 모듈 6. 메인 홈 브리핑 API (`/api/v1/home`)

> 앱 메인 대시보드 진입 시 필요한 닉네임, 소비기한 임박 재료 요약, 오늘의 추천 레시피를 단일 요청으로 일괄 반환합니다.

#### 엔드포인트 목록 요약
| HTTP Method | 엔드포인트 | 설명 | 인증 |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/home/briefing` | 메인 홈 종합 대시보드 브리핑 정보 조회 | 필수 |

---

#### 1. 메인 화면 종합 브리핑 조회
- **Method**: `GET`
- **URL**: `/api/v1/home/briefing`
- **비즈니스 규칙**:
  - `expiringIngredientsCount`는 소비기한이 0~3일 이내(`0 <= D-Day <= 3`)인 신선 재료만 집계합니다.
  - **신규/재료 0개 유저 폴백**: 등록된 재료가 없는 유저의 경우 `expiringIngredientsCount: 0`, `imminentIngredients: []`와 함께 커뮤니티 최고 인기 레시피 1건(`matchingRate: 0`)을 안전하게 폴백 노출합니다.

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "nickname": "뚝딱이",
    "expiringIngredientsCount": 1,
    "imminentIngredients": [
      {
        "ingredientId": 10,
        "name": "계란",
        "dDay": 2
      }
    ],
    "topRecipe": {
      "recipeId": 1,
      "title": "계란볶음밥",
      "matchingRate": 100
    }
  },
  "message": "성공적으로 처리되었습니다."
}
```

---

## 4. 백엔드 에러 코드 표준 일람표

| 에러 코드 | HTTP 상태 | UX 태그 | 발생 원인 및 설명 |
| :--- | :---: | :---: | :--- |
| `AUTH_WARN_INVALID_TOKEN` | 401 | `_WARN_` | 유효하지 않거나 만료된 Supabase JWT 토큰 |
| `AUTH_WARN_UNAUTHORIZED` | 401 | `_WARN_` | 인증 정보 누락 |
| `USER_FIELD_DUPLICATE_NICKNAME` | 400 | `_FIELD_` | 닉네임 중복 입력 |
| `USER_WARN_NOT_FOUND` | 404 | `_WARN_` | 존재하지 않는 유저 프로필 조회 |
| `INV_FIELD_INVALID_QUANTITY` | 400 | `_FIELD_` | 식재료 수량이 0 이하인 경우 |
| `INV_WARN_NOT_FOUND` | 404 | `_WARN_` | 식재료가 없거나 타인 소유 재료 조작 시도 |
| `INV_WARN_INSUFFICIENT_STOCK` | 400 | `_WARN_` | 소비 차감 요청 수량이 보유 수량을 초과한 경우 |
| `RECIPE_WARN_NOT_FOUND` | 404 | `_WARN_` | 존재하지 않는 레시피 조회 |
| `RECIPE_WARN_FORBIDDEN` | 403 | `_WARN_` | 타인 작성 레시피의 수정/삭제 시도 |
| `MATCH_WARN_NO_INGREDIENTS` | 400 | `_WARN_` | 냉장고에 활성 재료가 없어 매칭 불가 |
| `SYS_ERROR_INTERNAL_SERVER` | 500 | `_ERROR_` | 서버 내부 알 수 없는 예외 발생 (`X-Trace-Id` 대조 필요) |

---

<div align="center">

**오늘의 뚝딱 (Dduktak) REST API 명세서 — Enterprise Standard Specification**  
Document Version: 2.1 | Last Updated: 2026-11-01

</div>
