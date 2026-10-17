### 기술 스택 및 프레임워크/라이브러리 명세
#### 1. 개요
본 문서는 '오늘의 뚝딱' 프로젝트 개발 시 사용할 기술 스택, 프레임워크 버전, 그리고 허용된 라이브러리 목록을 정의한다. AI 에이전트는 본 문서에 명시된 라이브러리 외에 새로운 패키지를 추가할 경우  **반드시 유저에게 사전 동의를 구해야 한다** .

--------------------------------------------------------------------------------

#### 2. 백엔드 기술 스택 (Backend Stack)
*   **Language** : Java 17 (LTS)
*   **Framework** : Spring Boot 3.x
*   **Persistence Layer** : MyBatis 3.x (@Mapper + XML Mapper 방식)
*   **Database Driver** : PostgreSQL JDBC Driver
*   **Security & Auth** : Spring Security + jjwt (Java JWT 0.11.x 이상)
*   **Batch Scheduler** : Spring @Scheduled (소비기한 일괄 알림용)
*   **Logging & Tracing** :
    *  log4jdbc-log4j2: MyBatis 바인딩 쿼리 및 Executed SQL 콘솔 출력
    *  Spring AOP: Controller-Service-Mapper 레이어 간 이동 및 Executed Time 추적 로그 자동화
*   **Core Libraries** :
    *  Lombok: 개발 생산성을 위한 어노테이션 기반 라이브러리
    *  Spring Boot Starter Web: RESTful API 구축
    *  Spring Boot Starter Validation: @Valid 기반 Request DTO 검증
    *  Spring Boot Starter AOP: 메서드 실행 관점 지향 프로그래밍

--------------------------------------------------------------------------------

#### 3. 프론트엔드 기술 스택 (Frontend Stack)
*   **Framework** : React (Vite 기반) 또는 Next.js (App Router)
*   **Language** : TypeScript
*   **State Management** :
    *  Zustand: 유저 세션 및 클라이언트 로컬 상태 관리 (경량)
    *  @tanstack/react-query: 서버 데이터 패칭, 캐싱, 낙관적 업데이트(Optimistic Update)
*   **Form & Validation** :
    *  react-hook-form: 복잡한 Form 상태 및 입력 제어
    *  zod: TypeScript First Schema Validation (DTO 검증용)
*   **Styling & Design System** :
    *  Tailwind CSS: 기본 유틸리티 클래스 스타일링
    *  clsx, tailwind-merge: 조건부 클래스 조합 유틸리티

--------------------------------------------------------------------------------

#### 4. UI 완성도 향상을 위한 권장 UI 라이브러리
1.  **아이콘 패키지** : lucide-react (일관된 UI 아이콘 세트)
2.  **컴포넌트 베이스 & 알림** : Shadcn UI (Dialog/AlertDialog, Accordion) + sonner (Toast 전용 패키지)
3.  **애니메이션** : framer-motion (아코디언 열림/닫힘, 탭 전환 모션)
4.  **이미지 최적화 & 로딩** : react-loading-skeleton (Skeleton UI)
5.  **날짜 처리** : date-fns (소비기한 D-Day 계산 및 30일 경과 연산)

--------------------------------------------------------------------------------

#### 5. 라이브러리 및 처리 역할 분담 수칙
1.  **스캔/OCR 비즈니스 로직 역할 분담** :
    *  영수증/바코드 등 이미지 및 카메라 데이터 스캔 처리는 프론트엔드에서 파싱하지 않으며,  **백엔드 API로 전달하여 백엔드에서 정제 및 데이터 반환** 을 담당한다.
2.  **신규 패키지 추가 절차** :
    *  목록에 없는 외부 라이브러리가 필요할 경우, 에이전트가 대화를 통해 유저에게 직접 필요 사유를 설명하고 승인을 받은 후 추가한다.

--------------------------------------------------------------------------------

#### 6. 보안 및 환경변수 관리 정책 (Security & Environment Variables)
##### 6.1. 환경변수 관리 원칙
*   **.env 파일 커밋 금지** : 데이터베이스 접속 정보, JWT Secret Key, 외부 API Key 등이 포함된 실제 .env 파일은 절대 Git에 커밋하지 않으며, .gitignore에 반드시 포함한다.
*   **.env.example 템플릿 유지** : 프로젝트 루트에 필요한 환경변수 키 이름만 정의된 .env.example 템플릿 파일을 공유하여 팀원 및 AI 에이전트가 환경 설정 항목을 직관적으로 파악할 수 있게 한다.
##### 6.2. 프론트엔드 (React / Vercel) 보안 규칙
*   **관리자 키 노출 차단** : Supabase의 service_role Key(모든 RLS 권한을 우회하는 관리자 키)는 절대 프론트엔드 코드나 환경변수(VITE_...)에 포함시켜서는 안 된다.
*   **공개키 분리** : 클라이언트에는 오직 퍼블릭 접근용 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY만 주입하여 사용한다.
##### 6.3. 백엔드 (Spring Boot / Render) 보안 규칙
*   **설정 파일 분리** : application.yml 내 DB 비밀번호, JWT Secret Key, 외부 API 연동 키 등은 하드코딩을 금지하고 Spring 환경변수 매핑 규격(${ENV_NAME:defaultValue})을 엄격히 준수한다.
*   **파일 업로드 용량 제한** : 멀티파트 요청 시 과도한 파일 업로드로 인한 서버 부하를 방지하기 위해 파일 크기(max-file-size, max-request-size)를 적정 수준(예: 10MB)으로 제한한다.
