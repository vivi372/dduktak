```sql

-- ==========================================
-- 오늘의 뚝딱 (Dduktak) 레시피 시드 데이터
-- 대상: 1인 가구 대표 한식 메뉴 30선
-- ==========================================

BEGIN;

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

-- [1] 버터 간장계란밥
INSERT INTO recipe (title, description, recipe_category_id, servings, cooking_time, difficulty, thumbnail_url) 
VALUES ('버터 간장계란밥', '5분 컷, 자취생 영원한 기본 소울푸드', 
        (SELECT recipe_category_id FROM recipe_category WHERE category_name = '한그릇/밥'), 1, 5, '쉬움', NULL);

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) 
SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), master_ingredient_id, NULL, category_id, name, 1, '개', 'MAIN', FALSE 
FROM ingredient_master WHERE name = '밥 (공기밥 / 햇반)';

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) 
SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), master_ingredient_id, NULL, category_id, name, 1, '개', 'MAIN', FALSE 
FROM ingredient_master WHERE name = '계란';

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) 
SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), master_ingredient_id, NULL, category_id, name, 15, 'ml', 'SUB', FALSE 
FROM ingredient_master WHERE name = '진간장';

INSERT INTO recipe_ingredient (recipe_id, master_ingredient_id, alt_ingredient_id, category_id, name, quantity, unit, type_code, is_optional) 
SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), master_ingredient_id, NULL, category_id, name, 5, 'ml', 'SUB', FALSE 
FROM ingredient_master WHERE name = '참기름';

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) 
SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), 1, '따뜻한 밥을 그릇에 담고 가운데에 버터를 올려 녹입니다.', NULL;

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) 
SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), 2, '계란 후라이를 만들어 밥 위에 올립니다.', NULL;

INSERT INTO recipe_step (recipe_id, step_no, description, image_url) 
SELECT (SELECT recipe_id FROM recipe WHERE title = '버터 간장계란밥'), 3, '진간장과 참기름을 넣고 비벼 먹습니다.', NULL;

COMMIT;
```
