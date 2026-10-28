### 📄 [기획/요구사항 정의서] 냉장고 파먹기 & 레시피 매칭 앱 (가제: 오늘의 뚝딱)
#### 1. 프로젝트 개요
*   **프로젝트명** : 냉장고 파먹기 & 레시피 매칭 플랫폼
*   **개발 형태** : 개인 프로젝트 (1인 개발)
*   **주요 목표** :
1. 식재료 관리 유통기한 D-Day 추적 및 알림을 통한 잔반 최소화
2. 보유 중인 식재료 기반의 최적 레시피 추천을 통한 식비 절감
3. 유저 간 레시피 공유 커뮤니티 생태계 구축
*   **기술 스택** :
*   **Frontend** : React (Vercel 배포)
*   **Backend** : Spring Boot 3.x (Render 배포)
*   **Database/Infra** : Supabase (PostgreSQL, Auth, Storage)

--------------------------------------------------------------------------------

#### 2. 시스템 아키텍처 & 데이터 흐름
```text
[React Client (Vercel)] ──(CORS / API)──> [Spring Boot Server (Render)]
         │                                       │
         ├──(Direct SDK)──> [Supabase] <──────────┘
         │                   ├── Auth (Social Login)
         │                   ├── Storage (Images)
         │                   └── PostgreSQL (Data)
         └─(Camera)───────> [Receipt OCR Scan]


```

--------------------------------------------------------------------------------

#### 3. 기능 요구사항 (Functional Requirements)
##### 3.1. 회원 및 인증 (Auth)
| ID | 기능명 | 상세 설명 | 우선순위 |
| ------ | ------ | ------ | ------ |
| **AUTH-01** | 소셜 로그인 | Supabase Auth를 활용한 Google 간편 로그인 및 JWT 발급 | **MVP** |
| **AUTH-02** | 프로필 관리 | 닉네임, 프로필 이미지(Supabase Storage) 설정 및 수정 | **MVP** |

##### 3.2. 내 냉장고 관리 (Refrigerator)
| ID | 기능명 | 상세 설명 | 우선순위 |
| ------ | ------ | ------ | ------ |
| **REF-01** | 재료 직접 등록 | 재료명, 수량, 보관장소(냉장/냉동/실온), 유통기한 수동 입력 | **MVP** |
| **REF-02** | 카테고리 자동 세팅 | 재료 키워드 감지 후 카테고리 매칭 및  **기본 권장 유통기한(오늘+N일) 자동 제안** | **MVP** |
| **REF-04** | 퀵 선택(Quick Pick) | 자주 쓰는 식재료(계란, 대파, 양파 등) 태그 클릭 시 1초 만에 등록 | **MVP** |
| **REF-05** | 재료 목록 조회/필터 | 보관장소별, 유통기한 임박순 정렬 및 검색 | **MVP** |
| **REF-06** | 영수증 OCR 파싱 | 영수증 사진 업로드 ➔ OCR API 텍스트 추출 ➔ 정규식을 통한 재료명 자동 발췌 등록 | Phase 2 |

##### 3.3. 레시피 커뮤니티 (Recipe Board)
| ID | 기능명 | 상세 설명 | 우선순위 |
| ------ | ------ | ------ | ------ |
| **RCP-01** | 레시피 등록 | 제목, 설명, 대표 이미지, 조리 순서,  **필요 재료 구분(주재료/부재료)**  작성 | **MVP** |
| **RCP-02** | 레시피 목록/상세 | 작성된 레시피 상세 조회, 작성자 정보 표시 | **MVP** |
| **RCP-03** | 북마크/좋아요 | 관심 있는 레시피 저장 및 좋아요 기능 | Phase 2 |

##### 3.4. 레시피 매칭 알고리즘 (Matching Engine)
| ID | 기능명 | 상세 설명 | 우선순위 |
| ------ | ------ | ------ | ------ |
| **ALG-01** | 재료 매칭률 계산 | (보유 재료 ∩ 레시피 필요 재료) / 레시피 전체 필요 재료 * 100 산출 | **MVP** |
| **ALG-02** | 주재료 가중치 산정 | 부재료보다 주재료 보유 여부에 가중치 부여하여 정렬 | **MVP** |
| **ALG-03** | 유통기한 임박 우선순위 | 유통기한 D-3 이내인 보유 재료가 포함된 레시피 상단 배치 | **MVP** |

##### 3.5. 스케줄러 & 알림 (Scheduler & Notification)
| ID | 기능명 | 상세 설명 | 우선순위 |
| ------ | ------ | ------ | ------ |
| **NOTI-01** | D-Day 스케줄러 | Spring Scheduler로 매일 09시 유통기한 임박(D-3, D-1) 재료 조회 | **MVP** |
| **NOTI-02** | 알림 발송 | 이메일 또는 푸시 알림(FCM)으로 임박 재료 및 추천 레시피 알림 발송 | **MVP** |


--------------------------------------------------------------------------------

#### 4. 비기능 요구사항 (Non-Functional Requirements)
*   **성능 (Performance)** :
*  영수증 OCR 분석 및 재료 추출 응답 시간  **3초 이내** .
*  레시피 매칭 알고리즘 쿼리/로직 실행 시간  **500ms 이내** .
*   **사용성 (Usability)** :
*  모바일 웹 환경을 최우선으로 고려한 반응형 UI/UX (PWA 지원 고려).
*  직접 입력/영수증 스캔 시 클릭 횟수 최소화.
*   **비용 절감 (Cost Efficiency)** :
*  무료 쿼터 범위 내 운영 (Supabase Free Tier, Render Free Tier, Vercel Free Tier).
*  OCR/외부 API 최소화를 통한 비용 지출 방지.

--------------------------------------------------------------------------------

#### 5. 데이터베이스 개략 설계 (Supabase PostgreSQL)
```sql
-- 1. 카테고리 마스터
CREATE TABLE category_master (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- 예: 유제품, 신선채소, 육류
    default_shelf_life_days INT NOT NULL -- 기본 권장 유통기한 (일)
);

-- 2. 내 냉장고
CREATE TABLE user_refrigerator (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- Supabase Auth User ID
    ingredient_name VARCHAR(100) NOT NULL,
    category_id BIGINT REFERENCES category_master(id),
    storage_type VARCHAR(20) CHECK (storage_type IN ('REFRIGERATED', 'FROZEN', 'ROOM_TEMP')),
    expiration_date DATE NOT NULL,
    quantity VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 레시피
CREATE TABLE recipe (
    id BIGSERIAL PRIMARY KEY,
    author_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 레시피 필요 재료 (N:M 관계 해소)
CREATE TABLE recipe_ingredient (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT REFERENCES recipe(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(100) NOT NULL,
    is_main_ingredient BOOLEAN DEFAULT true -- 주재료 여부 (가중치 계산용)
);


```
