```sql

-- ==========================================
-- 오늘의 뚝딱 (Dduktak) Supabase PostgreSQL DDL (최종 확정본)
-- DB Version: PostgreSQL 15+
-- Naming Rule: snake_case
-- ==========================================

DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS scrap CASCADE;
DROP TABLE IF EXISTS recipe_like CASCADE;
DROP TABLE IF EXISTS recipe_step CASCADE;
DROP TABLE IF EXISTS recipe_ingredient CASCADE;
DROP TABLE IF EXISTS recipe CASCADE;
DROP TABLE IF EXISTS recipe_category CASCADE;
DROP TABLE IF EXISTS user_ingredient CASCADE;
DROP TABLE IF EXISTS ingredient_master CASCADE;
DROP TABLE IF EXISTS ingredient_category CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ------------------------------------------
-- 1. 회원 테이블 (users)
-- ------------------------------------------
CREATE TABLE users (
    user_id          BIGSERIAL PRIMARY KEY,
    email            VARCHAR(100) NOT NULL UNIQUE,
    password         VARCHAR(255),
    nickname         VARCHAR(50)  NOT NULL,
    user_tag         VARCHAR(4)   NOT NULL,
    profile_image    VARCHAR(500),
    provider         VARCHAR(20)  DEFAULT 'EMAIL' NOT NULL,
    provider_id      VARCHAR(100),
    quiet_time_start TIME         DEFAULT '21:00:00',
    quiet_time_end   TIME         DEFAULT '08:00:00',
    created_at       TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
    updated_at       TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_user_nickname_tag UNIQUE (nickname, user_tag)
);

-- ------------------------------------------
-- 2. 식재료 카테고리 테이블 (ingredient_category)
-- ------------------------------------------
CREATE TABLE ingredient_category (
    category_id             BIGSERIAL PRIMARY KEY,
    category_name           VARCHAR(50) NOT NULL UNIQUE,
    default_shelf_life_days INT DEFAULT 7 NOT NULL,
    is_sauce                BOOLEAN DEFAULT FALSE NOT NULL
);

INSERT INTO ingredient_category (category_name, default_shelf_life_days, is_sauce) VALUES
('채소/과일', 7, FALSE),
('정육/계란', 3, FALSE),
('수산/해산물', 2, FALSE),
('유제품/시리얼', 14, FALSE),
('가공식품/냉동', 30, FALSE),
('양념/소스/조미료', 180, TRUE);

-- ------------------------------------------
-- 3. 마스터 표준 식재료 테이블 (ingredient_master)
-- ------------------------------------------
CREATE TABLE ingredient_master (
    master_ingredient_id BIGSERIAL PRIMARY KEY,
    category_id          BIGINT NOT NULL,
    name                 VARCHAR(100) NOT NULL UNIQUE,
    default_unit         VARCHAR(20) DEFAULT '개',
    default_shelf_days   INT,
    created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_master_ing_category FOREIGN KEY (category_id) REFERENCES ingredient_category(category_id) ON DELETE CASCADE
);

-- ------------------------------------------
-- 4. 내 냉장고 재료 테이블 (user_ingredient)
-- ------------------------------------------
CREATE TABLE user_ingredient (
    ingredient_id        BIGSERIAL PRIMARY KEY,
    user_id              BIGINT NOT NULL,
    master_ingredient_id BIGINT NOT NULL,
    category_id          BIGINT NOT NULL,
    name                 VARCHAR(100) NOT NULL,
    storage_type         VARCHAR(20) DEFAULT 'REFRIGERATED' NOT NULL 
                         CHECK (storage_type IN ('REFRIGERATED', 'FROZEN', 'ROOM_TEMP')),
    quantity             NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    unit                 VARCHAR(20) DEFAULT '개',
    expire_date          DATE NOT NULL,
    created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_user_ing_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_ing_master FOREIGN KEY (master_ingredient_id) REFERENCES ingredient_master(master_ingredient_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_ing_category FOREIGN KEY (category_id) REFERENCES ingredient_category(category_id) ON DELETE CASCADE
);

-- ------------------------------------------
-- 5. 레시피 카테고리 테이블 (recipe_category)
-- ------------------------------------------
CREATE TABLE recipe_category (
    recipe_category_id BIGSERIAL PRIMARY KEY,
    category_name      VARCHAR(50) NOT NULL UNIQUE,
    display_order      INT DEFAULT 0 NOT NULL,
    created_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

INSERT INTO recipe_category (category_name, display_order) VALUES
('국/찌개/탕', 1),
('메인반찬', 2),
('밑반찬', 3),
('한그릇/밥', 4),
('면/만두', 5),
('간식/디저트', 6),
('안주/야식', 7),
('기타', 8)
ON CONFLICT (category_name) DO NOTHING;

-- ------------------------------------------
-- 6. 레시피 커뮤니티 테이블 (recipe)
-- ------------------------------------------
CREATE TABLE recipe (
    recipe_id          BIGSERIAL PRIMARY KEY,
    user_id            BIGINT,
    recipe_category_id BIGINT NOT NULL,
    title              VARCHAR(150) NOT NULL,
    description        TEXT,
    servings           INT DEFAULT 1 NOT NULL,
    cooking_time       INT NOT NULL,
    difficulty         VARCHAR(20) NOT NULL,
    thumbnail_url      VARCHAR(500),
    like_count         INT DEFAULT 0 NOT NULL,
    cooked_count       INT DEFAULT 0 NOT NULL,
    created_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_recipe_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_recipe_category FOREIGN KEY (recipe_category_id) REFERENCES recipe_category(recipe_category_id) ON DELETE RESTRICT
);

-- ------------------------------------------
-- 7. 레시피 구성 재료 테이블 (recipe_ingredient)
-- ------------------------------------------
CREATE TABLE recipe_ingredient (
    recipe_ing_id        BIGSERIAL PRIMARY KEY,
    recipe_id            BIGINT NOT NULL,
    master_ingredient_id BIGINT NOT NULL,
    alt_ingredient_id    BIGINT,
    category_id          BIGINT NOT NULL,
    name                 VARCHAR(100) NOT NULL,
    quantity             NUMERIC(5, 2) NOT NULL,
    unit                 VARCHAR(20) DEFAULT '개',
    type_code            VARCHAR(10) NOT NULL CHECK (type_code IN ('MAIN', 'SUB')),
    is_optional          BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT fk_recipe_ing_recipe FOREIGN KEY (recipe_id) REFERENCES recipe(recipe_id) ON DELETE CASCADE,
    CONSTRAINT fk_recipe_ing_master FOREIGN KEY (master_ingredient_id) REFERENCES ingredient_master(master_ingredient_id) ON DELETE CASCADE,
    CONSTRAINT fk_recipe_ing_alt FOREIGN KEY (alt_ingredient_id) REFERENCES ingredient_master(master_ingredient_id) ON DELETE SET NULL,
    CONSTRAINT fk_recipe_ing_category FOREIGN KEY (category_id) REFERENCES ingredient_category(category_id) ON DELETE CASCADE
);

-- ------------------------------------------
-- 8. 레시피 조리 순서 테이블 (recipe_step)
-- ------------------------------------------
CREATE TABLE recipe_step (
    step_id     BIGSERIAL PRIMARY KEY,
    recipe_id   BIGINT NOT NULL,
    step_no     INT NOT NULL,
    description TEXT NOT NULL,
    image_url   VARCHAR(500),
    CONSTRAINT fk_step_recipe FOREIGN KEY (recipe_id) REFERENCES recipe(recipe_id) ON DELETE CASCADE,
    CONSTRAINT uq_recipe_step_no UNIQUE (recipe_id, step_no)
);

-- ------------------------------------------
-- 9. 좋아요, 스크랩, 알림 테이블
-- ------------------------------------------
CREATE TABLE recipe_like (
    user_id    BIGINT NOT NULL,
    recipe_id  BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, recipe_id),
    CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_like_recipe FOREIGN KEY (recipe_id) REFERENCES recipe(recipe_id) ON DELETE CASCADE
);

CREATE TABLE scrap (
    user_id    BIGINT NOT NULL,
    recipe_id  BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, recipe_id),
    CONSTRAINT fk_scrap_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_scrap_recipe FOREIGN KEY (recipe_id) REFERENCES recipe(recipe_id) ON DELETE CASCADE
);

CREATE TABLE notification (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    type            VARCHAR(30) NOT NULL,
    title           VARCHAR(100) NOT NULL,
    content         TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT FALSE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ==========================================
-- 10. 성능 최적화 인덱스 (Indexes)
-- ==========================================
CREATE INDEX idx_user_ing_expire ON user_ingredient (user_id, expire_date ASC);
CREATE INDEX idx_user_ing_storage ON user_ingredient (user_id, storage_type);
CREATE INDEX idx_recipe_ing_matching ON recipe_ingredient (recipe_id, master_ingredient_id, type_code);
CREATE INDEX idx_recipe_category_created ON recipe (recipe_category_id, created_at DESC);
CREATE INDEX idx_recipe_category_display ON recipe_category (display_order ASC);
CREATE INDEX idx_notification_user_read ON notification (user_id, is_read, created_at DESC);
```
