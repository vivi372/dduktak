### 기술 스택 및 프레임워크/라이브러리 명세
#### 1. 개요
본 문서는 '오늘의 뚝딱' 프로젝트 개발 시 사용할 기술 스택, 프레임워크 버전, 그리고 허용된 라이브러리 목록을 정의한다. AI 에이전트는 본 문서에 명시된 라이브러리 외에 새로운 패키지를 추가할 경우 **반드시 대화를 통해 유저에게 직접 필요 사유를 설명하고 승인을 받은 후 추가해야 한다**.

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
*   **Framework** : React (Vite 기반)
*   **Hybrid Mobile App** : **Capacitor 6.x (React 통합형 하이브리드 앱)**
    *  Android / iOS 웹뷰 패키징 및 React 단일 코드베이스 통합
    *  Google ML Kit 바코드 스캐너 네이티브 카메라 플러그인 연동 (@capacitor/camera, @capacitor-community/barcode-scanner)
    *  FCM (Firebase Cloud Messaging) 네이티브 푸시 수신기 연동 (@capacitor/push-notifications)
    *  앱 딥링크(Deep Link) 라우터 파싱 및 네이티브 앱 상태 제어 (@capacitor/app)
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
4.  **이미지 최적화 & 클라이언트 압축** : `browser-image-compression` (클라이언트 측 1MB 이하 압축/리사이징) + react-loading-skeleton (Skeleton UI)
5.  **날짜 처리** : date-fns (소비기한 D-Day 계산 및 30일 경과 연산)

--------------------------------------------------------------------------------

#### 5. 라이브러리 및 처리 역할 분담 수칙

##### 5.1. 이미지 처리 및 업로드 아키텍처 (2가지 핵심 분기 정책)
*   **A. 프로필 / 레시피 썸네일 / 조리 Step 이미지 (영구 보관용)** :
    *   **방식** : **클라이언트(React) ➔ Supabase Storage 직접 업로드 (Direct Upload)**
    *   **흐름** : 사용자가 이미지를 선택하면, 클라이언트 단에서 `browser-image-compression` 라이브러리를 사용해 1MB 이하(WebP/JPEG, 가로 1080px)로 압축 및 리사이징 후 Supabase Storage SDK(`supabase.storage.from('recipes').upload(...)`)로 직접 업로드한다. 업로드 성공 시 반환되는 Public URL 문자열만 백엔드 API (`POST /api/v1/recipes`, `PATCH /api/v1/auth/me`)의 DTO 필드(`thumbnailUrl`, `imageUrl`, `profileImage`)에 담아 전송한다.
    *   **목적** : Render 백엔드 서버(512MB RAM 제약)의 메모리/트래픽 부하 및 OOM(Out Of Memory) 위험을 원천 차단하고 Supabase Storage 무료 티어(500MB) 범위 내에서 효율적 활용.
*   **B. 영수증 OCR 스캔 이미지 (휘발성 분석용)** :
    *   **방식** : **클라이언트 단 압축 후 백엔드 프록시 API (`POST /api/v1/inventory/scan-ocr`) 전송**
    *   **흐름** : 모바일 고화질 원본(5~10MB)을 Canvas API를 통해 최대 너비 1200px, 품질 0.7~0.8 수준(300~500KB)으로 리사이징하여 백엔드로 전송한다. 백엔드는 영구 디스크 저장 없이 임시 메모리 스트림으로 OCR 엔진(Clova OCR 등)에 전달하여 식재료 JSON 데이터를 추출한 후 이미지는 즉시 가비지 컬렉션(GC) 처리한다.

##### 5.2. 핵심 정책 정리
*   🚨 **[필수 정책]**: 레시피 및 프로필 이미지는 **"클라이언트 ➔ Supabase Storage 직접 업로드"** 방식을 적용하여 Render 서버의 512MB RAM 부하를 원천 차단한다.
*   ⚠️ **[권장 정책]**: 모바일 웹 특성상 사용자가 원본 고화질 사진(10MB+)을 바로 올리지 않도록, 프론트엔드 단에서 압축/리사이징 후 업로드하도록 처리한다.
*   **신규 패키지 추가 절차** : 목록에 없는 외부 라이브러리가 필요할 경우, 에이전트가 대화를 통해 유저에게 직접 필요 사유를 설명하고 승인을 받은 후 추가한다.

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
*   **영구 저장 이미지 업로드 금지** : 프로필/레시피 이미지는 클라이언트 direct upload 방식을 사용하므로 백엔드 멀티파트 업로드 컨트롤러를 두지 않으며, OCR 전용 휘발성 이미지 요청 크기만 제한(max-file-size: 2MB)한다.

##### 5.3. Supabase Storage 버킷 & RLS 설정 (Supabase MCP 지원)
*   **기본 프로필 이미지 URL**: `https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/profiles/Default%20Profile.png`
*   **버킷 구성**: `profiles` (유저 프로필 전용), `recipes` (레시피 썸네일 및 조리 Step 전용) - 모두 Public 버킷으로 구성.
*   **MCP(Model Context Protocol) 자동화**: Supabase MCP 도구/통합을 활용하여 Storage 버킷 생성 및 RLS 보안 정책(Public Read, Authenticated Insert/Update/Delete)을 일괄 자동으로 설정할 수 있습니다.
