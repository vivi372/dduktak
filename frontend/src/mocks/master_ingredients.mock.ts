import type { MasterIngredient, IngredientCategory } from '@/types/inventory';

/** 6대 표준 식재료 카테고리 정의 (ingredient_category) */
export const mockCategories: IngredientCategory[] = [
  { categoryId: 1, categoryName: '채소/과일', defaultShelfLifeDays: 7, isSauce: false },
  { categoryId: 2, categoryName: '정육/계란', defaultShelfLifeDays: 3, isSauce: false },
  { categoryId: 3, categoryName: '수산/해산물', defaultShelfLifeDays: 2, isSauce: false },
  { categoryId: 4, categoryName: '유제품/시리얼', defaultShelfLifeDays: 14, isSauce: false },
  { categoryId: 5, categoryName: '가공식품/냉동', defaultShelfLifeDays: 30, isSauce: false },
  { categoryId: 6, categoryName: '양념/소스/조미료', defaultShelfLifeDays: 180, isSauce: true },
];

/** 74종 표준 마스터 식재료 (ingredient_master_seed.md 기반 전량 마이그레이션) */
export const mockMasterIngredients: MasterIngredient[] = [
  // [1] 채소/과일 (17종)
  { masterIngredientId: 1, categoryId: 1, categoryName: '채소/과일', name: '양파', defaultUnit: '개', defaultShelfDays: 14, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 2, categoryId: 1, categoryName: '채소/과일', name: '대파', defaultUnit: '뿌리', defaultShelfDays: 7, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 3, categoryId: 1, categoryName: '채소/과일', name: '마늘', defaultUnit: '쪽', defaultShelfDays: 10, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 4, categoryId: 1, categoryName: '채소/과일', name: '감자', defaultUnit: '개', defaultShelfDays: 20, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 5, categoryId: 1, categoryName: '채소/과일', name: '애호박', defaultUnit: '개', defaultShelfDays: 5, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 6, categoryId: 1, categoryName: '채소/과일', name: '당근', defaultUnit: '개', defaultShelfDays: 14, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 7, categoryId: 1, categoryName: '채소/과일', name: '청양고추', defaultUnit: '개', defaultShelfDays: 7, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 8, categoryId: 1, categoryName: '채소/과일', name: '홍고추', defaultUnit: '개', defaultShelfDays: 7, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 9, categoryId: 1, categoryName: '채소/과일', name: '양배추', defaultUnit: '통', defaultShelfDays: 10, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 10, categoryId: 1, categoryName: '채소/과일', name: '무', defaultUnit: '개', defaultShelfDays: 14, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 11, categoryId: 1, categoryName: '채소/과일', name: '팽이버섯', defaultUnit: '봉지', defaultShelfDays: 5, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 12, categoryId: 1, categoryName: '채소/과일', name: '새송이버섯', defaultUnit: '개', defaultShelfDays: 7, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 13, categoryId: 1, categoryName: '채소/과일', name: '표고버섯', defaultUnit: '개', defaultShelfDays: 6, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 14, categoryId: 1, categoryName: '채소/과일', name: '상추', defaultUnit: '봉지', defaultShelfDays: 4, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 15, categoryId: 1, categoryName: '채소/과일', name: '깻잎', defaultUnit: '장', defaultShelfDays: 4, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 16, categoryId: 1, categoryName: '채소/과일', name: '콩나물', defaultUnit: '봉지', defaultShelfDays: 3, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 17, categoryId: 1, categoryName: '채소/과일', name: '두부', defaultUnit: '모', defaultShelfDays: 5, defaultStorageType: 'REFRIGERATED' },

  // [2] 정육/계란 (13종)
  { masterIngredientId: 18, categoryId: 2, categoryName: '정육/계란', name: '계란', defaultUnit: '개', defaultShelfDays: 21, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 19, categoryId: 2, categoryName: '정육/계란', name: '베이컨', defaultUnit: '팩', defaultShelfDays: 14, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 20, categoryId: 2, categoryName: '정육/계란', name: '돼지고기 (삼겹살/목살)', defaultUnit: 'g', defaultShelfDays: 3, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 21, categoryId: 2, categoryName: '정육/계란', name: '돼지고기 (앞다리살/찌개용)', defaultUnit: 'g', defaultShelfDays: 3, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 22, categoryId: 2, categoryName: '정육/계란', name: '돼지고기 (보쌈용/수육용)', defaultUnit: 'g', defaultShelfDays: 3, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 23, categoryId: 2, categoryName: '정육/계란', name: '돼지고기 (갈비찜/등갈비용)', defaultUnit: 'g', defaultShelfDays: 3, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 24, categoryId: 2, categoryName: '정육/계란', name: '소고기 (국거리/불고기용)', defaultUnit: 'g', defaultShelfDays: 3, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 25, categoryId: 2, categoryName: '정육/계란', name: '소고기 (차돌박이/우삼겹)', defaultUnit: 'g', defaultShelfDays: 3, defaultStorageType: 'FROZEN' },
  { masterIngredientId: 26, categoryId: 2, categoryName: '정육/계란', name: '소고기 (찜용/갈비용)', defaultUnit: 'g', defaultShelfDays: 3, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 27, categoryId: 2, categoryName: '정육/계란', name: '닭가슴살', defaultUnit: '팩', defaultShelfDays: 5, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 28, categoryId: 2, categoryName: '정육/계란', name: '닭다리살 정육', defaultUnit: 'g', defaultShelfDays: 3, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 29, categoryId: 2, categoryName: '정육/계란', name: '통닭 (생닭 1마리)', defaultUnit: '마리', defaultShelfDays: 2, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 30, categoryId: 2, categoryName: '정육/계란', name: '스팸', defaultUnit: '개', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 31, categoryId: 2, categoryName: '정육/계란', name: '소시지 (프랑크/후랑크)', defaultUnit: '봉지', defaultShelfDays: 14, defaultStorageType: 'REFRIGERATED' },

  // [3] 수산/해산물 (9종)
  { masterIngredientId: 32, categoryId: 3, categoryName: '수산/해산물', name: '참치캔', defaultUnit: '캔', defaultShelfDays: 730, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 33, categoryId: 3, categoryName: '수산/해산물', name: '냉동 새우', defaultUnit: 'g', defaultShelfDays: 90, defaultStorageType: 'FROZEN' },
  { masterIngredientId: 34, categoryId: 3, categoryName: '수산/해산물', name: '오징어', defaultUnit: '마리', defaultShelfDays: 2, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 35, categoryId: 3, categoryName: '수산/해산물', name: '멸치 (육수용)', defaultUnit: 'g', defaultShelfDays: 180, defaultStorageType: 'FROZEN' },
  { masterIngredientId: 36, categoryId: 3, categoryName: '수산/해산물', name: '미역', defaultUnit: 'g', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 37, categoryId: 3, categoryName: '수산/해산물', name: '고등어 (순살/토막)', defaultUnit: '토막', defaultShelfDays: 2, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 38, categoryId: 3, categoryName: '수산/해산물', name: '갈치', defaultUnit: '토막', defaultShelfDays: 2, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 39, categoryId: 3, categoryName: '수산/해산물', name: '조기 (굴비)', defaultUnit: '마리', defaultShelfDays: 3, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 40, categoryId: 3, categoryName: '수산/해산물', name: '임연수 (순살/토막)', defaultUnit: '토막', defaultShelfDays: 2, defaultStorageType: 'REFRIGERATED' },

  // [4] 유제품/시리얼 (3종)
  { masterIngredientId: 41, categoryId: 4, categoryName: '유제품/시리얼', name: '우유', defaultUnit: 'ml', defaultShelfDays: 10, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 42, categoryId: 4, categoryName: '유제품/시리얼', name: '버터', defaultUnit: 'g', defaultShelfDays: 60, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 43, categoryId: 4, categoryName: '유제품/시리얼', name: '슬라이스 치즈', defaultUnit: '장', defaultShelfDays: 30, defaultStorageType: 'REFRIGERATED' },

  // [5] 가공식품/냉동 (7종)
  { masterIngredientId: 44, categoryId: 5, categoryName: '가공식품/냉동', name: '배추김치', defaultUnit: 'g', defaultShelfDays: 90, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 45, categoryId: 5, categoryName: '가공식품/냉동', name: '밥 (공기밥 / 햇반)', defaultUnit: '개', defaultShelfDays: 180, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 46, categoryId: 5, categoryName: '가공식품/냉동', name: '냉동밥 (볶음밥/백미)', defaultUnit: '봉지', defaultShelfDays: 90, defaultStorageType: 'FROZEN' },
  { masterIngredientId: 47, categoryId: 5, categoryName: '가공식품/냉동', name: '라면', defaultUnit: '봉지', defaultShelfDays: 120, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 48, categoryId: 5, categoryName: '가공식품/냉동', name: '만두 (냉동)', defaultUnit: '봉지', defaultShelfDays: 90, defaultStorageType: 'FROZEN' },
  { masterIngredientId: 49, categoryId: 5, categoryName: '가공식품/냉동', name: '떡국떡', defaultUnit: 'g', defaultShelfDays: 30, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 50, categoryId: 5, categoryName: '가공식품/냉동', name: '사골곰탕 (파우치)', defaultUnit: '개', defaultShelfDays: 180, defaultStorageType: 'ROOM_TEMP' },

  // [6] 양념/소스/조미료 (24종)
  { masterIngredientId: 51, categoryId: 6, categoryName: '양념/소스/조미료', name: '진간장', defaultUnit: 'ml', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 52, categoryId: 6, categoryName: '양념/소스/조미료', name: '국간장', defaultUnit: 'ml', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 53, categoryId: 6, categoryName: '양념/소스/조미료', name: '고추장', defaultUnit: 'g', defaultShelfDays: 180, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 54, categoryId: 6, categoryName: '양념/소스/조미료', name: '된장', defaultUnit: 'g', defaultShelfDays: 180, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 55, categoryId: 6, categoryName: '양념/소스/조미료', name: '고춧가루', defaultUnit: 'g', defaultShelfDays: 180, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 56, categoryId: 6, categoryName: '양념/소스/조미료', name: '설탕', defaultUnit: 'g', defaultShelfDays: 730, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 57, categoryId: 6, categoryName: '양념/소스/조미료', name: '소금', defaultUnit: 'g', defaultShelfDays: 730, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 58, categoryId: 6, categoryName: '양념/소스/조미료', name: '물엿', defaultUnit: 'ml', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 59, categoryId: 6, categoryName: '양념/소스/조미료', name: '굴소스', defaultUnit: 'ml', defaultShelfDays: 365, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 60, categoryId: 6, categoryName: '양념/소스/조미료', name: '참기름', defaultUnit: 'ml', defaultShelfDays: 180, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 61, categoryId: 6, categoryName: '양념/소스/조미료', name: '식용유', defaultUnit: 'ml', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 62, categoryId: 6, categoryName: '양념/소스/조미료', name: '다진 마늘', defaultUnit: 'g', defaultShelfDays: 30, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 63, categoryId: 6, categoryName: '양념/소스/조미료', name: '맛술 (미림)', defaultUnit: 'ml', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 64, categoryId: 6, categoryName: '양념/소스/조미료', name: '액젓 (참치/멸치)', defaultUnit: 'ml', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 65, categoryId: 6, categoryName: '양념/소스/조미료', name: '올리고당', defaultUnit: 'ml', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 66, categoryId: 6, categoryName: '양념/소스/조미료', name: '케첩', defaultUnit: 'g', defaultShelfDays: 180, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 67, categoryId: 6, categoryName: '양념/소스/조미료', name: '마요네즈', defaultUnit: 'g', defaultShelfDays: 90, defaultStorageType: 'REFRIGERATED' },
  { masterIngredientId: 68, categoryId: 6, categoryName: '양념/소스/조미료', name: '다시다 (소고기)', defaultUnit: 'g', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 69, categoryId: 6, categoryName: '양념/소스/조미료', name: '다시다 (멸치)', defaultUnit: 'g', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 70, categoryId: 6, categoryName: '양념/소스/조미료', name: '미원', defaultUnit: 'g', defaultShelfDays: 730, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 71, categoryId: 6, categoryName: '양념/소스/조미료', name: '코인육수 (해물맛)', defaultUnit: '개', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 72, categoryId: 6, categoryName: '양념/소스/조미료', name: '코인육수 (사골맛)', defaultUnit: '개', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 73, categoryId: 6, categoryName: '양념/소스/조미료', name: '코인육수 (채소맛)', defaultUnit: '개', defaultShelfDays: 365, defaultStorageType: 'ROOM_TEMP' },
  { masterIngredientId: 74, categoryId: 6, categoryName: '양념/소스/조미료', name: '통깨 / 간깨', defaultUnit: 'g', defaultShelfDays: 180, defaultStorageType: 'ROOM_TEMP' },
];
