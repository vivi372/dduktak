# PostgreSQL 데이터베이스 스키마 명세서 (04_DATABASE_SCHEMA.md)

## 1. 개요

본 문서는 '오늘의 뚝딱' 프로젝트의 Supabase PostgreSQL 15+ 데이터베이스 스키마 및 DDL을 정의한다.
Supabase Auth의 내장 회원 테이블(`auth.users`, UUID)과 연동되는 `public.profiles` (회원 프로필) 구조를 채택하여, OAuth 소셜 로그인, 이메일 인증, 비밀번호 재설정 등의 보안 기능을 Supabase Auth 인프라와 완벽히 통합한다.

---

## 2. 테이블 목록 요약

| No  | 테이블명 (Physical)   | 논리 테이블명 (Logical) | 설명 및 핵심 정책                                                                 |
| :-: | :-------------------- | :---------------------- | :-------------------------------------------------------------------------------- |
|  -  | `auth.users`          | Supabase 인증 회원      | Supabase Auth 내장 테이블 (UUID PK, 이메일, 암호화 비밀번호, OAuth 메타데이터)    |
|  1  | `public.profiles`     | 회원 프로필             | `auth.users(id)`와 1:1 매핑 (UUID PK), 닉네임, 유저태그, 프로필 이미지, 알림 설정 |
|  2  | `ingredient_category` | 식재료 카테고리         | 6개 표준 식재료 카테고리 (양념/소스 차감 제외 여부 포함)                          |
|  3  | `ingredient_master`   | 표준 식재료 마스터      | 검색/선택용 표준 재료, 기본 단위 및 권장 소비기한                                 |
|  4  | `user_ingredient`     | 내 냉장고 식재료        | 유저별 냉장고 재료 (`user_id UUID`, 독립 레코드 저장, memo 표시용 메모/별칭)      |
|  5  | `recipe_category`     | 레시피 카테고리         | 8개 고정 레시피 카테고리                                                          |
|  6  | `recipe`              | 뚝딱 레시피 마스터      | 레시피 기본 정보, 작성자 익명 보존 (`user_id UUID NULL`)                          |
|  7  | `recipe_ingredient`   | 레시피 필요 재료        | 주재료(MAIN) / 부재료(SUB) 구분 및 대체재료                                       |
|  8  | `recipe_step`         | 레시피 조리 순서        | Step별 설명 및 이미지 URL                                                         |
|  9  | `recipe_like`         | 레시피 좋아요           | 유저-레시피 좋아요 매핑 (`user_id UUID`)                                          |
| 10  | `recipe_scrap`        | 레시피 스크랩           | 유저별 즐겨찾기/스크랩 매핑 (`user_id UUID`)                                      |
| 11  | `notification`        | 알림 센터               | 소비기한 임박 및 시스템 알림 (`user_id UUID`)                                     |

---

## 3. DDL 스크립트 (PostgreSQL 15+)

