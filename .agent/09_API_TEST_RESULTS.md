# 📊 백엔드 API 테스트 시나리오 및 검증 결과서 (09_API_TEST_RESULTS.md)

## 1. 개요 및 테스트 원칙
본 문서는 '오늘의 뚝딱' 프로젝트의 도메인 모듈별 REST API 개발에 따른 JUnit 5 / Mockito 단위·슬라이스·통합 테스트 시나리오 및 실행 검증 결과를 누적 관리하는 공식 문서이다.
`05_API_SPECIFICATION.md`의 순수 엔드포인트 명세성을 보존하면서, 실제 백엔드 코드의 비즈니스 로직 및 예외 처리 신뢰성을 보증한다.

---

## 2. [모듈 1] 회원 및 인증 API (/api/v1/auth) 테스트 검증 결과

* **테스트 실행 일자**: 2026-10-19
* **테스트 대상 클래스**:
  - `com.dduktak.global.util.JwtProviderTest`
  - `com.dduktak.domain.auth.service.AuthServiceTest`
  - `com.dduktak.domain.auth.controller.AuthControllerTest`
  - `com.dduktak.global.config.SecurityConfigTest`
  - `com.dduktak.domain.auth.mapper.UserMapperIntegrationTest`
* **테스트 커버리지 결과**: 모듈 1 관련 총 30개 테스트 케이스 **100% 성공 (0 Failures, 0 Errors)**

---

### 2.1. 세부 테스트 케이스 명세 및 검증 매트릭스

