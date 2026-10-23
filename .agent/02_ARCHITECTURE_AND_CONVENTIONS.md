### 프로젝트 아키텍처, 컨벤션 및 로깅/예외 처리 명세

#### 1. 개요
본 문서는 '오늘의 뚝딱' 프로젝트의 모노레포(Monorepo) 전체 디렉토리 아키텍처, 코딩 컨벤션, 백엔드 AOP 로깅 & MDC 트레이싱 정책, 그리고 전역 예외 처리(Global Exception Handling) 규격을 정의한다. AI 에이전트는 코드 작성 시 본 문서에 명시된 모노레포 구조 및 규칙을 엄격히 준수해야 한다.

---

#### 2. 모노레포 전체 디렉토리 구조 (Monorepo Directory Architecture)
'오늘의 뚝딱' 프로젝트는 Git 단일 저장소 내에 AI 문서 패키지(`.agent/`), 백엔드(`backend/`), 프론트엔드(`frontend/`)를 격리하여 관리하는 **모노레포(Monorepo)** 구조를 채택한다.

```text
dduktak/                              # 루트 (Git Repository Root)
├── .agent/                           # AI 개발 에이전트 패키지 (가이드라인 문서 & 작업 로그)
│   ├── 00_SYSTEM_PROMPT.md           # 시스템 페르소나 및 기본 가이드
│   ├── 01_TECH_STACK_AND_LIBS.md     # 기술 스택 명세
│   ├── 02_ARCHITECTURE_AND_CONVENTIONS.md # 모노레포 구조, 컨벤션, 로깅, 예외처리
│   ├── 03_REQUIREMENTS_SUMMARY.md    # 요구사항 요약
│   ├── 04_DATABASE_SCHEMA.md         # DB 스키마 & DDL
│   ├── 05_API_SPECIFICATION.md       # API 엔드포인트 명세
│   ├── 06_UI_UX_GUIDELINES.md        # UI/UX 가이드라인
│   ├── 07_TEST_SCENARIOS.md          # 핵심 비즈니스 인수 테스트 시나리오
│   ├── 08_DEVELOPMENT_MASTER_PLAN.md # 개발 상세 마스터 플랜
│   ├── 09_API_TEST_RESULTS.md       # 백엔드 API 테스트 시나리오 및 검증 결과
│   ├── AGENTS.md                     # 프로젝트 전역 에이전트 지침
│   ├── ingredient_master_seed.md     # 식재료 마스터 시드 DDL
│   ├── recipe_seed.md                # 레시피 30선 시드 DDL
│   ├── 전달_문서_체계.txt              # 문서 패키지 체계 개요
│   └── logs/                         # 에이전트 일일 작업 및 커맨드 로그
│       └── YYYY-MM-DD.md             # 일자별 작업 이력 (예: 2026-10-15.md)
│
├── backend/                          # 백엔드 프로젝트 (Spring Boot 3.x - Java 17)
│   ├── .gitignore
│   ├── build.gradle
│   ├── settings.gradle
│   └── src/
│       ├── main/
│       │   ├── java/com/dduktak/
│       │   │   ├── global/           # Security, MyBatis, WebMvc, AOP, Cors, Error
│       │   │   │   ├── config/       # 환경 설정 및 CorsConfig
│       │   │   │   ├── error/        # ErrorCode, GlobalExceptionHandler, CustomException
│       │   │   │   ├── aspect/       # AOP 로깅 및 TraceID 추적 (LoggingAspect.java)
│       │   │   │   ├── filter/       # TraceIdFilter.java (MDC & X-Trace-Id 헤더 주입)
│       │   │   │   └── util/         # JWT Provider, SecurityUtil 등 공통 유틸
│       │   │   ├── domain/           # 도메인별 Domain-Driven Layered Structure
│       │   │   │   ├── auth/         # 회원/인증
│       │   │   │   ├── inventory/    # 내 재료 관리소
│       │   │   │   ├── recipe/       # 뚝딱 레시피 커뮤니티
│       │   │   │   ├── matching/     # 스마트 매칭 엔진
│       │   │   │   └── notification/ # 알림 시스템
│       │   │   └── DduktakApplication.java
│       │   └── resources/
│       │       ├── mapper/           # MyBatis XML Mapper
│       │       ├── log4j2.xml        # 로깅 설정 파일
│       │       └── application.yml   # Spring Boot 환경 설정
│       └── test/                     # 백엔드 단위/통합 테스트 (JUnit 5, Mockito)
│
├── frontend/                         # 프론트엔드 프로젝트 (React 18 + TypeScript + Vite)
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── assets/                   # 이미지, 폰트 등 정적 리소스
│       ├── components/               # UI 컴포넌트 (common, layout, inventory, recipe, main 등)
│       ├── pages/                    # 화면 단위 Views
│       ├── hooks/                    # React Query 커스텀 훅
│       ├── services/                 # Axios API Client 및 엔드포인트 함수
│       ├── store/                    # Zustand 전역 상태
│       ├── types/                    # TypeScript DTO/Entity 타입 정의
│       ├── utils/                    # D-Day 계산기, Date Formatter
│       └── App.tsx
│
├── docker-compose.yml                 # 로컬 인프라 환경 (PostgreSQL 15+)
├── .gitignore                         # 루트 Git 이그노어
└── README.md                          # 모노레포 프로젝트 루트 설명서
```