```sql
-- ========================================================
-- [참고] Supabase Auth 내장 테이블 구조 (auth.users)
-- ========================================================
-- Supabase Auth가 자동 관리하는 테이블 (직접 CREATE 금지)
-- 주요 컬럼: id (UUID PK), email, encrypted_password, phone, raw_app_meta_data, raw_user_meta_data, created_at, last_sign_in_at 등

-- ========================================================
-- 1. 회원 프로필 테이블 (public.profiles)
-- ========================================================
-- 기존 public.users 대체: auth.users(id)를 외래키(PK)로 참조하는 1:1 프로필 테이블
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(30) NOT NULL,
    user_tag VARCHAR(10) NOT NULL,
    profile_image TEXT,
    quiet_time_start TIME DEFAULT '21:00:00',
    quiet_time_end TIME DEFAULT '08:00:00',
    is_expire_warn_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_reaction_notice_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_profiles_nickname_tag UNIQUE (nickname, user_tag)
);

-- ========================================================
-- [지연 프로필 생성 아키텍처 (Lazy Profile Initialization)]
-- ========================================================
-- DB PL/pgSQL 트리거를 사용하지 않으며, 이메일 인증 승인 완료(또는 소셜 로그인) 후
-- 첫 로그인 시 백엔드(Spring Boot) 서비스가 public.profiles 레코드 존재 여부를 확인합니다.
-- 레코드가 없을 경우, auth.users.raw_user_meta_data를 읽어 백엔드 비즈니스 로직으로
-- 4자리 유저태그(#1024) 생성, 기본 캐릭터 세팅 및 알림 기본값을 부여하여 public.profiles를 안전하게 생성합니다.

-- ========================================================
-- 2. 식재료 카테고리 테이블 (ingredient_category)
-- ========================================================
CREATE TABLE ingredient_category (
    category_id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    is_sauce BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE일 경우 냉장고 차감 연산 및 충족률 계산 시 상시 100% 보유 처리
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 3. 표준 식재료 마스터 테이블 (ingredient_master)
-- ========================================================
CREATE TABLE ingredient_master (
    master_ingredient_id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES ingredient_category(category_id),
    name VARCHAR(50) NOT NULL UNIQUE,
    default_unit VARCHAR(20) NOT NULL DEFAULT '개',
    default_shelf_days INT NOT NULL DEFAULT 7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 4. 내 냉장고 식재료 테이블 (user_ingredient)
-- ========================================================
CREATE TABLE user_ingredient (
    ingredient_id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    master_ingredient_id BIGINT NOT NULL REFERENCES ingredient_master(master_ingredient_id),
    category_id BIGINT NOT NULL REFERENCES ingredient_category(category_id),
    name VARCHAR(50) NOT NULL,
    storage_type VARCHAR(20) NOT NULL CHECK (storage_type IN ('REFRIGERATED', 'FROZEN', 'ROOM_TEMP')),
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(20) NOT NULL DEFAULT '개',
    expire_date DATE NOT NULL,
    memo VARCHAR(30), -- 표시용 메모/별칭 (예: "편의점 1+1", "엄마표 김치")
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CONSUMED', 'DELETED', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 5. 레시피 카테고리 테이블 (recipe_category)
-- ========================================================
CREATE TABLE recipe_category (
    recipe_category_id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 6. 뚝딱 레시피 마스터 테이블 (recipe)
-- ========================================================
CREATE TABLE recipe (
    recipe_id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- USER-02: 탈퇴 시 NULL 처리하여 익명 보존
    recipe_category_id BIGINT NOT NULL REFERENCES recipe_category(recipe_category_id),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    servings INT NOT NULL DEFAULT 1,
    cooking_time INT NOT NULL DEFAULT 15,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('쉬움', '보통', '조금복잡')),
    thumbnail_url TEXT,
    like_count INT NOT NULL DEFAULT 0,
    cooked_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 7. 레시피 필요 재료 테이블 (recipe_ingredient)
-- ========================================================
CREATE TABLE recipe_ingredient (
    recipe_ing_id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipe(recipe_id) ON DELETE CASCADE,
    master_ingredient_id BIGINT NOT NULL REFERENCES ingredient_master(master_ingredient_id),
    alt_ingredient_id BIGINT REFERENCES ingredient_master(master_ingredient_id),
    category_id BIGINT NOT NULL REFERENCES ingredient_category(category_id),
    name VARCHAR(50) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    type_code VARCHAR(10) NOT NULL CHECK (type_code IN ('MAIN', 'SUB')),
    is_optional BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 8. 레시피 조리 순서 테이블 (recipe_step)
-- ========================================================
CREATE TABLE recipe_step (
    step_id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipe(recipe_id) ON DELETE CASCADE,
    step_no INT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_recipe_step UNIQUE (recipe_id, step_no)
);

-- ========================================================
-- 9. 레시피 좋아요 테이블 (recipe_like)
-- ========================================================
CREATE TABLE recipe_like (
    like_id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipe_id BIGINT NOT NULL REFERENCES recipe(recipe_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_recipe_like UNIQUE (user_id, recipe_id)
);

-- ========================================================
-- 10. 레시피 스크랩 테이블 (recipe_scrap)
-- ========================================================
CREATE TABLE scrap (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipe_id BIGINT NOT NULL REFERENCES recipe(recipe_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, recipe_id)
);

-- ========================================================
-- 11. 알림 센터 테이블 (notification)
-- ========================================================
CREATE TABLE notification (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('EXPIRE_WARN', 'EXPIRE_D_DAY', 'SYSTEM')),
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 4. 성능 최적화 인덱스 (Indexes)

```sql
-- 1. 내 냉장고 FIFO 차감 및 D-Day 정렬 최적화 인덱스
CREATE INDEX idx_user_ingredient_fifo ON user_ingredient(user_id, status, expire_date ASC);
CREATE INDEX idx_user_ingredient_master ON user_ingredient(user_id, master_ingredient_id, status);

-- 2. 레시피 조회 및 정렬 최적화 인덱스
CREATE INDEX idx_recipe_category_sort ON recipe(recipe_category_id, created_at DESC);
CREATE INDEX idx_recipe_likes ON recipe(like_count DESC);
CREATE INDEX idx_recipe_cooked ON recipe(cooked_count DESC);

-- 3. 레시피 재료 조인 인덱스
CREATE INDEX idx_recipe_ingredient_recipe ON recipe_ingredient(recipe_id);
CREATE INDEX idx_recipe_ingredient_master ON recipe_ingredient(master_ingredient_id);

-- 4. 알림 안읽은 목록 조회 인덱스
CREATE INDEX idx_notification_user_read ON notification(user_id, is_read, created_at DESC);
```