| ID | 테스트 분류 | 대상 엔드포인트 / 메서드 | 테스트 시나리오 및 검증 기준 | 결과 |
| :-: | :---: | :--- | :--- | :---: |
| **TC-AUTH-01** | `단위` | `POST /api/v1/auth/signup`<br>`AuthService.signup()` | **이메일 회원가입 및 중복 검증**<br>1. 신규 이메일 가입 시 4자리 난수 `userTag` 자동 생성 및 DB 저장 검증<br>2. 기등록된 이메일 가입 시도 시 `AUTH_FIELD_DUPLICATE_EMAIL`(409 Conflict) 예외 발생 검증 | **성공** |
| **TC-AUTH-02** | `단위` | `POST /api/v1/auth/login`<br>`AuthService.login()` | **이메일 로그인 및 JWT 발급**<br>1. 올바른 이메일/비밀번호 입력 시 Access Token 및 Refresh Token 정상 반환<br>2. 미존재 이메일 또는 비밀번호 불일치 시 `AUTH_WARN_INVALID_CREDENTIALS`(401 Unauthorized) 예외 발생 검증 | **성공** |
| **TC-AUTH-03** | `단위` | `POST /api/v1/auth/refresh`<br>`AuthService.refresh()` | **Refresh Token 기반 토큰 재발급**<br>1. 유효한 Refresh Token 전달 시 신규 Access/Refresh 토큰 세트 반환 검증<br>2. 만료된 토큰 또는 잘못된 토큰 타입(ACCESS 토큰) 전달 시 `AUTH_ALERT_INVALID_TOKEN` 예외 발생 검증 | **성공** |
| **TC-AUTH-04** | `단위` | `DELETE /api/v1/auth/withdraw`<br>`AuthService.withdraw()` | **회원 탈퇴 및 데이터 처리 정책 (USER-02)**<br>1. 이메일 회원 탈퇴 시 비밀번호 검증 후 `recipe.user_id = NULL` 선제 익명화 및 회원 삭제(Cascade) 호출 검증<br>2. 비밀번호 불일치 시 `AUTH_CONFIRM_WITHDRAWAL_FAILED` 예외 발생 및 삭제 중단 검증 | **성공** |
| **TC-AUTH-05** | `단위` | `GET /api/v1/auth/me`<br>`AuthService.getMyProfile()` | **본인 프로필 조회**<br>회원 PK로 조회 시 이메일, 닉네임, 유저 태그, 프로필 이미지, 야간 방해금지 시간 정상 반환 | **성공** |
| **TC-AUTH-06** | `단위` | `PATCH /api/v1/auth/me`<br>`AuthService.updateMyProfile()` | **프로필 수정 및 중복 검증**<br>1. 닉네임 및 프로필 이미지 수정 성공<br>2. 기존 유저 태그 유지 하에 신규 닉네임+태그 조합 중복 발생 시 `AUTH_FIELD_DUPLICATE_NICKNAME` 예외 발생 검증 | **성공** |
| **TC-AUTH-07** | `단위` | `PATCH /api/v1/auth/me/quiet-time`<br>`AuthService.updateQuietTime()` | **방해금지 시간대 설정**<br>`quietTimeStart`, `quietTimeEnd` 필드 DB 업데이트 및 응답 DTO 반환 검증 | **성공** |
| **TC-SEC-01** | `통합` | `SecurityFilterChain` | **공개 엔드포인트 인가 검증**<br>`/signup`, `/login`, `/refresh`는 비인증 상태에서도 HTTP 200 허용 | **성공** |
| **TC-SEC-02** | `통합` | `SecurityFilterChain`<br>`JwtAuthenticationEntryPoint` | **보호 엔드포인트 미인증 차단 검증**<br>`/me`, `/withdraw`에 토큰 없이 접근 시 401 Unauthorized 및 `AUTH_ALERT_UNAUTHORIZED` JSON 규격 반환 검증 | **성공** |
| **TC-SEC-03** | `통합` | `SecurityFilterChain`<br>`JwtAuthenticationFilter` | **Bearer Access Token 인가 연동 검증**<br>유효한 Access Token 헤더 전달 시 `UserPrincipal` 인증 주체 등록 및 정상 200 반환 | **성공** |
| **TC-SEC-04** | `통합` | `SecurityFilterChain`<br>`JwtAuthenticationFilter` | **Refresh Token을 Authorization 헤더로 오용 시 차단**<br>Refresh Token을 Bearer로 전달하여 보호된 리소스 접근 시 401 Unauthorized 거부 | **성공** |
| **TC-JWT-01** | `단위` | `JwtProvider` | **JJWT 0.12.x 토큰 생성 및 클레임 추출**<br>Access Token(24h), Refresh Token(7d) 발급, 서명 검증, 만료 및 변조 토큰 감지 검증 | **성공** |
| **TC-MAP-01** | `통합` | `UserMapper` & DB | **PostgreSQL 실제 쿼리 무결성 검증**<br>`insertUser`, `findById`, `findByEmail`, `existsByEmail`, `existsByNicknameAndUserTag`, `updateProfile`, `updateQuietTime`, `deleteUserById` 전체 트랜잭션 CRUD 검증 | **성공** |
| **TC-CTL-01** | `슬라이스` | `AuthController`<br>`GlobalExceptionHandler` | **Request DTO 유효성 검증 (@Valid)**<br>비밀번호 8자 미만/특수문자 누락, 이메일 형식 오류 시 400 Bad Request 및 `COMMON_FIELD_INVALID_INPUT` 반환 검증 | **성공** |
| **TC-CTL-02** | `슬라이스` | `TraceIdFilter` | **응답 헤더 X-Trace-Id 주입 검증**<br>모든 Auth API 응답 헤더에 6자리 무작위 `X-Trace-Id` 주입 및 MDC 라이프사이클 검증 | **성공** |

---

### 2.2. Gradle 빌드 및 전체 테스트 실행 결과 로그

```text
> Task :cleanTest
> Task :compileJava UP-TO-DATE
> Task :processResources UP-TO-DATE
> Task :classes UP-TO-DATE
> Task :compileTestJava UP-TO-DATE
> Task :testClasses UP-TO-DATE
> Task :test

BUILD SUCCESSFUL in 11s
53 tests completed, 0 failed, 0 skipped.
```
