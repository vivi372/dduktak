# 📊 백엔드 API 테스트 시나리오 및 검증 결과서 (09_API_TEST_RESULTS.md)

## 1. 개요 및 테스트 원칙
본 문서는 '오늘의 뚝딱' 프로젝트의 도메인 모듈별 REST API 개발에 따른 JUnit 5 / Mockito 단위·슬라이스·통합 테스트 시나리오 및 실행 검증 결과를 누적 관리하는 공식 문서이다.
`05_API_SPECIFICATION.md`의 순수 엔드포인트 명세성을 보존하면서, 실제 백엔드 코드의 비즈니스 로직 및 예외 처리 신뢰성을 보증한다.

---

## 2. [모듈 1] 회원 및 인증 API (/api/v1/auth) 테스트 검증 결과

* **테스트 실행 일자**: 2026-10-20
* **아키텍처 전환**: Spring Boot 자체 회원가입 ➔ Supabase Auth + `public.profiles` (Lazy JIT Sync) 하이브리드 아키텍처 리팩토링
* **테스트 대상 클래스**:
  - `com.dduktak.global.util.JwtProviderTest`
  - `com.dduktak.domain.auth.service.AuthServiceTest`
  - `com.dduktak.domain.auth.controller.AuthControllerTest`
  - `com.dduktak.global.config.SecurityConfigTest`
  - `com.dduktak.domain.auth.mapper.ProfileMapperIntegrationTest`
* **테스트 커버리지 결과**: 모듈 1 관련 테스트 포함 전역 49개 테스트 케이스 **100% 성공 (0 Failures, 0 Errors)**

---

### 2.1. 세부 테스트 케이스 명세 및 검증 매트릭스

| ID | 테스트 분류 | 대상 엔드포인트 / 메서드 | 테스트 시나리오 및 검증 기준 | 결과 |
| :-: | :---: | :--- | :--- | :---: |
| **TC-AUTH-01** | `단위` | `POST /api/v1/auth/init`<br>`AuthService.initProfile()` | **첫 로그인 시점 지연 프로필 생성 및 멱등성 검증 (AUTH-01-2, AUTH-02-2)**<br>1. 첫 로그인 유저 미등록 감지 시 4자리 고유 `userTag` 자동 생성 및 기본 프로필 `public.profiles` 저장 검증<br>2. 기등록된 유저 재호출 시 신규 INSERT 없이 기존 프로필 정보를 즉시 반환하는 멱등성 검증 | **성공** |
| **TC-AUTH-02** | `단위` | `GET /api/v1/auth/me`<br>`AuthService.getMyProfile()` | **본인 프로필 조회 (Read-Only 멱등 API)**<br>1. 회원 UUID로 조회 시 `auth.users` LEFT JOIN을 통해 이메일, 닉네임, 유저 태그, 프로필 이미지, 상태(ACTIVE), 방해금지 시간 정상 반환<br>2. 미존재 프로필 조회 시 `AUTH_WARN_USER_NOT_FOUND`(404 Not Found) 예외 발생 검증 | **성공** |
| **TC-AUTH-03** | `단위` | `PATCH /api/v1/auth/me`<br>`AuthService.updateMyProfile()` | **프로필 수정 및 중복 검증 (USER-01-3)**<br>1. 닉네임(2~10자) 및 프로필 이미지 수정 정상 반영 검증<br>2. 기존 유저 태그 유지 하에 신규 닉네임+태그 조합 중복 발생 시 `AUTH_FIELD_DUPLICATE_NICKNAME`(409 Conflict) 예외 발생 검증 | **성공** |
| **TC-AUTH-04** | `단위` | `PATCH /api/v1/auth/me/quiet-time`<br>`AuthService.updateQuietTime()` | **야간 방해금지 시간대 설정 (USER-PAGE-04)**<br>`quietTimeStart`, `quietTimeEnd` 필드 DB 업데이트 및 응답 DTO 반환 검증 | **성공** |
| **TC-AUTH-05** | `단위` | `DELETE /api/v1/auth/withdraw`<br>`AuthService.withdraw()` | **회원 탈퇴 및 데이터 처리 정책 (USER-02)**<br>1. 이메일 회원 탈퇴 시 `auth.users` 비밀번호 검증 후 `recipe.user_id = NULL` 선제 익명화 및 프로필 삭제(Cascade) 호출 검증<br>2. 비밀번호 불일치 시 `AUTH_CONFIRM_WITHDRAWAL_FAILED`(400 Bad Request) 예외 발생 및 탈퇴 중단 검증 | **성공** |
| **TC-SEC-01** | `통합` | `SecurityFilterChain`<br>`JwtAuthenticationEntryPoint` | **보호 엔드포인트 미인증 차단 검증**<br>`/init`, `/me`, `/withdraw`에 Bearer 토큰 없이 접근 시 401 Unauthorized 및 `AUTH_ALERT_UNAUTHORIZED` JSON 규격 반환 검증 | **성공** |
| **TC-SEC-02** | `통합` | `SecurityFilterChain`<br>`JwtAuthenticationFilter` | **Supabase JWT Bearer 토큰 인가 연동 검증**<br>유효한 Supabase Access Token 헤더 전달 시 UUID 기반 `UserPrincipal` 인증 주체 등록 및 정상 200 반환 | **성공** |
| **TC-SEC-03** | `통합` | `SecurityFilterChain`<br>`JwtAuthenticationFilter` | **유효하지 않거나 만료된 토큰 차단 검증**<br>서명 불일치 또는 위조된 토큰으로 접근 시 401 Unauthorized 거부 | **성공** |
| **TC-JWT-01** | `단위` | `JwtProvider` | **Supabase JWT 파싱 및 클레임 추출 검증**<br>토큰 서명 검증, `sub` 클레임의 `UUID` 파싱, `email`, `role`, `user_metadata` 추출 및 만료/위조 감지 검증 | **성공** |
| **TC-MAP-01** | `통합` | `ProfileMapper` & PostgreSQL | **PostgreSQL 실제 쿼리 무결성 검증**<br>`insertProfile`, `findById`, `findProfileWithEmailById`(auth.users JOIN), `existsById`, `existsByNicknameAndUserTag`, `updateProfile`, `updateQuietTime`, `anonymizeRecipesByUserId`, `deleteProfileById` 전체 CRUD 생명주기 검증 | **성공** |
| **TC-CTL-01** | `슬라이스` | `AuthController`<br>`GlobalExceptionHandler` | **Request DTO 유효성 검증 (@Valid)**<br>닉네임 2자 미만 입력 시 400 Bad Request 및 `COMMON_FIELD_INVALID_INPUT` 반환 검증 | **성공** |
| **TC-CTL-02** | `슬라이스` | `TraceIdFilter` | **응답 헤더 X-Trace-Id 주입 검증**<br>모든 Auth API 응답 헤더에 6자리 무작위 `X-Trace-Id` 주입 및 MDC 라이프사이클 검증 | **성공** |

---

### 2.2. Gradle 빌드 및 전체 테스트 실행 결과 로그

```text
> Task :compileJava
> Task :processResources
> Task :classes
> Task :compileTestJava UP-TO-DATE
> Task :processTestResources NO-SOURCE
> Task :testClasses UP-TO-DATE
> Task :test

BUILD SUCCESSFUL in 11s
49 tests completed, 0 failed, 0 skipped.
```
