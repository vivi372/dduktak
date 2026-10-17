### 프로젝트 아키텍처, 컨벤션 및 로깅/예외 처리 명세

#### 1. 개요
본 문서는 '오늘의 뚝딱' 프로젝트의 디렉토리 아키텍처, 코딩 컨벤션, 백엔드 AOP 로깅 정책, 그리고 전역 예외 처리(Global Exception Handling) 규격을 정의한다. AI 에이전트는 코드 작성 시 본 문서에 명시된 규칙을 엄격히 준수해야 한다.

#### 2. 프로젝트 디렉토리 구조 (Monorepo Directory Architecture)
```text
dduktak/                              # 루트 (Git Repository Root)
├── .agent/                           # AI 개발 에이전트 패키지 (가이드라인 문서 & 작업 로그)
│   ├── 00_SYSTEM_PROMPT.md           # 시스템 페르소나 및 기본 가이드
│   ├── 01_TECH_STACK_AND_LIBS.md     # 기술 스택 명세
│   ├── 02_ARCHITECTURE_AND_CONVENTIONS.md # 모노레포 구조, 컨벤션, 로깅, 예외처리
│   ├── 03_REQUIREMENTS_SUMMARY.md    # 요구사항 요약
│   ├── 04_DATABASE_SCHEMA.md         # DB 스키마 & DDL
│   ├── 05_API_SPECIFICATION.md       # API 엔드포인트 명세
│   ├── 06_UI_UX_GUIDELINES.md       # UI/UX 가이드라인
│   ├── 07_TEST_SCENARIOS.md          # 핵심 비즈니스 인수 테스트 시나리오
│   ├── 08_DEVELOPMENT_MASTER_PLAN.md # 개발 상세 마스터 플랜
│   ├── ingredient_master_seed.md     # 식재료 마스터 시드 DDL
│   ├── recipe_seed.md                # 레시피 30선 시드 DDL
│   ├── 전달_문서_체계.txt              # 문서 패키지 체계 개요
│   └── logs/                         # 에이전트 일일 작업 및 커맨드 로그
│       └── YYYY-MM-DD.md             # 일자별 작업 이력
│
├── backend/                          # 백엔드 프로젝트 (Spring Boot 3.x - Java 17, Render 배포)
│   ├── .gitignore
│   ├── build.gradle
│   ├── settings.gradle
│   └── src/
│       ├── main/
│       │   ├── java/com/dduktak/
│       │   │   ├── global/           # Security, MyBatis, WebMvc, AOP, Cors, Error
│       │   │   │   ├── config/       # 환경 설정 클래스
│       │   │   │   ├── error/        # ErrorCode, GlobalExceptionHandler, CustomException
│       │   │   │   ├── aspect/       # AOP 로깅 및 TraceID 추적 (LoggingAspect.java)
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
├── frontend/                         # 프론트엔드 프로젝트 (React 18 + TypeScript + Vite, Vercel 배포)
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
├── docker-compose.yml                 # 로컬 인프라 환경 (PostgreSQL 15+, Supabase/Redis 등)
├── .gitignore                         # 루트 Git 이그노어
└── README.md                          # 모노레포 프로젝트 루트 설명서
```

#### 3. 코딩 컨벤션 (Coding Conventions)
##### 3.1. 네이밍 규칙
* **데이터베이스 (PostgreSQL)** : snake_case (예: `user_id`, `expire_date`)
* **Java / Spring** :
  * 클래스/인터페이스: PascalCase (예: `InventoryService`, `RecipeMapper`)
  * 변수/메서드: camelCase (예: `getIngredientList()`, `matchingRate`)
  * 상수: SNAKE_CASE_UPPER (예: `MAX_MATCH_COUNT`)
* **TypeScript / React** :
  * 컴포넌트/파일: PascalCase.tsx (예: `InventoryAccordion.tsx`)
  * 유틸/훅/변수: camelCase.ts (예: `useAuth.ts`, `calculateDDay()`)

#### 4. AOP 로깅 & 트레이싱 정책
* **대상** : `com.dduktak.domain..*Controller.*(..)`, `Service.*(..)`, `Mapper.*(..)`
* **기능** : HTTP 요청마다 6자리 무작위 Trace ID 생성, 진입 시 매개변수(Args) 로깅, 이탈 시 반환값 및 실행시간 로깅.

#### 5. 전역 예외 처리 & 공통 응답 규격
* **성공 응답**: `ApiResponseDto<T>` (`success`, `data`, `message`)
* **에러 응답**: `ErrorResponseDto` (`success`, `code`, `message`, `timestamp`)
* **UX 태그 기반 에러 코드 분기**: `_FIELD_`, `_INFO_`, `_WARN_`, `_ALERT_`, `_CONFIRM_`, `_FATAL_`
