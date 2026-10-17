```sql

-- ==========================================
-- 오늘의 뚝딱 (Dduktak) 마스터 식재료 시드 데이터 (최종)
-- 대상: 6개 카테고리 및 1인 가구 한식 필수 식재료 전량
-- ==========================================

INSERT INTO ingredient_category (category_name, default_shelf_life_days, is_sauce) VALUES
('채소/과일', 7, FALSE),
('정육/계란', 3, FALSE),
('수산/해산물', 2, FALSE),
('유제품/시리얼', 14, FALSE),
('가공식품/냉동', 30, FALSE),
('양념/소스/조미료', 180, TRUE)
ON CONFLICT (category_name) DO NOTHING;

-- [1] 채소/과일
INSERT INTO ingredient_master (category_id, name, default_unit, default_shelf_days) VALUES
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '양파', '개', 14),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '대파', '뿌리', 7),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '마늘', '쪽', 10),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '감자', '개', 20),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '애호박', '개', 5),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '당근', '개', 14),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '청양고추', '개', 7),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '두부', '모', 5)
ON CONFLICT (name) DO NOTHING;

-- [2] 정육/계란
INSERT INTO ingredient_master (category_id, name, default_unit, default_shelf_days) VALUES
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '계란', '개', 21),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '베이컨', '팩', 14),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '돼지고기 (앞다리살/찌개용)', 'g', 3),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '소고기 (국거리/불고기용)', 'g', 3),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '스팸', '개', 365)
ON CONFLICT (name) DO NOTHING;

-- [3] 수산/해산물
INSERT INTO ingredient_master (category_id, name, default_unit, default_shelf_days) VALUES
((SELECT category_id FROM ingredient_category WHERE category_name = '수산/해산물'), '참치캔', '캔', 730),
((SELECT category_id FROM ingredient_category WHERE category_name = '수산/해산물'), '미역', 'g', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '수산/해산물'), '고등어 (순살/토막)', '토막', 2)
ON CONFLICT (name) DO NOTHING;

-- [4] 유제품/시리얼
INSERT INTO ingredient_master (category_id, name, default_unit, default_shelf_days) VALUES
((SELECT category_id FROM ingredient_category WHERE category_name = '유제품/시리얼'), '우유', 'ml', 10),
((SELECT category_id FROM ingredient_category WHERE category_name = '유제품/시리얼'), '버터', 'g', 60)
ON CONFLICT (name) DO NOTHING;

-- [5] 가공식품/냉동
INSERT INTO ingredient_master (category_id, name, default_unit, default_shelf_days) VALUES
((SELECT category_id FROM ingredient_category WHERE category_name = '가공식품/냉동'), '배추김치', 'g', 90),
((SELECT category_id FROM ingredient_category WHERE category_name = '가공식품/냉동'), '밥 (공기밥 / 햇반)', '개', 180),
((SELECT category_id FROM ingredient_category WHERE category_name = '가공식품/냉동'), '라면', '봉지', 120),
((SELECT category_id FROM ingredient_category WHERE category_name = '가공식품/냉동'), '만두 (냉동)', '봉지', 90)
ON CONFLICT (name) DO NOTHING;

-- [6] 양념/소스/조미료
INSERT INTO ingredient_master (category_id, name, default_unit, default_shelf_days) VALUES
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '진간장', 'ml', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '고추장', 'g', 180),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '된장', 'g', 180),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '굴소스', 'ml', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '참기름', 'ml', 180),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '식용유', 'ml', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '다진 마늘', 'g', 30)
ON CONFLICT (name) DO NOTHING;
```