---

#### 3. 코딩 컨벤션 (Coding Conventions)
##### 3.1. 네이밍 규칙 (Naming Rules)
* **데이터베이스 (PostgreSQL)** : snake_case (예: `user_id`, `expire_date`, `recipe_category_id`)
* **Java / Spring** :
  * 클래스/인터페이스: PascalCase (예: `InventoryService`, `RecipeMapper`)
  * 변수/메서드: camelCase (예: `getIngredientList()`, `matchingRate`)
  * 상수: SNAKE_CASE_UPPER (예: `MAX_MATCH_COUNT`)
* **TypeScript / React** :
  * 컴포넌트/파일: PascalCase.tsx (예: `InventoryAccordion.tsx`)
  * 유틸/훅/변수: camelCase.ts (예: `useAuth.ts`, `calculateDDay()`)
* **MyBatis Mapper XML** :
  * Java DTO와 DB 칼럼 간 camelCase ➔ snake_case 자동 매핑 설정 적용 (`mapUnderscoreToCamelCase=true`).

##### 3.2. 레이어별 역할 분담 (Layer Responsibilities)
* **Controller** : `@Valid` 기반 요청 파라미터 검증 ➔ Service 호출 ➔ `ResponseEntity<ApiResponseDto<T>>` 반환.
* **Service** : `@Transactional` 관리, 비즈니스 로직(FIFO, 매칭률 연산 등) 수행.
* **Repository** : Service와 Mapper 사이 계층. 영속성 데이터 변환 및 안전한 데이터 제공.
* **Mapper (MyBatis)** : SQL 수행 전용 인터페이스. 비즈니스 로직 포함 금지.

---


##### 3.3. 프론트엔드 아키텍처 규칙 (스파게티 코드 방지 3대 철칙)
프론트엔드 개발 시 코드가 어지럽혀지거나 컴포넌트가 비대해지는 것을 방지하기 위해 다음 규칙을 강제한다.
1. **관심사 철저 분리 (Separation of Concerns)**:
   * **UI 컴포넌트 (`.tsx`)**: 오직 화면 렌더링, Tailwind 스타일링, props 전달만 담당.
   * **데이터 패칭 및 로직**: API 호출 및 TanStack Query 훅은 `src/hooks/` 또는 `src/services/`로 분리.
   * **순수 함수**: 날짜 포맷 계산, D-Day 연산 등은 `src/utils/`로 격리. 하나의 컴포넌트에 뷰와 로직을 섞어 파일이 비대해지면 리젝 대상.
2. **인라인 로직 금지 (No Inline Complex Logic)**:
   * JSX 내부에서 복잡한 익명 함수나 거대한 삼항 연산자를 장황하게 늘어놓지 않고, 상단 헬퍼 변수나 핸들러 함수로 깔끔하게 추출.
3. **타입 격리 (Type Isolation)**:
   * DTO 및 인터페이스 타입 정의는 절대 컴포넌트 파일 내부에 선언하지 않고, `src/types/` 하위 파일에서 import.

---

#### 4. AOP 로깅 & MDC 트레이싱 정책 (AOP Logging & Tracing Policy)
##### 4.1. 동작 방식 및 X-Trace-Id 헤더 주입 규격
* **AOP 대상** : `com.dduktak.domain..*Controller.*(..)`, `Service.*(..)`, `Mapper.*(..)`
* **Trace ID 생성 및 MDC 필터 (`TraceIdFilter`)** :
  1. Servlet Filter 단계에서 HTTP 요청 진입 시 6자리 무작위 Trace ID(예: `e4a3f1`)를 생성하여 `MDC`에 저장.
  2. HTTP 응답 헤더에 `X-Trace-Id: [TraceID]`를 자동으로 주입하여 클라이언트에 반환.
  3. `CorsConfig`에 `exposedHeaders("X-Trace-Id")`를 설정하여 프론트엔드(React/Axios)에서 응답 헤더의 Trace ID를 수신할 수 있도록 허용.
  4. 요청 완료 시(AfterFinally) `MDC.clear()`를 수행하여 서블릿 쓰레드 재사용 시 메모리 누수 및 ID 오염 방지.
* **AOP 트레이싱 기능 (`LoggingAspect`)** :
  * 진입 시: 메서드 전달 매개변수(Args) 로깅 (단, password/token 등 민감 정보 `[MASKED]` 처리).
  * 이탈 시: 메서드 반환 값(Return Value) 및 실행 시간(Execution Time ms) 로깅.

