# 🛰️ [Cycle 2] API 트레이스 및 X-Trace-Id 매핑 증적

본 문서는 **2차 종합 E2E 통합 테스트(Cycle 2)** 실행 시 클라이언트와 백엔드 Spring Boot 간에 송수신된 주요 REST API 요청의 `X-Trace-Id`와 AOP 로깅 트레이스 증적을 기록합니다.

---

## 1. Step별 주요 API 호출 트레이스 로그

| Step | API 엔드포인트 | HTTP Method | 상태 코드 | X-Trace-Id | 비고 |
|:---:|:---|:---:|:---:|:---:|:---|
| Step 1 | `/api/v1/recipes/categories` | GET | 200 OK | - | 오프닝 백엔드 웜업 핑 |
| Step 1 | `/api/v1/auth/init` | POST | 200 OK | - | 지연 프로필 초기화 |
| Step 2 | `/api/v1/inventory/scan-ocr` | POST | 200 OK | - | 영수증 OCR Gemini 분석 |
| Step 2 | `/api/v1/inventory/batch` | POST | 201 Created | - | 식재료 일괄 등록 |
| Step 2 | `/api/v1/inventory` | GET | 200 OK | - | 냉장고 2-Tier 아코디언 조회 |
| Step 3 | `/api/v1/recipes` | GET | 200 OK | - | 레시피 목록 및 15종 썸네일 |
| Step 3 | `/api/v1/recipes` | POST | 201 Created | - | 신규 레시피 등록 |
| Step 4 | `/api/v1/home` | GET | 200 OK | - | 홈 브리핑 및 추천 레시피 |
| Step 4 | `/api/v1/matching` | GET | 200 OK | - | 스마트 매칭 추천 피드 |
| Step 4 | `/api/v1/recipes/{id}` | GET | 200 OK | - | 레시피 상세 조회 (매칭점수 일치) |
| Step 5 | `/api/v1/matching/cook` | POST | 200 OK | - | 뚝딱 요리완료 및 FIFO 차감 |
| Step 6 | `/api/v1/recipes/{id}/like` | POST | 200 OK | - | 레시피 좋아요 토글 |
| Step 6 | `/api/v1/notifications` | GET | 200 OK | - | 알림 센터 목록 조회 |
| Step 7 | `/api/v1/auth/me` | PATCH | 200 OK | - | 마이페이지 프로필 수정 |
| Step 7 | `/api/v1/auth/withdraw` | DELETE | 200 OK | - | 회원 탈퇴 및 익명 보존 |

---

## 2. AOP 콘솔 로깅 발췌

*(테스트 진행 시 콘솔에 출력된 `[START] [ReqID: xxxxxx]` 및 `[END]` 로그 발췌 기록)*

