# 📋 오늘의 뚝딱 - E2E 통합 테스트 표준 운영 절차서 (SOP)

본 문서는 '오늘의 뚝딱' 프로젝트의 End-to-End 통합 테스트를 체계적이고 객관적으로 실행하기 위한 표준 운영 절차(Standard Operating Procedure, SOP)를 정의합니다.

---

## 1. 개요 및 테스트 목표

- **목표**: 프론트엔드 UI 인터랙션, 백엔드 Spring Boot 비즈니스 로직, PostgreSQL 데이터 무결성까지 실제 프로덕션과 동일한 환경에서 단절 없이 연동되는지 검증합니다.
- **검증 범위**: 
  - 1인 가구 핵심 유저 저니 (회원가입 ➔ 냉장고 재료 등록 ➔ 레시피 등록 ➔ 스마트 매칭 추천 ➔ 뚝딱 요리완료 및 선입선출 자동 차감 ➔ 알림 센터 ➔ 회원 탈퇴 및 데이터 익명화)
  - 예외/에러 방어 흐름 (중복 가입 방어, 타인 재료 수정 불가, 보유 수량 초과 차감 방어, 404 Fallback 등)
- **증적 원칙**: 모든 테스트는 **Visual(영상/캡처) + Trace(X-Trace-Id) + Data(DB 스냅샷)**의 3중 증적을 수집하여 증명합니다.

---

## 2. 테스트 환경 사전 준비 단계 (Pre-flight Setup)

통합 테스트 실행 전, 로컬 환경이 완벽히 기동되어 있어야 합니다.