##### 4.2. 콘솔 로그 포맷 (Console Log Format)
```text
[START] [ReqID: e4a3f1] [Controller] InventoryController.addIngredient() - Args: [IngredientRequestDto(name=계란, quantity=10)]
[START] [ReqID: e4a3f1] [Service] InventoryService.addIngredient() - Args: [userSeq=102, dto=IngredientRequestDto(...)]
[START] [ReqID: e4a3f1] [Mapper] InventoryMapper.insertIngredient() - Args: [IngredientVo(id=null, name=계란, qty=10)]
[END]   [ReqID: e4a3f1] [Mapper] InventoryMapper.insertIngredient() - Return: 1 (Execution Time: 12ms)
[END]   [ReqID: e4a3f1] [Service] InventoryService.addIngredient() - Return: IngredientResponseDto(id=55, name=계란) (Execution Time: 25ms)
[END]   [ReqID: e4a3f1] [Controller] InventoryController.addIngredient() - Return: ApiResponseDto(success=true, data=...) (Execution Time: 32ms)
```

---

#### 5. 전역 예외 처리 & 공통 응답 규격 (Global Exception Handling)
##### 5.1. 공통 API 성공 응답 포맷 (`ApiResponseDto<T>`)
```json
{
  "success": true,
  "data": { ... },
  "message": "성공적으로 처리되었습니다."
}
```

##### 5.2. 공통 API 에러 응답 포맷 (`ErrorResponseDto`)
```json
{
  "success": false,
  "code": "INV_WARN_IMMINENT_EXPIRATION",
  "message": "소비기한이 임박한 재료가 존재합니다.",
  "timestamp": "2026-10-09T14:00:00",
  "fieldErrors": []
}
```

##### 5.3. Exception Handling 정책
* **Custom Exception** : `BusinessException`을 상속받는 도메인별 예외 작성 (예: `IngredientNotFoundException`, `MatchingFailedException`).
* **GlobalExceptionHandler** : `@RestControllerAdvice`에서 비즈니스 예외 및 Valid 에러, 시스템 예외를 일괄 캡처하여 표준 `ErrorResponseDto`로 변환하여 반환.

##### 5.4. 에러 코드 UX 태그 기반 자동 분류 수칙
백엔드는 에러 코드 작성 시 `[도메인]_[UX태그]_[상세원인]` 규격을 사용하며, 프론트엔드는 에러 코드 내 포함된 UX태그에 따라 모달 및 토스트 형태를 자동으로 분기하여 노출한다.
1. **_FIELD_** : 입력 폼 필드 하단에 에러 메시지 바인딩 (react-hook-form 연동).
2. **_INFO_ / _WARN_ / _ERROR_** : Sonner Toast를 통해 색상별(기본/노란색/빨간색) 단발성 토스트 3초간 노출.
3. **_ALERT_** : [확인] 버튼 1개로 구성된 안내 모달 노출.
4. **_CONFIRM_** : [확인] / [취소] 버튼 2개로 구성된 선택형 Confirm 모달 노출.
5. **_FATAL_** : 치명적 시스템 에러 전용 모달(재시도 버튼 포함) 노출.

---

#### 6. 에이전트 작업 로그 및 이력 관리 수칙 (Work Log & Convention)
##### 6.1. 일일 작업 로그 파일 관리 원칙
* **저장 위치** : 모든 일일 작업 로그는 `.agent/logs/YYYY-MM-DD.md` 경로에 날짜별로 생성하여 기록한다. (예: `.agent/logs/2026-10-15.md`)
* **작성 주체** : 각 세션 또는 주요 작업 단위가 종료될 때 에이전트 또는 작업자가 해당 일자의 주요 변경 내역과 커맨드 이력을 정리하여 기록한다.

##### 6.2. 작업 로그 표준 템플릿 양식
작업 로그는 아래의 표준 양식을 엄격히 준수하여 작성한다.

```markdown
# 📅 YYYY-MM-DD 작업 및 명령 로그

## 📌 오늘의 핵심 목표
- [당일 수행한 핵심 작업 목표 요약]

---

## 💬 Command 01. "[유저가 입력한 커맨드/요청]"
- **실행 시각**: HH:MM
- **작업 목적**: [해당 명령의 목적 및 배경 설명]

### 📂 파일 변경 상세 (File Changes)
| 변경 유형 | 파일 경로 | 변경 / 추가 내역 요약 |
| :---: | :--- | :--- |
| `CREATED` / `MODIFIED` | `[파일 경로]` | [변경 요약] |

### 📝 코드/컬럼 수정 상세 (Detailed Edits)
- **[관련 테이블 또는 컴포넌트 명]**:
  * [세부 수정 내역 및 기술적 의사결정 기록]

---
```

##### 6.3. API 테스트 검증 결과 기록 수칙 (.agent/09_API_TEST_RESULTS.md)
* **목적** : API 스펙 문서(`05_API_SPECIFICATION.md`)의 가독성을 유지하면서, 모듈별 API 개발 시 작성한 JUnit 5/Mockito 단위·통합 테스트 시나리오 및 실행 검증 결과를 일관되게 관리한다.
* **작성 규칙** : 신규 API 구현 또는 수정 작업 완료 시, `.agent/09_API_TEST_RESULTS.md`에 테스트 커버리지, 성공/실패 예외 테스트 케이스 실행 결과를 누적 작성한다.
