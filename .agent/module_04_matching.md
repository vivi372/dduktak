📄 [모듈 4 상세 명세서] 스마트 매칭 엔진 (Smart Matching Engine)
1. 개요 및 시스템 정책 • 목적: 유저가 보유한 냉장고 식재료 데이터를 기반으로 최적의 레시피를 실시간으로 스코어링(Scoring)하여 매칭률(%)로 제공하고, 소비기한 임박 재료의 차감을 유도하여 잔반 처리를 극대화함. • 핵심 알고리즘 원칙: A. 주재료 필수 하드 필터 (Hard Gate): 레시피에 정의된 주재료(MAIN) 중 최소 1개 이상을 내 냉장고에 보유하고 있어야 함 (주재료 0개 시 매칭률 0% 처리 및 매칭 목록 완전 제외). B. 가중치 부여 구조: 기본 재료 충족 점수 + 소비기한 임박 재료 가산점 (주재료 임박 시 더 높은 가산점). C. 양념/소스류 연산 제외: 양념/소스 카테고리 재료는 유저 충족률 연산에서 100% 충족된 것으로 간주하여 감점하지 않음.
2. 매칭 점수 산출 공식 (Matching Score Algorithm) 최종 매칭 점수는 기본 재료 충족 점수 (Base Score)와 소비기한 임박 가산점 (Bonus Score)의 합산으로 산출되며, 최대 100%로 캡핑(Capping)됩니다. \text{Final Score} = \min\left(100, ; \text{Base Score} + \text{Bonus Score}\right) 2.1. 기본 재료 충족 점수 (Base Score - 최대 100점) 레시피에 등록된 재료별 가중치를 기반으로 보유 여부(직접 보유, 대체 보유, 생략 가능)에 따라 점수를 부여합니다.
1. 재료별 기본 가중치 (Weight) • 주재료 (W_{\text{main}}): 70점 (레시피 내 주재료 개수로 균등 분할) • 부재료 (W_{\text{sub}}): 30점 (레시피 내 부재료 개수로 균등 분할) • (단, 양념/소스 카테고리는 점수 차감 대상에서 제외하고 상시 100% 보유로 인정)
2. 재료 충족 상태별 획득 비율 (R) 각 재료 항목에 대해 유저의 보유 상태에 따른 점수 반영 비율: • 보유 중 (Direct Match): R = 1.0 (100% 점수 획득) • 대체 재료 보유 (Alternative Match): R = 0.7 (70% 점수 획득) • 생략 가능 재료 (Optional & Missing): R = 0.5 (미보유하더라도 50% 점수 획득) • 미보유 (Missing): R = 0.0 (0점) \text{Base Score} = \left( \sum_{i \in \text{Main}} W_{\text{main, } i} \times R_i \right) + \left( \sum_{j \in \text{Sub}} W_{\text{sub, } j} \times R_j \right) 2.2. 소비기한 임박 가산점 (Bonus Score - 최대 20점) 내 냉장고에 있는 재료 중 소비기한이 임박(D-0 ~ D-3)한 재료가 레시피에 포함되어 있을 경우 가산점을 부여하여 "냉장고 털기(냉털)" 레시피를 최상단에 추천합니다. • 임박한 주재료 포함 시 (B_{\text{main}}): 개당 +10점 • 임박한 부재료 포함 시 (B_{\text{sub}}): 개당 +5점 • (소비기한 지남(D-Day < 0) 재료는 위험 방지를 위해 가산점 대상에서 제외) \text{Bonus Score} = \min\left(20, ; (\text{임박 주재료 수} \times 10) + (\text{임박 부재료 수} \times 5)\right) 💡 알고리즘 계산 예시 [레시피: 돼지고기 김치찌개] ▪ 주재료: 돼지고기(35점), 김치(35점) ▪ 부재료: 양파(15점, 생략가능), 대파(15점, 대체가능: 양파) ▪ 양념류: 간장, 다진마늘 (차감/점수 계산 제외) [유저 냉장고 보유 상태] ▪ 돼지고기 보유 중 (D-1 임박! 🚨) ▪ 김치 보유 중 (D-15) ▪ 양파 미보유 (생략 가능) ▪ 대파 미보유 • Base Score 계산: ◦ 돼지고기: 35 \times 1.0 = 35점 ◦ 김치: 35 \times 1.0 = 35점 ◦ 양파 (미보유/생략가능): 15 \times 0.5 = 7.5점 ◦ 대파 (미보유): 15 \times 0.0 = 0점 ◦ \rightarrow Base Score = 77.5점 • Bonus Score 계산: ◦ 주재료인 돼지고기가 D-1 임박 \rightarrow +10점 • 최종 매칭 점수: 77.5 + 10 = \mathbf{87.5%} \rightarrow 88% 뚝딱 매칭
3. 세부 기능 및 성능 요구사항 (Functional & Performance) 3.1. 하드 필터링 및 정렬 (MATCH-01) • MATCH-01-1 [주재료 필수 검증 (Hard Gate)]: ◦ 유저의 user_refrigerator 테이블(status = 'ACTIVE')에 있는 마스터 재료 ID 목록과 레시피의 MAIN 재료 ID 목록을 비교. ◦ 레시피의 MAIN 재료 중 단 하나도 유저 냉장고에 없다면 매칭률을 0%로 처리하고 [🟢 내 냉장고 뚝딱 매칭 모드] 조회 결과에서 완전 제외. • MATCH-01-3 [선택적 레시피 카테고리 필터링 (Category Filter)]:
  ◦ 유저가 특정 레시피 카테고리(recipe_category_id)를 선택하여 추천 요청 시, 해당 카테고리에 속한 레시피만 1차 필터링한 후 매칭 스코어링 및 정렬을 수행.