### 2.1. 데이터베이스 시드 데이터 초기화 (PostgreSQL)
1. PostgreSQL 서비스 기동 확인 (포트 `5432`).
2. 표준 식재료 마스터(74종) 및 기본 레시피(30선) 시드 DDL이 적용되어 있는지 확인:
   - [.agent/ingredient_master_seed.md](file:///c:/Dev/오늘의%20뚝딱/dduktak/.agent/ingredient_master_seed.md)
   - [.agent/recipe_seed.md](file:///c:/Dev/오늘의%20뚝딱/dduktak/.agent/recipe_seed.md)

### 2.2. 백엔드 서버 기동 (Spring Boot)
```bash
# 백엔드 디렉토리 이동 및 Gradle 부트런
cd backend
./gradlew bootRun
# 포트 8080에서 200 OK 수신 대기 확인
```
- AOP 로깅(`LoggingAspect`) 및 `TraceIdFilter`가 활성화되어 콘솔에 `[START] [ReqID: xxxxxx]` 로그가 출력되는지 확인합니다.

### 2.3. 프론트엔드 개발 서버 기동 (Vite)
```bash
# 프론트엔드 디렉토리 이동 및 로컬 서버 실행
cd frontend
npm run dev
# http://localhost:5173 정상 오픈 확인
```

---

## 3. 통합 테스트 5단계 표준 실행 파이프라인

```mermaid
flowchart TD
    S1[1단계: 테스트 차수 폴더 준비<br/>cycle-NN/SCENARIO.md] --> S2[2단계: 브라우저 서브에이전트 실행<br/>browser_subagent 모바일 뷰포트]
    S2 --> S3[3단계: E2E 액션 & 실시간 녹화<br/>WebP 비디오 + 실패 캡처]
    S3 --> S4[4단계: 3중 증적 취합<br/>X-Trace-Id 매핑 + DB 쿼리 스냅샷]
    S4 --> S5{5단계: 판정 및 리포트 작성}
    S5 -- 결함(Defect) 발견 --> F1[결함 티켓 작성 & 코드 핫픽스]
    F1 --> S6[다음 차수 cycle-(NN+1) 준비]
    S6 --> S1
    S5 -- 전 시나리오 PASS --> PASS[최종 인수 완료<br/>Git 태그 & 배포 승인]
```

### [1단계] 테스트 차수(Cycle) 폴더, 시나리오 및 에셋 확정
- `integration-tests/cycle-NN/` 폴더를 생성하고 해당 회차의 실행 시나리오 문서 `SCENARIO.md`를 작성합니다.
- 파일 업로드 및 이미지 조작 테스트를 위해 `cycle-NN/assets/` 폴더에 테스트용 이미지(프로필 사진 `profile_avatar.jpg`, 레시피 썸네일 `recipe_thumb.jpg`, 조리 스텝 사진 `recipe_step1.jpg`, `recipe_step2.jpg`, 영수증 OCR 스캔용 `receipt.jpg`)를 사전에 준비합니다.
- 시나리오에는 사전 조건(Pre-conditions), 단계별 입력값, 기대 결과, 검증 체크리스트를 명시합니다.

### [2단계] 브라우저 서브에이전트 모바일 뷰포트 기동
- 에이전트의 `browser_subagent` 도구를 호출하여 모바일 하이브리드 규격(가로 390px, 세로 844px 수준)으로 브라우저를 오픈합니다.
- `RecordingName`을 지정하여 브라우저의 모든 클릭, 스크롤, 입력 동작이 **WebP 동영상**으로 자동 녹화되도록 합니다.

### [3단계] E2E 유저 저니 순차 실행 및 스크린샷 수집
- 시나리오에 따라 화면 조작을 진행합니다:
  - 회원가입/인증 ➔ 영수증 OCR 및 냉장고 CRUD ➔ 레시피 폼 검증/이미지 업로드/CRUD ➔ 스마트 매칭 ➔ 3-Way FIFO 요리완료 ➔ 알림 센터/다중계정 상호작용 ➔ 마이페이지 관리/탈퇴
- 만약 특정 단계에서 기대 결과와 다른 에러가 발생하거나 UI가 비정상일 경우:
  - 즉시 스크린샷을 캡처하여 `integration-tests/cycle-NN/evidence/screenshots/`에 저장하고 에러 로그를 확보합니다.

### [4단계] 3중 증적 취합 (Visual + Trace + DB)
1. **시각적 증적**: 생성된 녹화 영상 파일(`.webp`)을 `integration-tests/cycle-NN/evidence/recordings/`로 이동.
2. **트레이스 증적**: 각 화면 조작 시 네트워크 탭 및 백엔드 콘솔에 남은 `X-Trace-Id`를 추출하여 `traces/api_traces_cycle_NN.md`에 매핑 기록.
3. **DB 증적**: DB 클라이언트를 통해 실제 연산 결과 쿼리(예: `SELECT * FROM user_ingredient WHERE ...`, `SELECT * FROM recipe WHERE ...`)를 실행하여 `db-snapshots/data_integrity_verification.md`에 기록.

### [5단계] 판정, 결함(Defect) 티켓팅 및 회차 반복
- `REPORT.md`를 작성하여 각 TC별 통과(PASS) / 실패(FAIL) 여부를 정리합니다.
- 실패 항목이 있을 경우 원인을 분석하고 코드를 수정한 뒤, 다음 회차 `cycle-02/`를 생성하여 회귀 테스트를 수행합니다.

---

## 4. 모바일 하이브리드 네이티브 연동 테스트 절차 (APK 빌드 & 실기기 점검)

웹 브라우저로 시뮬레이션할 수 없는 순수 네이티브 하드웨어 기능(영수증 카메라 원본 촬영, 네이티브 백그라운드 푸시, 네이티브 소셜 로그인)은 **APK 빌드를 통해 실기기에서 검증**합니다.

### 4.1. Android Debug APK 빌드 커맨드
```bash
# 1. 프론트엔드 최신 소스 프로덕션 빌드
cd frontend
npm run build

# 2. Capacitor Android 네이티브 프로젝트 동기화
npx cap sync android

# 3. Gradle 기반 디버그 APK 빌드 (Windows PowerShell 기준)
cd android
./gradlew assembleDebug
```
- **빌드 산출물 경로**:
  - `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### 4.2. 실기기(모바일 단말) 테스트 체크리스트

| 검증 항목 | 테스트 방법 | 정상 판정 기준 |
| :--- | :--- | :--- |
| **1. 영수증 카메라 촬영** | 냉장고 ➔ [영수증 OCR] 선택 ➔ 마트 영수증 실물 촬영 업로드 | 로딩 애니메이션 노출 후 구매 품목들이 파싱되어 리스트에 체크박스 형태로 노출 |
| **2. 네이티브 백그라운드 푸시 (FCM)** | 앱을 백그라운드로 내린 상태에서 백엔드 소비기한 스케줄러 트리거 | 안드로이드 상단 시스템 노티 바에 푸시 알림 수신 및 클릭 시 알림 센터로 딥링크 이동 |
| **3. 하드웨어 뒤로가기 버튼** | 레시피 상세 또는 모달 팝업 화면에서 안드로이드 제스처/물리 뒤로가기 실행 | 앱이 종료되지 않고 팝업이 닫히거나 이전 뷰로 정상 복귀 |
| **4. 소셜 로그인 연동** | 로그인 화면 ➔ [구글 로그인] 탭 ➔ 사용자 직접 인증 | 인앱 웹뷰/OAuth 팝업이 안전하게 닫히고 메인 홈 화면으로 세션 동기화 진입 |

---


## 5. 결함 심각도(Severity) 분류 및 조치 기준

| 등급 | 정의 | 조치 기준 |
| :---: | :--- | :--- |
| **Blocker (치명적)** | 회원가입 불가, 토큰 인증 실패, 요리완료 차감 트랜잭션 롤백 누락 등 서비스 중단 | 즉시 코드 핫픽스 후 당일 다음 Cycle 재실행 |
| **Major (중대)** | 특정 필터링 누락, 잘못된 D-Day 연산, 알림 미읽음 뱃지 미갱신 등 핵심 로직 오류 | 원인 분석 후 수정 및 회귀 테스트 포함 |
| **Minor (경미)** | 줄바꿈/여백 스타일 미흡, 토스트 문구 오탈자, 애니메이션 프레임 드랍 | 티켓 등록 후 차기 릴리즈 또는 통합 주기 내 일괄 수정 |
