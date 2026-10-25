# 레시피 시드 데이터 (recipe_seed.md)

```sql
-- ==========================================
-- 오늘의 뚝딱 (Dduktak) 레시피 시드 데이터
-- 대상: 1인 가구 대표 한식 메뉴 30선 (기획서 8대 표준 카테고리 적용)
-- ==========================================

BEGIN;
-- ------------------------------------------
-- 0. 레시피 카테고리 시드 데이터 (recipe_category)
-- ------------------------------------------
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

-- ==========================================
-- 1. 버터 간장계란밥
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('버터 간장계란밥', '5분 컷, 자취생 영원한 기본 소울푸드', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '한그릇/밥'), 1, 5, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_1.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), master_ingredient_id, NULL, category_id, name, 1, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '밥 (공기밥 / 햇반)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), master_ingredient_id, NULL, category_id, name, 1, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '계란';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '진간장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), master_ingredient_id, NULL, category_id, name, 5, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '참기름';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '버터';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), 1, '따뜻한 밥을 그릇에 담고 가운데를 살짝 파낸 뒤 버터를 올려 녹입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), 2, '계란을 반숙이나 후라이로 구워 밥 위에 올립니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), 3, '진간장과 참기름을 기호에 맞게 넣고 가볍게 비벼 먹습니다.', NULL;

-- ==========================================
-- 2. 파기름 계란볶음밥
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('파기름 계란볶음밥', '파기름 + 굴소스 한 스푼으로 중화풍 감칠맛을 살린 볶음밥', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '한그릇/밥'), 1, 10, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_2.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '파기름 계란볶음밥'), master_ingredient_id, NULL, category_id, name, 1, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '밥 (공기밥 / 햇반)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '파기름 계란볶음밥'), master_ingredient_id, NULL, category_id, name, 2, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '계란';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '파기름 계란볶음밥'), master_ingredient_id, NULL, category_id, name, 0.5, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '파기름 계란볶음밥'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '식용유';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '파기름 계란볶음밥'), master_ingredient_id, NULL, category_id, name, 10, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '굴소스';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '파기름 계란볶음밥'), master_ingredient_id, NULL, category_id, name, 2, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '소금';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '파기름 계란볶음밥'), master_ingredient_id, NULL, category_id, name, 2, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '통깨 / 간깨';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '파기름 계란볶음밥'), 1, '팬에 식용유를 두르고 송송 썬 대파를 볶아 파기름을 냅니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '파기름 계란볶음밥'), 2, '파를 팬 한쪽으로 치우고 빈 공간에 계란을 풀어 스크램블 에그를 만듭니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '파기름 계란볶음밥'), 3, '밥을 넣고 주걱으로 으깨어가며 재료와 골고루 섞어줍니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '파기름 계란볶음밥'), 4, '팬 가장자리에 굴소스를 둘러 향을 입힌 뒤, 소금 간과 통깨를 뿌려 마무리합니다.', NULL;

-- ==========================================
-- 3. 스팸 김치볶음밥
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('스팸 김치볶음밥', '단짠 스팸과 신김치의 정석 조합', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '한그릇/밥'), 1, 15, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_3.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '스팸 김치볶음밥'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '스팸';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '스팸 김치볶음밥'), master_ingredient_id, NULL, category_id, name, 100, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '배추김치';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '스팸 김치볶음밥'), master_ingredient_id, NULL, category_id, name, 1, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '밥 (공기밥 / 햇반)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '스팸 김치볶음밥'), master_ingredient_id, NULL, category_id, name, 1, '개', 'SUB', TRUE FROM ingredient_master WHERE name = '계란';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '스팸 김치볶음밥'), master_ingredient_id, NULL, category_id, name, 0.3, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '스팸 김치볶음밥'), master_ingredient_id, NULL, category_id, name, 5, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '설탕';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '스팸 김치볶음밥'), master_ingredient_id, NULL, category_id, name, 5, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '참기름';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '스팸 김치볶음밥'), master_ingredient_id, NULL, category_id, name, 10, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '식용유';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '스팸 김치볶음밥'), 1, '스팸을 먹기 좋은 크기로 깍둑썰기하고, 대파는 송송 썹니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '스팸 김치볶음밥'), 2, '팬에 식용유를 두르고 대파와 스팸을 노릇하게 볶습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '스팸 김치볶음밥'), 3, '잘게 썬 김치와 설탕을 넣고 김치가 투명해질 때까지 함께 볶습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '스팸 김치볶음밥'), 4, '밥을 넣고 골고루 볶은 뒤, 참기름을 두르고 계란후라이를 올려 완성합니다.', NULL;

-- ==========================================
-- 4. 베이컨 마늘 볶음밥
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('베이컨 마늘 볶음밥', '베이컨 기름과 마늘 향, 굴소스로 볶아낸 고소한 볶음밥', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '한그릇/밥'), 1, 10, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_4.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 마늘 볶음밥'), master_ingredient_id, NULL, category_id, name, 0.5, '팩', 'MAIN', FALSE FROM ingredient_master WHERE name = '베이컨';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 마늘 볶음밥'), master_ingredient_id, NULL, category_id, name, 5, '쪽', 'MAIN', FALSE FROM ingredient_master WHERE name = '마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 마늘 볶음밥'), master_ingredient_id, NULL, category_id, name, 1, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '밥 (공기밥 / 햇반)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 마늘 볶음밥'), master_ingredient_id, NULL, category_id, name, 10, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '굴소스';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 마늘 볶음밥'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '버터';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 마늘 볶음밥'), master_ingredient_id, NULL, category_id, name, 5, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '식용유';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 마늘 볶음밥'), master_ingredient_id, NULL, category_id, name, 2, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '통깨 / 간깨';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 마늘 볶음밥'), 1, '편으로 썬 마늘과 잘게 썬 베이컨을 준비합니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 마늘 볶음밥'), 2, '팬에 식용유를 살짝 두르고 마늘을 볶아 마늘 향을 냅니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 마늘 볶음밥'), 3, '베이컨을 넣고 바삭해질 때까지 볶은 후, 밥과 굴소스를 넣고 잘 볶아줍니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 마늘 볶음밥'), 4, '마지막에 버터를 넣고 골고루 섞어 풍미를 더한 후 통깨를 뿌려 완성합니다.', NULL;

-- ==========================================
-- 5. 참치마요 덮밥
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('참치마요 덮밥', '참치캔, 계란 스크램블, 마요네즈의 초간단 조합', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '한그릇/밥'), 1, 10, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_5.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치마요 덮밥'), master_ingredient_id, NULL, category_id, name, 1, '캔', 'MAIN', FALSE FROM ingredient_master WHERE name = '참치캔';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치마요 덮밥'), master_ingredient_id, NULL, category_id, name, 1, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '밥 (공기밥 / 햇반)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치마요 덮밥'), master_ingredient_id, NULL, category_id, name, 2, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '계란';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치마요 덮밥'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치마요 덮밥'), master_ingredient_id, NULL, category_id, name, 20, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '마요네즈';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치마요 덮밥'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '진간장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치마요 덮밥'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '설탕';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치마요 덮밥'), master_ingredient_id, NULL, category_id, name, 10, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '맛술 (미림)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치마요 덮밥'), master_ingredient_id, NULL, category_id, name, 10, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '식용유';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치마요 덮밥'), 1, '양파는 얇게 채 썰고, 참치캔은 기름을 빼서 준비합니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치마요 덮밥'), 2, '팬에 진간장, 설탕, 맛술, 양파를 넣고 양파가 투명해질 때까지 졸입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치마요 덮밥'), 3, '다른 팬에 식용유를 두르고 계란을 풀어 스크램블을 만듭니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치마요 덮밥'), 4, '그릇에 밥을 담고 졸인 양파, 계란 스크램블, 참치를 올린 뒤 마요네즈를 뿌려 완성합니다.', NULL;

-- ==========================================
-- 6. 매콤 제육덮밥
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('매콤 제육덮밥', '매콤달콤하게 볶은 돼지 앞다리살을 얹은 든든한 덮밥', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '한그릇/밥'), 1, 20, '보통', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_6.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), master_ingredient_id, NULL, category_id, name, 150, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '돼지고기 (앞다리살/찌개용)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), master_ingredient_id, NULL, category_id, name, 1, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '밥 (공기밥 / 햇반)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), master_ingredient_id, NULL, category_id, name, 0.3, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), master_ingredient_id, NULL, category_id, name, 15, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '고추장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '고춧가루';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '진간장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '설탕';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), master_ingredient_id, NULL, category_id, name, 5, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '참기름';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), master_ingredient_id, NULL, category_id, name, 10, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '식용유';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), 1, '고추장, 고춧가루, 진간장, 설탕, 다진 마늘을 섞어 제육 양념을 만듭니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), 2, '돼지고기에 양념을 버무려 잠시 재워둡니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), 3, '팬에 식용유를 두르고 양념된 고기를 볶다가, 썰어둔 양파와 대파를 넣고 완전히 익힙니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '매콤 제육덮밥'), 4, '그릇에 밥을 담고 제육볶음을 넉넉히 올린 뒤 참기름을 살짝 둘러 완성합니다.', NULL;

-- ==========================================
-- 7. 소고기 불고기덮밥
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('소고기 불고기덮밥', '불고기 양념의 소고기와 양파, 팽이버섯을 올린 덮밥', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '한그릇/밥'), 1, 20, '보통', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_7.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), master_ingredient_id, NULL, category_id, name, 150, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '소고기 (국거리/불고기용)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), master_ingredient_id, NULL, category_id, name, 1, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '밥 (공기밥 / 햇반)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), master_ingredient_id, NULL, category_id, name, 0.5, '봉지', 'SUB', TRUE FROM ingredient_master WHERE name = '팽이버섯';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), master_ingredient_id, NULL, category_id, name, 30, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '진간장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), master_ingredient_id, NULL, category_id, name, 15, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '설탕';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '맛술 (미림)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), master_ingredient_id, NULL, category_id, name, 5, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '참기름';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), master_ingredient_id, NULL, category_id, name, 2, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '통깨 / 간깨';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), 1, '진간장, 설탕, 맛술, 다진 마늘, 참기름을 섞어 불고기 양념을 만듭니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), 2, '소고기와 채 썬 양파를 양념에 버무려 10분 이상 재워둡니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), 3, '팬에 고기와 양파를 넣고 볶다가, 고기가 익어갈 때쯤 밑동을 자른 팽이버섯을 넣고 살짝 더 볶습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 불고기덮밥'), 4, '밥 위에 볶은 불고기를 올리고 통깨를 뿌려 완성합니다.', NULL;

-- ==========================================
-- 8. 돼지고기 김치찌개
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('돼지고기 김치찌개', '앞다리살(또는 삼겹살)을 넣고 푹 끓인 진한 김치찌개', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '국/찌개/탕'), 1, 25, '보통', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_8.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '돼지고기 김치찌개'), master_ingredient_id, NULL, category_id, name, 150, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '배추김치';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '돼지고기 김치찌개'), master_ingredient_id, NULL, category_id, name, 100, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '돼지고기 (앞다리살/찌개용)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '돼지고기 김치찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '모', 'SUB', FALSE FROM ingredient_master WHERE name = '두부';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '돼지고기 김치찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '돼지고기 김치찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '돼지고기 김치찌개'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '돼지고기 김치찌개'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '고춧가루';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '돼지고기 김치찌개'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '국간장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '돼지고기 김치찌개'), master_ingredient_id, NULL, category_id, name, 5, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '식용유';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '돼지고기 김치찌개'), 1, '냄비에 식용유를 살짝 두르고 돼지고기를 먼저 볶아 기름을 냅니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '돼지고기 김치찌개'), 2, '고기 겉면이 익으면 적당히 썬 김치를 넣고 충분히 볶아줍니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '돼지고기 김치찌개'), 3, '물을 붓고 끓이다가 끓어오르면 다진 마늘, 고춧가루, 양파를 넣고 중불에서 15분 이상 푹 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '돼지고기 김치찌개'), 4, '마지막에 두부와 대파를 넣고 한소끔 더 끓인 뒤, 부족한 간은 국간장으로 맞춥니다.', NULL;

-- ==========================================
-- 9. 참치 김치찌개
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('참치 김치찌개', '참치캔 기름과 신김치로 감칠맛을 폭발시키는 찌개', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '국/찌개/탕'), 1, 15, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_9.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치 김치찌개'), master_ingredient_id, NULL, category_id, name, 150, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '배추김치';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치 김치찌개'), master_ingredient_id, NULL, category_id, name, 1, '캔', 'MAIN', FALSE FROM ingredient_master WHERE name = '참치캔';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치 김치찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '모', 'SUB', FALSE FROM ingredient_master WHERE name = '두부';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치 김치찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치 김치찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치 김치찌개'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치 김치찌개'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '고춧가루';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치 김치찌개'), master_ingredient_id, NULL, category_id, name, 5, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '설탕';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치 김치찌개'), master_ingredient_id, NULL, category_id, name, 1, '개', 'SUB', TRUE FROM ingredient_master WHERE name = '코인육수 (채소맛)';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치 김치찌개'), 1, '냄비에 참치캔 기름과 썰어둔 양파, 김치를 넣고 볶아줍니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치 김치찌개'), 2, '김치가 투명해지면 물과 코인육수, 참치살을 넣고 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치 김치찌개'), 3, '국물이 끓어오르면 다진 마늘, 고춧가루, 설탕을 넣고 중불에서 10분간 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '참치 김치찌개'), 4, '먹기 좋게 썬 두부와 대파를 넣고 2~3분 더 끓여 마무리합니다.', NULL;

-- ==========================================
-- 10. 애호박 두부 된장찌개
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('애호박 두부 된장찌개', '코인육수, 된장, 애호박, 두부로 끓이는 정석 된장찌개', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '국/찌개/탕'), 1, 15, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_10.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '애호박 두부 된장찌개'), master_ingredient_id, NULL, category_id, name, 30, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '된장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '애호박 두부 된장찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '애호박';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '애호박 두부 된장찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '모', 'MAIN', FALSE FROM ingredient_master WHERE name = '두부';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '애호박 두부 된장찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '애호박 두부 된장찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '애호박 두부 된장찌개'), master_ingredient_id, NULL, category_id, name, 1, '개', 'SUB', TRUE FROM ingredient_master WHERE name = '청양고추';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '애호박 두부 된장찌개'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '애호박 두부 된장찌개'), master_ingredient_id, NULL, category_id, name, 5, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '고춧가루';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '애호박 두부 된장찌개'), master_ingredient_id, NULL, category_id, name, 1, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '코인육수 (해물맛)';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '애호박 두부 된장찌개'), 1, '냄비에 물을 붓고 코인육수를 넣어 육수를 냅니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '애호박 두부 된장찌개'), 2, '육수가 끓으면 된장을 풀어 넣습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '애호박 두부 된장찌개'), 3, '먹기 좋게 썬 애호박과 양파, 다진 마늘을 넣고 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '애호박 두부 된장찌개'), 4, '채소가 익으면 두부, 대파, 청양고추, 고춧가루를 넣고 한소끔 더 끓여 마무리합니다.', NULL;

-- ==========================================
-- 11. 차돌/우삼겹 된장찌개
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('차돌/우삼겹 된장찌개', '고소한 소고기 기름이 녹아든 진한 고깃집 스타일 된장찌개', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '국/찌개/탕'), 1, 20, '보통', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_11.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '차돌/우삼겹 된장찌개'), master_ingredient_id, NULL, category_id, name, 100, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '소고기 (차돌박이/우삼겹)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '차돌/우삼겹 된장찌개'), master_ingredient_id, NULL, category_id, name, 30, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '된장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '차돌/우삼겹 된장찌개'), master_ingredient_id, NULL, category_id, name, 0.3, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '애호박';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '차돌/우삼겹 된장찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '모', 'SUB', FALSE FROM ingredient_master WHERE name = '두부';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '차돌/우삼겹 된장찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '차돌/우삼겹 된장찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '차돌/우삼겹 된장찌개'), master_ingredient_id, NULL, category_id, name, 1, '개', 'SUB', TRUE FROM ingredient_master WHERE name = '청양고추';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '차돌/우삼겹 된장찌개'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '차돌/우삼겹 된장찌개'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '고추장';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '차돌/우삼겹 된장찌개'), 1, '냄비에 고기를 넣고 볶아 기름을 충분히 냅니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '차돌/우삼겹 된장찌개'), 2, '고기가 익으면 된장과 고추장을 넣고 살짝 볶아 풍미를 살립니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '차돌/우삼겹 된장찌개'), 3, '물을 붓고 썰어둔 양파와 애호박을 넣어 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '차돌/우삼겹 된장찌개'), 4, '채소가 익으면 두부, 대파, 청양고추, 다진 마늘을 넣고 한소끔 끓입니다.', NULL;

-- ==========================================
-- 12. 맑은 콩나물국
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('맑은 콩나물국', '코인육수와 대파, 청양고추로 시원 칼칼하게 끓인 해장국', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '국/찌개/탕'), 1, 10, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_12.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '맑은 콩나물국'), master_ingredient_id, NULL, category_id, name, 1, '봉지', 'MAIN', FALSE FROM ingredient_master WHERE name = '콩나물';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '맑은 콩나물국'), master_ingredient_id, NULL, category_id, name, 0.3, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '맑은 콩나물국'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', TRUE FROM ingredient_master WHERE name = '청양고추';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '맑은 콩나물국'), master_ingredient_id, NULL, category_id, name, 5, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '맑은 콩나물국'), master_ingredient_id, NULL, category_id, name, 3, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '소금';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '맑은 콩나물국'), master_ingredient_id, NULL, category_id, name, 1, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '코인육수 (채소맛)';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '맑은 콩나물국'), 1, '콩나물은 깨끗이 씻어 준비합니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '맑은 콩나물국'), 2, '냄비에 물과 코인육수를 넣고 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '맑은 콩나물국'), 3, '물이 끓으면 콩나물을 넣고 뚜껑을 열거나 닫은 채로(일관되게) 5분간 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '맑은 콩나물국'), 4, '다진 마늘, 송송 썬 대파와 청양고추를 넣고 소금으로 간을 맞춘 뒤 한소끔 끓여냅니다.', NULL;

-- ==========================================
-- 13. 소고기 미역국
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('소고기 미역국', '참기름에 달달 볶은 소고기와 미역으로 깊게 우려낸 국', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '국/찌개/탕'), 1, 30, '보통', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_13.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 미역국'), master_ingredient_id, NULL, category_id, name, 20, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '미역';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 미역국'), master_ingredient_id, NULL, category_id, name, 100, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '소고기 (국거리/불고기용)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 미역국'), master_ingredient_id, NULL, category_id, name, 30, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '국간장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 미역국'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 미역국'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '참기름';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 미역국'), master_ingredient_id, NULL, category_id, name, 5, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '소금';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 미역국'), 1, '미역은 찬물에 20분 이상 불린 후 물기를 짜고 먹기 좋게 자릅니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 미역국'), 2, '냄비에 참기름을 두르고 소고기를 넣어 겉면이 익을 때까지 볶습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 미역국'), 3, '불린 미역을 넣고 국간장을 더해 미역이 부드러워질 때까지 함께 볶습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '소고기 미역국'), 4, '물을 붓고 끓이다가 끓어오르면 다진 마늘을 넣고 중약불에서 20분 이상 푹 끓인 뒤, 부족한 간은 소금으로 맞춥니다.', NULL;

-- ==========================================
-- 14. 사골 떡만둣국
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('사골 떡만둣국', '시판 사골곰탕 파우치, 냉동만두, 떡국떡으로 10분 완성', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '국/찌개/탕'), 1, 10, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_14.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '사골 떡만둣국'), master_ingredient_id, NULL, category_id, name, 1, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '사골곰탕 (파우치)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '사골 떡만둣국'), master_ingredient_id, NULL, category_id, name, 150, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '떡국떡';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '사골 떡만둣국'), master_ingredient_id, NULL, category_id, name, 4, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '만두 (냉동)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '사골 떡만둣국'), master_ingredient_id, NULL, category_id, name, 1, '개', 'SUB', TRUE FROM ingredient_master WHERE name = '계란';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '사골 떡만둣국'), master_ingredient_id, NULL, category_id, name, 0.3, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '사골 떡만둣국'), master_ingredient_id, NULL, category_id, name, 5, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '사골 떡만둣국'), master_ingredient_id, NULL, category_id, name, 2, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '소금';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '사골 떡만둣국'), master_ingredient_id, NULL, category_id, name, 2, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '통깨 / 간깨';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '사골 떡만둣국'), 1, '떡국떡은 찬물에 잠시 불려두고, 대파는 송송 썹니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '사골 떡만둣국'), 2, '냄비에 사골곰탕을 붓고 끓입니다. (필요시 물을 약간 추가)', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '사골 떡만둣국'), 3, '국물이 끓으면 불려둔 떡국떡과 냉동만두, 다진 마늘을 넣습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '사골 떡만둣국'), 4, '떡과 만두가 익어서 떠오르면 풀어둔 계란을 원을 그리며 두르고 대파를 넣습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '사골 떡만둣국'), 5, '간을 보고 소금으로 맞춘 뒤, 그릇에 담아 통깨(또는 김가루)를 곁들입니다.', NULL;

-- ==========================================
-- 15. 칼칼한 감자 고추장찌개
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('칼칼한 감자 고추장찌개', '감자, 양파, 돼지고기를 고추장 국물에 자작하게 끓인 찌개', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '국/찌개/탕'), 1, 25, '보통', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_15.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), master_ingredient_id, NULL, category_id, name, 1, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '감자';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), master_ingredient_id, NULL, category_id, name, 100, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '돼지고기 (앞다리살/찌개용)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), master_ingredient_id, NULL, category_id, name, 0.3, '개', 'SUB', TRUE FROM ingredient_master WHERE name = '애호박';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), master_ingredient_id, NULL, category_id, name, 0.5, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), master_ingredient_id, NULL, category_id, name, 30, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '고추장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '고춧가루';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '국간장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), master_ingredient_id, NULL, category_id, name, 5, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '식용유';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), 1, '감자, 양파, 애호박, 돼지고기를 먹기 좋은 크기로 깍둑썰기합니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), 2, '냄비에 식용유를 두르고 돼지고기를 볶다가 겉이 익으면 고추장과 고춧가루를 넣고 볶습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), 3, '물을 붓고 감자와 양파를 넣은 뒤, 끓어오르면 다진 마늘을 넣고 중불에서 감자가 익을 때까지 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '칼칼한 감자 고추장찌개'), 4, '애호박과 대파를 넣고 조금 더 끓인 뒤, 국간장으로 간을 맞춥니다.', NULL;

-- ==========================================
-- 16. 대파 콩나물 해장라면
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('대파 콩나물 해장라면', '라면에 콩나물과 송송 썬 대파를 듬뿍 넣은 해장 분식', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '면/만두'), 1, 10, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_16.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '대파 콩나물 해장라면'), master_ingredient_id, NULL, category_id, name, 1, '봉지', 'MAIN', FALSE FROM ingredient_master WHERE name = '라면';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '대파 콩나물 해장라면'), master_ingredient_id, NULL, category_id, name, 0.5, '봉지', 'MAIN', FALSE FROM ingredient_master WHERE name = '콩나물';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '대파 콩나물 해장라면'), master_ingredient_id, NULL, category_id, name, 0.5, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '대파 콩나물 해장라면'), master_ingredient_id, NULL, category_id, name, 5, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '고춧가루';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '대파 콩나물 해장라면'), master_ingredient_id, NULL, category_id, name, 1, '개', 'SUB', TRUE FROM ingredient_master WHERE name = '청양고추';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '대파 콩나물 해장라면'), 1, '냄비에 정량보다 아주 약간 많은 물을 넣고 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '대파 콩나물 해장라면'), 2, '물이 끓으면 라면 스프와 면, 씻어둔 콩나물을 함께 넣습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '대파 콩나물 해장라면'), 3, '면이 중간쯤 익었을 때 송송 썬 대파와 고춧가루, 청양고추를 넣습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '대파 콩나물 해장라면'), 4, '면이 알맞게 익으면 불을 끄고 그릇에 담아 완성합니다.', NULL;

-- ==========================================
-- 17. 만두 계란라면
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('만두 계란라면', '냉동만두와 계란을 풀어 한 끼 식사로 든든하게 채우는 라면', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '면/만두'), 1, 10, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_17.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '만두 계란라면'), master_ingredient_id, NULL, category_id, name, 1, '봉지', 'MAIN', FALSE FROM ingredient_master WHERE name = '라면';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '만두 계란라면'), master_ingredient_id, NULL, category_id, name, 3, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '만두 (냉동)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '만두 계란라면'), master_ingredient_id, NULL, category_id, name, 1, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '계란';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '만두 계란라면'), master_ingredient_id, NULL, category_id, name, 0.3, '뿌리', 'SUB', TRUE FROM ingredient_master WHERE name = '대파';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '만두 계란라면'), 1, '냄비에 물을 끓이고 라면 스프와 면을 넣습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '만두 계란라면'), 2, '면을 넣은 직후 냉동만두를 함께 넣어 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '만두 계란라면'), 3, '면과 만두가 거의 다 익어갈 때쯤 계란을 풀어 원을 그리며 두릅니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '만두 계란라면'), 4, '송송 썬 대파를 넣고 1분간 더 끓여 완성합니다.', NULL;

-- ==========================================
-- 18. 초간단 비빔라면/비빔면
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('초간단 비빔라면/비빔면', '고추장, 진간장, 설탕, 참기름 베이스 양념의 비빔면', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '면/만두'), 1, 15, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_18.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '초간단 비빔라면/비빔면'), master_ingredient_id, NULL, category_id, name, 1, '봉지', 'MAIN', FALSE FROM ingredient_master WHERE name = '라면';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '초간단 비빔라면/비빔면'), master_ingredient_id, NULL, category_id, name, 15, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '고추장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '초간단 비빔라면/비빔면'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '진간장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '초간단 비빔라면/비빔면'), master_ingredient_id, NULL, category_id, name, 15, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '설탕';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '초간단 비빔라면/비빔면'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '참기름';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '초간단 비빔라면/비빔면'), master_ingredient_id, NULL, category_id, name, 5, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '통깨 / 간깨';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '초간단 비빔라면/비빔면'), master_ingredient_id, NULL, category_id, name, 0.3, '봉지', 'SUB', TRUE FROM ingredient_master WHERE name = '상추';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '초간단 비빔라면/비빔면'), 1, '고추장, 진간장, 설탕, 참기름, 통깨를 섞어 비빔 양념장을 만듭니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '초간단 비빔라면/비빔면'), 2, '라면 면만 끓는 물에 삶은 뒤, 찬물에 헹궈 물기를 완전히 뺍니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '초간단 비빔라면/비빔면'), 3, '면을 양념장에 고루 비빕니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '초간단 비빔라면/비빔면'), 4, '기호에 따라 채 썬 상추나 오이를 올려 완성합니다.', NULL;

-- ==========================================
-- 19. 국물 떡볶이
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('국물 떡볶이', '떡국떡, 대파, 소시지를 넣고 끓여낸 분식집 스타일 떡볶이', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '면/만두'), 1, 15, '보통', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_19.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '국물 떡볶이'), master_ingredient_id, NULL, category_id, name, 200, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '떡국떡';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '국물 떡볶이'), master_ingredient_id, NULL, category_id, name, 1, '봉지', 'MAIN', TRUE FROM ingredient_master WHERE name = '소시지 (프랑크/후랑크)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '국물 떡볶이'), master_ingredient_id, NULL, category_id, name, 1, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '국물 떡볶이'), master_ingredient_id, NULL, category_id, name, 30, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '고추장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '국물 떡볶이'), master_ingredient_id, NULL, category_id, name, 30, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '설탕';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '국물 떡볶이'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '고춧가루';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '국물 떡볶이'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '진간장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '국물 떡볶이'), master_ingredient_id, NULL, category_id, name, 5, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '다시다 (소고기)';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '국물 떡볶이'), 1, '떡국떡은 물에 헹궈 준비하고, 대파는 길게 썰어둡니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '국물 떡볶이'), 2, '냄비에 물을 붓고 고추장, 설탕, 고춧가루, 진간장, 다시다를 풀어 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '국물 떡볶이'), 3, '물이 끓으면 떡국떡과 칼집을 낸 소시지를 넣습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '국물 떡볶이'), 4, '국물이 걸쭉해지기 시작하면 대파를 듬뿍 넣고 떡에 양념이 밸 때까지 졸여 완성합니다.', NULL;

-- ==========================================
-- 20. 앞다리살 제육볶음
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('앞다리살 제육볶음', '양파, 대파, 매콤 양념에 센 불로 볶아낸 메인 밥도둑', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '메인반찬'), 1, 20, '보통', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_20.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), master_ingredient_id, NULL, category_id, name, 200, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '돼지고기 (앞다리살/찌개용)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), master_ingredient_id, NULL, category_id, name, 0.5, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), master_ingredient_id, NULL, category_id, name, 1, '개', 'SUB', TRUE FROM ingredient_master WHERE name = '청양고추';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), master_ingredient_id, NULL, category_id, name, 30, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '고추장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), master_ingredient_id, NULL, category_id, name, 15, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '고춧가루';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), master_ingredient_id, NULL, category_id, name, 30, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '진간장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), master_ingredient_id, NULL, category_id, name, 15, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '설탕';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '물엿';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), master_ingredient_id, NULL, category_id, name, 15, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), master_ingredient_id, NULL, category_id, name, 10, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '식용유';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), 1, '볼에 고추장, 고춧가루, 진간장, 설탕, 물엿, 다진 마늘을 섞어 양념장을 만듭니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), 2, '돼지고기를 양념장에 버무려 10분간 재워둡니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), 3, '팬에 식용유를 두르고 양념한 고기를 볶습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '앞다리살 제육볶음'), 4, '고기가 반쯤 익으면 썰어둔 양파, 대파, 청양고추를 넣고 완전히 익을 때까지 센 불로 볶아 마무리합니다.', NULL;

-- ==========================================
-- 21. 삼겹살 두부김치
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('삼겹살 두부김치', '노릇하게 구운 삼겹살과 볶은 김치, 따뜻한 두부의 삼합', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '안주/야식'), 1, 20, '보통', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_21.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '삼겹살 두부김치'), master_ingredient_id, NULL, category_id, name, 150, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '돼지고기 (삼겹살/목살)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '삼겹살 두부김치'), master_ingredient_id, NULL, category_id, name, 200, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '배추김치';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '삼겹살 두부김치'), master_ingredient_id, NULL, category_id, name, 1, '모', 'MAIN', FALSE FROM ingredient_master WHERE name = '두부';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '삼겹살 두부김치'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '삼겹살 두부김치'), master_ingredient_id, NULL, category_id, name, 0.5, '뿌리', 'SUB', TRUE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '삼겹살 두부김치'), master_ingredient_id, NULL, category_id, name, 10, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '설탕';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '삼겹살 두부김치'), master_ingredient_id, NULL, category_id, name, 10, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '참기름';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '삼겹살 두부김치'), master_ingredient_id, NULL, category_id, name, 5, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '통깨 / 간깨';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '삼겹살 두부김치'), 1, '두부는 끓는 물에 살짝 데쳐 먹기 좋게 썰어 접시에 담아둡니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '삼겹살 두부김치'), 2, '팬에 삼겹살을 먼저 노릇하게 구워 기름을 냅니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '삼겹살 두부김치'), 3, '고기 기름에 먹기 좋게 썬 김치와 양파, 설탕을 넣고 함께 볶습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '삼겹살 두부김치'), 4, '김치가 맛있게 볶아지면 대파와 참기름을 두르고 가볍게 섞어 두부 곁에 담고 통깨를 뿌려 완성합니다.', NULL;

-- ==========================================
-- 22. 소시지 야채볶음 (쏘야)
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('소시지 야채볶음 (쏘야)', '소시지, 양파, 당근에 케첩과 굴소스를 넣고 볶은 반찬', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '밑반찬'), 1, 15, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_22.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소시지 야채볶음 (쏘야)'), master_ingredient_id, NULL, category_id, name, 1, '봉지', 'MAIN', FALSE FROM ingredient_master WHERE name = '소시지 (프랑크/후랑크)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소시지 야채볶음 (쏘야)'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소시지 야채볶음 (쏘야)'), master_ingredient_id, NULL, category_id, name, 0.3, '개', 'SUB', TRUE FROM ingredient_master WHERE name = '당근';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소시지 야채볶음 (쏘야)'), master_ingredient_id, NULL, category_id, name, 45, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '케첩';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소시지 야채볶음 (쏘야)'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '굴소스';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소시지 야채볶음 (쏘야)'), master_ingredient_id, NULL, category_id, name, 15, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '설탕';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소시지 야채볶음 (쏘야)'), master_ingredient_id, NULL, category_id, name, 5, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소시지 야채볶음 (쏘야)'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '식용유';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '소시지 야채볶음 (쏘야)'), master_ingredient_id, NULL, category_id, name, 2, 'g', 'SUB', TRUE FROM ingredient_master WHERE name = '통깨 / 간깨';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '소시지 야채볶음 (쏘야)'), 1, '소시지는 칼집을 내고, 양파와 당근은 한입 크기로 썹니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '소시지 야채볶음 (쏘야)'), 2, '케첩, 굴소스, 설탕을 섞어 소스를 만듭니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '소시지 야채볶음 (쏘야)'), 3, '팬에 식용유를 두르고 양파, 당근, 다진 마늘, 소시지를 넣어 함께 볶습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '소시지 야채볶음 (쏘야)'), 4, '재료가 익으면 만들어둔 소스를 붓고 고루 섞어 볶은 뒤 통깨를 뿌립니다.', NULL;

-- ==========================================
-- 23. 굴소스 닭다리살 대파 볶음
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('굴소스 닭다리살 대파 볶음', '뼈 없는 닭다리살 정육과 통대파를 굴소스 양념에 볶은 요리', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '메인반찬'), 1, 20, '보통', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_23.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '굴소스 닭다리살 대파 볶음'), master_ingredient_id, NULL, category_id, name, 200, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '닭다리살 정육';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '굴소스 닭다리살 대파 볶음'), master_ingredient_id, NULL, category_id, name, 1, '뿌리', 'MAIN', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '굴소스 닭다리살 대파 볶음'), master_ingredient_id, NULL, category_id, name, 5, '쪽', 'SUB', TRUE FROM ingredient_master WHERE name = '마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '굴소스 닭다리살 대파 볶음'), master_ingredient_id, NULL, category_id, name, 30, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '굴소스';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '굴소스 닭다리살 대파 볶음'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '진간장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '굴소스 닭다리살 대파 볶음'), master_ingredient_id, NULL, category_id, name, 15, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '설탕';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '굴소스 닭다리살 대파 볶음'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '맛술 (미림)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '굴소스 닭다리살 대파 볶음'), master_ingredient_id, NULL, category_id, name, 10, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '식용유';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '굴소스 닭다리살 대파 볶음'), master_ingredient_id, NULL, category_id, name, 5, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '참기름';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '굴소스 닭다리살 대파 볶음'), 1, '닭다리살은 한입 크기로 썰고, 대파는 4cm 길이로 큼직하게 썹니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '굴소스 닭다리살 대파 볶음'), 2, '팬에 식용유를 두르고 마늘과 닭다리살을 껍질 쪽부터 노릇하게 굽습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '굴소스 닭다리살 대파 볶음'), 3, '닭고기 겉면이 익으면 대파를 넣고 대파 향이 날 때까지 볶습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '굴소스 닭다리살 대파 볶음'), 4, '굴소스, 진간장, 설탕, 맛술을 섞어 부은 뒤 양념이 잘 배어들게 졸이듯 볶고 마지막에 참기름을 두릅니다.', NULL;

-- ==========================================
-- 24. 베이컨 팽이버섯 말이 구이
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('베이컨 팽이버섯 말이 구이', '팽이버섯을 베이컨으로 돌돌 말아 노릇하게 구운 구이', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '밑반찬'), 1, 15, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_24.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 팽이버섯 말이 구이'), master_ingredient_id, NULL, category_id, name, 1, '팩', 'MAIN', FALSE FROM ingredient_master WHERE name = '베이컨';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 팽이버섯 말이 구이'), master_ingredient_id, NULL, category_id, name, 1, '봉지', 'MAIN', FALSE FROM ingredient_master WHERE name = '팽이버섯';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 팽이버섯 말이 구이'), master_ingredient_id, NULL, category_id, name, 5, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '식용유';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 팽이버섯 말이 구이'), 1, '팽이버섯은 밑동을 자르고 적당한 두께로 가닥을 나눕니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 팽이버섯 말이 구이'), 2, '베이컨 위에 팽이버섯을 올리고 돌돌 말아줍니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 팽이버섯 말이 구이'), 3, '달군 팬에 식용유를 아주 살짝만 두르고 베이컨 끝부분이 바닥으로 가게 올려 굽습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '베이컨 팽이버섯 말이 구이'), 4, '베이컨이 풀리지 않도록 조심하며 굴려가며 노릇하게 구워냅니다.', NULL;

-- ==========================================
-- 25. 바삭 감자채전
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('바삭 감자채전', '감자를 가늘게 채 썰어 바삭하게 부쳐낸 전', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '밑반찬'), 1, 15, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_25.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '바삭 감자채전'), master_ingredient_id, NULL, category_id, name, 2, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '감자';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '바삭 감자채전'), master_ingredient_id, NULL, category_id, name, 3, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '소금';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '바삭 감자채전'), master_ingredient_id, NULL, category_id, name, 30, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '식용유';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '바삭 감자채전'), 1, '감자는 껍질을 벗기고 최대한 가늘게 채 썹니다. (전분기를 빼지 않습니다.)', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '바삭 감자채전'), 2, '채 썬 감자에 소금을 넣고 버무려 잠시 둡니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '바삭 감자채전'), 3, '팬에 식용유를 넉넉히 두르고 달군 뒤, 감자채를 넓게 펼쳐 올립니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '바삭 감자채전'), 4, '중약불에서 밑면이 완전히 바삭해질 때까지 기다렸다가 뒤집어 양면을 노릇하게 부칩니다.', NULL;

-- ==========================================
-- 26. 노릇한 순살 고등어 구이
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('노릇한 순살 고등어 구이', '순살 고등어 토막을 프라이팬에 겉바속촉으로 구워낸 생선구이', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '메인반찬'), 1, 15, '쉬움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_26.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '노릇한 순살 고등어 구이'), master_ingredient_id, NULL, category_id, name, 1, '토막', 'MAIN', FALSE FROM ingredient_master WHERE name = '고등어 (순살/토막)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '노릇한 순살 고등어 구이'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '식용유';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '노릇한 순살 고등어 구이'), 1, '냉동 고등어라면 미리 해동하거나 흐르는 물에 씻어 물기를 키친타월로 제거합니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '노릇한 순살 고등어 구이'), 2, '달군 팬에 식용유를 두르고 고등어의 등 쪽(껍질 부분)이 바닥으로 가게 올립니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '노릇한 순살 고등어 구이'), 3, '중불에서 껍질이 노릇하고 바삭해질 때까지 충분히 굽습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '노릇한 순살 고등어 구이'), 4, '뒤집어서 속살까지 완전히 익혀줍니다.', NULL;

-- ==========================================
-- 27. 단짠 돼지갈비찜
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('단짠 돼지갈비찜', '갈비찜용 돼지고기와 감자, 당근을 간장 양념에 푹 졸인 요리', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '메인반찬'), 1, 45, '어려움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_27.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), master_ingredient_id, NULL, category_id, name, 300, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '돼지고기 (갈비찜/등갈비용)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), master_ingredient_id, NULL, category_id, name, 1, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '감자';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', TRUE FROM ingredient_master WHERE name = '당근';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), master_ingredient_id, NULL, category_id, name, 45, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '진간장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), master_ingredient_id, NULL, category_id, name, 30, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '설탕';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), master_ingredient_id, NULL, category_id, name, 30, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '맛술 (미림)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), master_ingredient_id, NULL, category_id, name, 15, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '물엿';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), master_ingredient_id, NULL, category_id, name, 10, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '참기름';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), 1, '돼지갈비는 끓는 물에 5분간 데쳐 불순물을 제거하고 헹궈냅니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), 2, '냄비에 고기와 물, 진간장, 설탕, 맛술, 다진 마늘, 물엿을 넣고 강불에서 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), 3, '끓어오르면 중불로 줄이고 큼직하게 썬 감자, 당근을 넣어 20분 이상 졸입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '단짠 돼지갈비찜'), 4, '국물이 자작해지고 채소가 다 익으면 양파를 넣고 조금 더 졸인 뒤 참기름을 둘러 마무리합니다.', NULL;

-- ==========================================
-- 28. 부드러운 통삼겹 수육
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('부드러운 통삼겹 수육', '된장, 대파, 통마늘을 넣고 촉촉하게 삶아낸 보쌈', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '메인반찬'), 1, 45, '어려움', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_28.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '부드러운 통삼겹 수육'), master_ingredient_id, NULL, category_id, name, 300, 'g', 'MAIN', FALSE FROM ingredient_master WHERE name = '돼지고기 (보쌈용/수육용)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '부드러운 통삼겹 수육'), master_ingredient_id, NULL, category_id, name, 30, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '된장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '부드러운 통삼겹 수육'), master_ingredient_id, NULL, category_id, name, 1, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '부드러운 통삼겹 수육'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', TRUE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '부드러운 통삼겹 수육'), master_ingredient_id, NULL, category_id, name, 5, '쪽', 'SUB', TRUE FROM ingredient_master WHERE name = '마늘';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '부드러운 통삼겹 수육'), 1, '냄비에 돼지고기가 잠길 만큼 물을 붓고 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '부드러운 통삼겹 수육'), 2, '물이 끓으면 통삼겹, 된장, 대파, 껍질째 씻은 양파, 통마늘을 넣습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '부드러운 통삼겹 수육'), 3, '강불에서 10분, 중약불에서 30~40분간 푹 삶습니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '부드러운 통삼겹 수육'), 4, '젓가락으로 찔러 핏물이 나오지 않으면 건져내어 한 김 식힌 후 얇게 썹니다.', NULL;

-- ==========================================
-- 29. 고등어 무 조림
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('고등어 무 조림', '말랑한 무와 순살 고등어를 칼칼한 양념 국물에 자작하게 졸인 밥도둑 조림', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '메인반찬'), 1, 30, '보통', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_29.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), master_ingredient_id, NULL, category_id, name, 2, '토막', 'MAIN', FALSE FROM ingredient_master WHERE name = '고등어 (순살/토막)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), master_ingredient_id, NULL, category_id, name, 0.3, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '무';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), master_ingredient_id, NULL, category_id, name, 0.5, '개', 'SUB', FALSE FROM ingredient_master WHERE name = '양파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), master_ingredient_id, NULL, category_id, name, 0.5, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), master_ingredient_id, NULL, category_id, name, 1, '개', 'SUB', TRUE FROM ingredient_master WHERE name = '청양고추';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), master_ingredient_id, NULL, category_id, name, 30, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '고춧가루';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), master_ingredient_id, NULL, category_id, name, 30, 'ml', 'SUB', FALSE FROM ingredient_master WHERE name = '진간장';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), master_ingredient_id, NULL, category_id, name, 15, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '설탕';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), master_ingredient_id, NULL, category_id, name, 15, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '다진 마늘';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '맛술 (미림)';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), 1, '고춧가루, 진간장, 설탕, 다진 마늘, 맛술을 섞어 양념장을 만듭니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), 2, '냄비 바닥에 큼직하게 썬 무를 깔고, 그 위에 씻어둔 고등어를 올립니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), 3, '양념장을 골고루 얹고 무가 잠길 정도로 물을 부어 강불에서 끓입니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '고등어 무 조림'), 4, '끓어오르면 썰어둔 양파와 청양고추를 넣고 중불로 줄여 국물을 끼얹어가며 무가 푹 익을 때까지 졸입니다.', NULL;

-- ==========================================
-- 30. 촉촉한 뚝배기 달걀찜
-- ==========================================
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) VALUES ('촉촉한 뚝배기 달걀찜', '계란과 송송 썬 대파, 소금/액젓으로 부드럽게 쪄낸 계란찜', (SELECT recipe_category_id FROM recipe_category WHERE category_name = '밑반찬'), 1, 15, '보통', 'https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/recipes/thumbnails/recipe_30.png');

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '촉촉한 뚝배기 달걀찜'), master_ingredient_id, NULL, category_id, name, 3, '개', 'MAIN', FALSE FROM ingredient_master WHERE name = '계란';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '촉촉한 뚝배기 달걀찜'), master_ingredient_id, NULL, category_id, name, 0.3, '뿌리', 'SUB', FALSE FROM ingredient_master WHERE name = '대파';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '촉촉한 뚝배기 달걀찜'), master_ingredient_id, NULL, category_id, name, 3, 'g', 'SUB', FALSE FROM ingredient_master WHERE name = '소금';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '촉촉한 뚝배기 달걀찜'), master_ingredient_id, NULL, category_id, name, 5, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '액젓 (참치/멸치)';
INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) SELECT (SELECT recipe_id FROM recipe WHERE title = '촉촉한 뚝배기 달걀찜'), master_ingredient_id, NULL, category_id, name, 5, 'ml', 'SUB', TRUE FROM ingredient_master WHERE name = '참기름';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '촉촉한 뚝배기 달걀찜'), 1, '볼에 계란을 풀고 물을 섞은 뒤, 소금과 액젓으로 간을 맞춥니다. (물을 계란 양의 80% 정도 넣습니다.)', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '촉촉한 뚝배기 달걀찜'), 2, '뚝배기에 계란물을 붓고 중불에 올립니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '촉촉한 뚝배기 달걀찜'), 3, '바닥이 눋지 않도록 숟가락으로 계속 저어줍니다.', NULL;
INSERT INTO recipe_step (recipe_id, step_no, description, image_url) SELECT (SELECT recipe_id FROM recipe WHERE title = '촉촉한 뚝배기 달걀찜'), 4, '계란이 몽글몽글하게 80% 정도 익으면 송송 썬 대파를 올리고 약불로 줄여 뚜껑을 덮은 뒤 1~2분간 뜸을 들여 완성합니다.', NULL;

COMMIT;
```
