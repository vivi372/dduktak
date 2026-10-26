# 🧪 오늘의 뚝딱 - 통합 테스트 (Integration Tests)

본 디렉토리는 1인 가구 맞춤 냉장고 관리 & 레시피 솔루션 서비스 **'오늘의 뚝딱'**의 E2E(End-to-End) 통합 테스트 시나리오, 차수별 실행 이력, 그리고 3중 증적(시각적 영상, API/트레이스 로그, DB 스냅샷)을 영구 보존하고 Git 형상 관리하기 위한 전용 공간입니다.

---

## 📁 디렉토리 아키텍처

```text
integration-tests/
├── README.md                              # 통합 테스트 개요 및 차수별 히스토리 인덱스 (본 문서)
├── INTEGRATION_TEST_PROCEDURE.md          # 📋 통합 테스트 표준 운영 절차서 (SOP)
│
├── cycle-01/                              # 🏁 [1차 통합 테스트]
│   ├── SCENARIO.md                        # 1차 수행 대상 유저 저니 상세 시나리오
│   ├── REPORT.md                          # 1차 실행 결과 총평 & 결함(Defect) 티켓 목록
│   ├── assets/                            # 🎨 파일 업로드 테스트용 이미지 에셋 (프로필, 썸네일, 조리 스텝, 영수증)
│   ├── traces/                            # 🔍 API 응답 X-Trace-Id 및 AOP 트레이스 발췌 로그
│   │   └── api_traces_cycle_01.md
│   ├── db-snapshots/                      # 💾 DB 트랜잭션 전후 데이터 무결성 스냅샷
│   │   └── data_integrity_verification.md
│   └── evidence/                          # 📸 시각적 증적 에셋
│       ├── recordings/                    # 브라우저 E2E 인터랙션 녹화본 (.webp / .mp4)
│       └── screenshots/                   # 주요 성공 화면 및 결함 발생 지점 스크린샷 (.png)
│
└── cycle-02/                              # 🔄 [2차 통합 테스트] (1차 결함 수정 후 회귀 검증)
    ├── SCENARIO.md
    ├── REPORT.md
    └── evidence/ ...
```

---

## 🏆 3중 교차 증적 (Evidence Triad) 체계

모든 통합 테스트는 단순 기능 동작 여부를 넘어 아래 3가지 증적을 일괄 확보하여 통과를 인증합니다.

1. **시각적 증적 (Visual Evidence)**:
   - `browser_subagent`가 생성한 E2E 브라우저 조작 전체 녹화본 (`.webp` / 비디오 파일)
   - 결함 발생 지점 및 주요 성공 마일스톤 스크린샷 (`.png`)
2. **통신/트레이스 증적 (Trace Evidence)**:
   - HTTP 응답 헤더 `X-Trace-Id`와 백엔드 AOP 로깅 콘솔(`[ReqID: xxxxxx]`) 매핑 기록
   - Controller ➔ Service ➔ MyBatis Mapper ➔ DB 쿼리 실행 시간(ms) 및 파라미터/반환값 무결성 증명
3. **데이터 무결성 증적 (Data Integrity Evidence)**:
   - 테스트 시나리오 수행 전/후 PostgreSQL 실제 테이블 데이터 스냅샷
   - FIFO(선입선출) 소비기한 빠른 순 차감, 수량 0 도달 시 `status='CONSUMED'` 전이 검증
   - 회원 탈퇴(USER-02) 후 유저 개인정보 완전 파기 및 작성 레시피 `author_id IS NULL` 익명 보존 검증

---

## 📅 차수별 테스트 진행 현황 (History Index)

| 차수 (Cycle) | 실행 일자 | 대상 범위 | 주요 결과 | 상세 링크 |
| :---: | :---: | :--- | :---: | :---: |
| **Cycle 1** | *준비 완료* | 풀 유저 저니 전방위 7단계 (실제 이메일 가입 ➔ 영수증 OCR & 식재료 CRUD ➔ 폼 검증 & 이미지 업로드 레시피 CRUD ➔ 홈 브리핑/매칭 ➔ 3-Way FIFO 요리 차감 ➔ 자추 필터링 & 다중계정 알림 ➔ 마이페이지 관리 & 최종 탈퇴 익명화) | 대기 | [cycle-01/SCENARIO.md](file:///c:/Dev/오늘의%20뚝딱/dduktak/integration-tests/cycle-01/SCENARIO.md) |
| **Cycle 2** | *예정* | Cycle 1 결함 수정에 따른 회귀 테스트 | - | - |

---

## 🚀 상세 실행 절차
상세한 환경 준비, 실행 커맨드, 모바일 APK 빌드 및 검증 방법은 [INTEGRATION_TEST_PROCEDURE.md](file:///c:/Dev/오늘의%20뚝딱/dduktak/integration-tests/INTEGRATION_TEST_PROCEDURE.md)를 참조하세요.