• MATCH-01-2 [매칭 정렬 순서]: ◦ [🟢 내 냉장고 뚝딱 매칭 모드] 클릭 시 정렬 우선순위: a. 최종 매칭 점수 (Final Score) 내림차순 b. 임박 가산점 (Bonus Score) 내림차순 (냉털 요리 우선) c. 레시피 인기순 (completed_count + like_count) 내림차순 3.2. 성능 최적화 및 쿼리 전략 (MATCH-02) • MATCH-02-1 [목록 조회 쿼리 최적화]: ◦ 매번 전체 레시피를 전수 조사하면 성능 저하가 발생하므로, 유저가 가지고 있는 주재료 ID 목록으로 recipe_ingredient 테이블을 IN (...) 조건 1차 필터링한 후 매칭 점수를 연산. • MATCH-02-2 [실시간 스코어링 캐싱]: ◦ 냉장고 재료 변경(등록/차감/삭제)이 일어날 때 유저별 매칭 가능 레시피 ID와 점수를 간단히 메모리 캐싱하거나 Fast-path 쿼리로 실행하여 목록 로딩 속도를 200ms 이내로 유지.


4. 세부 차감 및 동시성 정책 (Deduction & Concurrency Policies)
4.1. 원본/대체 재료 혼합 차감 금지 (No-Mixing FIFO Deduction Policy)
• **맛 보존을 위한 혼합 차감 금지**: 요리의 본래 맛 유지를 위해 단일 레시피 요리 완료 연산 시 원본 재료(`master_ingredient_id`)와 대체 재료(`alt_ingredient_id`)를 섞어서 연속 차감하지 않음.
• **차감 연산 순서**: 원본 재료를 최우선 FIFO(`expire_date ASC, created_at ASC`) 차감함. 원본 재료가 없거나 부족한 경우 보유분만 차감(Partial Deduction)하며, 부족분을 대체 재료에서 이어서 차감하지 않음 (대체 재료로 요리 시 대체 재료 단독 차감).

4.2. 보유 수량 부족 시 부분 차감 (Partial Deduction)
• 요리 완료 시 레시피 필요 수량보다 냉장고 보유 수량이 적더라도 에러(500/400)를 던지지 않고, 보유한 재료를 전량 FIFO 차감(`status = 'CONSUMED'`)한 뒤 실제 차감된 수량을 `deductedIngredients` 응답으로 반환함.

4.3. 원자적 카운터 업데이트 및 익명 레시피 보안 (Atomic Update & Security)
• **원자적(Atomic) 연산**: `like_count` 및 `cooked_count` 증가/감소 연산은 동시성 이슈 방지를 위해 DB SQL 레벨에서 `UPDATE recipe SET cooked_count = cooked_count + 1 WHERE recipe_id = :id` 형태로 직접 처리함.
• **익명 레시피 보호**: 작성자 회원 탈퇴로 `user_id = NULL` 처리된 익명 레시피는 모든 유저의 수정(`PUT`) 및 삭제(`DELETE`) 요청을 백엔드 권한 검증 단계에서 `403 Forbidden` (`RCP_WARN_NOT_AUTHOR`) 처리하여 커뮤니티 공유 자산으로 완전 보호함.
