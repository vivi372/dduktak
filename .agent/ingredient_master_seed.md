# 식재료 마스터 시드 데이터 (ingredient_master_seed.md)

```sql
-- ==========================================
-- 오늘의 뚝딱 (Dduktak) 마스터 식재료 시드 데이터 (최종)
-- 대상: 6개 카테고리 및 1인 가구 한식 필수 식재료 전량 (74종)
-- ==========================================

-- ------------------------------------------
-- 1. 카테고리 초기 데이터 (중복 방지)
-- ------------------------------------------
INSERT INTO ingredient_category (category_name, default_shelf_life_days, is_sauce) VALUES
('채소/과일', 7, FALSE),
('정육/계란', 3, FALSE),
('수산/해산물', 2, FALSE),
('유제품/시리얼', 14, FALSE),
('가공식품/냉동', 30, FALSE),
('양념/소스/조미료', 180, TRUE)
ON CONFLICT (category_name) DO NOTHING;

-- ------------------------------------------
-- 2. 마스터 표준 식재료 INSERT
-- ------------------------------------------

-- [1] 채소/과일 (category_id = 1)
INSERT INTO ingredient_master (category_id, name, default_unit, default_shelf_days) VALUES
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '양파', '개', 14),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '대파', '뿌리', 7),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '마늘', '쪽', 10),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '감자', '개', 20),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '애호박', '개', 5),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '당근', '개', 14),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '청양고추', '개', 7),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '홍고추', '개', 7),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '양배추', '통', 10),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '무', '개', 14),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '팽이버섯', '봉지', 5),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '새송이버섯', '개', 7),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '표고버섯', '개', 6),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '상추', '봉지', 4),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '깻잎', '장', 4),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '콩나물', '봉지', 3),
((SELECT category_id FROM ingredient_category WHERE category_name = '채소/과일'), '두부', '모', 5)
ON CONFLICT (name) DO NOTHING;

-- [2] 정육/계란 (category_id = 2)
INSERT INTO ingredient_master (category_id, name, default_unit, default_shelf_days) VALUES
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '계란', '개', 21),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '베이컨', '팩', 14),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '돼지고기 (삼겹살/목살)', 'g', 3),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '돼지고기 (앞다리살/찌개용)', 'g', 3),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '돼지고기 (보쌈용/수육용)', 'g', 3),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '돼지고기 (갈비찜/등갈비용)', 'g', 3),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '소고기 (국거리/불고기용)', 'g', 3),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '소고기 (차돌박이/우삼겹)', 'g', 3),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '소고기 (찜용/갈비용)', 'g', 3),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '닭가슴살', '팩', 5),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '닭다리살 정육', 'g', 3),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '통닭 (생닭 1마리)', '마리', 2),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '스팸', '개', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '정육/계란'), '소시지 (프랑크/후랑크)', '봉지', 14)
ON CONFLICT (name) DO NOTHING;

-- [3] 수산/해산물 (category_id = 3)
INSERT INTO ingredient_master (category_id, name, default_unit, default_shelf_days) VALUES
((SELECT category_id FROM ingredient_category WHERE category_name = '수산/해산물'), '참치캔', '캔', 730),
((SELECT category_id FROM ingredient_category WHERE category_name = '수산/해산물'), '냉동 새우', 'g', 90),
((SELECT category_id FROM ingredient_category WHERE category_name = '수산/해산물'), '오징어', '마리', 2),
((SELECT category_id FROM ingredient_category WHERE category_name = '수산/해산물'), '멸치 (육수용)', 'g', 180),
((SELECT category_id FROM ingredient_category WHERE category_name = '수산/해산물'), '미역', 'g', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '수산/해산물'), '고등어 (순살/토막)', '토막', 2),
((SELECT category_id FROM ingredient_category WHERE category_name = '수산/해산물'), '갈치', '토막', 2),
((SELECT category_id FROM ingredient_category WHERE category_name = '수산/해산물'), '조기 (굴비)', '마리', 3),
((SELECT category_id FROM ingredient_category WHERE category_name = '수산/해산물'), '임연수 (순살/토막)', '토막', 2)
ON CONFLICT (name) DO NOTHING;

-- [4] 유제품/시리얼 (category_id = 4)
INSERT INTO ingredient_master (category_id, name, default_unit, default_shelf_days) VALUES
((SELECT category_id FROM ingredient_category WHERE category_name = '유제품/시리얼'), '우유', 'ml', 10),
((SELECT category_id FROM ingredient_category WHERE category_name = '유제품/시리얼'), '버터', 'g', 60),
((SELECT category_id FROM ingredient_category WHERE category_name = '유제품/시리얼'), '슬라이스 치즈', '장', 30)
ON CONFLICT (name) DO NOTHING;

-- [5] 가공식품/냉동 (category_id = 5)
INSERT INTO ingredient_master (category_id, name, default_unit, default_shelf_days) VALUES
((SELECT category_id FROM ingredient_category WHERE category_name = '가공식품/냉동'), '배추김치', 'g', 90),
((SELECT category_id FROM ingredient_category WHERE category_name = '가공식품/냉동'), '밥 (공기밥 / 햇반)', '개', 180),
((SELECT category_id FROM ingredient_category WHERE category_name = '가공식품/냉동'), '냉동밥 (볶음밥/백미)', '봉지', 90),
((SELECT category_id FROM ingredient_category WHERE category_name = '가공식품/냉동'), '라면', '봉지', 120),
((SELECT category_id FROM ingredient_category WHERE category_name = '가공식품/냉동'), '만두 (냉동)', '봉지', 90),
((SELECT category_id FROM ingredient_category WHERE category_name = '가공식품/냉동'), '떡국떡', 'g', 30),
((SELECT category_id FROM ingredient_category WHERE category_name = '가공식품/냉동'), '사골곰탕 (파우치)', '개', 180)
ON CONFLICT (name) DO NOTHING;

-- [6] 양념/소스/조미료 (category_id = 6)
INSERT INTO ingredient_master (category_id, name, default_unit, default_shelf_days) VALUES
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '진간장', 'ml', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '국간장', 'ml', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '고추장', 'g', 180),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '된장', 'g', 180),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '고춧가루', 'g', 180),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '설탕', 'g', 730),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '소금', 'g', 730),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '물엿', 'ml', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '굴소스', 'ml', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '참기름', 'ml', 180),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '식용유', 'ml', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '다진 마늘', 'g', 30),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '맛술 (미림)', 'ml', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '액젓 (참치/멸치)', 'ml', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '올리고당', 'ml', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '케첩', 'g', 180),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '마요네즈', 'g', 90),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '다시다 (소고기)', 'g', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '다시다 (멸치)', 'g', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '미원', 'g', 730),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '코인육수 (해물맛)', '개', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '코인육수 (사골맛)', '개', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '코인육수 (채소맛)', '개', 365),
((SELECT category_id FROM ingredient_category WHERE category_name = '양념/소스/조미료'), '통깨 / 간깨', 'g', 180)
ON CONFLICT (name) DO NOTHING;
```
