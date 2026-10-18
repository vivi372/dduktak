package com.dduktak.global.aspect;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.stereotype.Service;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * LoggingAspect 단위 및 통합 동작 검증 테스트
 * SLF4J MDC Trace ID 발급/전파/수명주기, 민감 정보 마스킹, 실행 시간 및 예외 로깅을 검증합니다.
 */
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {LoggingAspectTest.TestConfig.class})
class LoggingAspectTest {

    @Autowired
    private TestAspectController testController;

    @Autowired
    private TestAspectService testService;

    private Logger aspectLogger;
    private ListAppender<ILoggingEvent> listAppender;

    @Configuration
    @EnableAspectJAutoProxy(proxyTargetClass = true)
    static class TestConfig {
        @Bean
        public LoggingAspect loggingAspect() {
            return new LoggingAspect();
        }

        @Bean
        public TestAspectService testAspectService() {
            return new TestAspectService();
        }

        @Bean
        public TestAspectController testAspectController(TestAspectService testAspectService) {
            return new TestAspectController(testAspectService);
        }
    }

    @BeforeEach
    void setUp() {
        MDC.clear();
        aspectLogger = (Logger) LoggerFactory.getLogger(LoggingAspect.class);
        listAppender = new ListAppender<>();
        listAppender.start();
        aspectLogger.addAppender(listAppender);
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
        if (aspectLogger != null && listAppender != null) {
            aspectLogger.detachAppender(listAppender);
        }
    }

    @Test
    @DisplayName("Trace ID 생성 및 MDC 정리: 컨트롤러 호출 시 6자리 Trace ID가 생성되고 종료 후 MDC가 clear되어야 한다")
    void traceId_ShouldBeGeneratedAndCleared_WhenControllerInvoked() {
        // when
        String capturedTraceId = testController.simpleCall();

        // then
        assertThat(capturedTraceId).isNotNull();
        assertThat(capturedTraceId).hasSize(6);
        assertThat(capturedTraceId).matches("^[A-Z0-9]{6}$");

        // 메서드 종료 후 MDC는 반드시 정리(null)되어야 함
        assertThat(MDC.get(LoggingAspect.TRACE_ID_KEY)).isNull();

        // 로그 기록 검증
        List<String> logMessages = listAppender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .toList();

        assertThat(logMessages).anyMatch(msg -> msg.contains("--> [START] [CONTROLLER] TestAspectController.simpleCall()"));
        assertThat(logMessages).anyMatch(msg -> msg.contains("<-- [END] [CONTROLLER] TestAspectController.simpleCall()"));
    }

    @Test
    @DisplayName("Trace ID 전파: 컨트롤러에서 서비스 호출 시 동일한 6자리 Trace ID가 전파되어야 한다")
    void traceId_ShouldBePropagated_FromControllerToService() {
        // when
        TracePair pair = testController.callService();

        // then
        assertThat(pair.controllerTraceId).isNotNull();
        assertThat(pair.serviceTraceId).isNotNull();
        assertThat(pair.controllerTraceId).hasSize(6);
        assertThat(pair.controllerTraceId).isEqualTo(pair.serviceTraceId);

        // 호출 종료 후 MDC 정리 확인
        assertThat(MDC.get(LoggingAspect.TRACE_ID_KEY)).isNull();

        // 컨트롤러와 서비스 로그가 순서대로 남아있는지 확인
        List<String> logMessages = listAppender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .toList();

        assertThat(logMessages).anyMatch(msg -> msg.contains("--> [START] [CONTROLLER] TestAspectController.callService()"));
        assertThat(logMessages).anyMatch(msg -> msg.contains("--> [START] [SERVICE] TestAspectService.serviceCall()"));
        assertThat(logMessages).anyMatch(msg -> msg.contains("<-- [END] [SERVICE] TestAspectService.serviceCall()"));
        assertThat(logMessages).anyMatch(msg -> msg.contains("<-- [END] [CONTROLLER] TestAspectController.callService()"));
    }

    @Test
    @DisplayName("독립 서비스 호출: 컨트롤러 없이 서비스 단독 호출 시에도 Trace ID 발급 및 MDC clear가 보장되어야 한다")
    void traceId_ShouldBeGeneratedAndCleared_WhenServiceInvokedDirectly() {
        // when
        String capturedTraceId = testService.serviceCall();

        // then
        assertThat(capturedTraceId).isNotNull();
        assertThat(capturedTraceId).hasSize(6);
        assertThat(capturedTraceId).matches("^[A-Z0-9]{6}$");

        // 호출 종료 후 MDC 정리 확인
        assertThat(MDC.get(LoggingAspect.TRACE_ID_KEY)).isNull();

        // 서비스 로그 확인
        List<String> logMessages = listAppender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .toList();

        assertThat(logMessages).anyMatch(msg -> msg.contains("--> [START] [SERVICE] TestAspectService.serviceCall()"));
        assertThat(logMessages).anyMatch(msg -> msg.contains("<-- [END] [SERVICE] TestAspectService.serviceCall()"));
    }

    @Test
    @DisplayName("예외 발생 시 MDC clear 보장: 예외가 발생해도 MDC가 정리되고 에러 로그가 기록되어야 한다")
    void mdc_ShouldBeCleared_WhenExceptionOccurs() {
        // when & then
        assertThatThrownBy(() -> testController.throwException("비정상 오류 발생"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("비정상 오류 발생");

        // 예외 발생 후에도 MDC가 누수되지 않고 정리되어야 함
        assertThat(MDC.get(LoggingAspect.TRACE_ID_KEY)).isNull();

        // 에러 로그 기록 확인
        List<ILoggingEvent> errorLogs = listAppender.list.stream()
                .filter(event -> event.getLevel() == Level.ERROR)
                .toList();

        assertThat(errorLogs).isNotEmpty();
        assertThat(errorLogs.get(0).getFormattedMessage())
                .contains("<-- [ERROR] [CONTROLLER] TestAspectController.throwException()")
                .contains("Exception: IllegalStateException - 비정상 오류 발생");
    }

    @Test
    @DisplayName("민감 정보 마스킹 (파라미터명): password, token 등의 파라미터는 ****로 마스킹되어야 한다")
    void masking_ShouldMaskSensitiveParameters() {
        // given
        String plainPassword = "my-secret-password-1234";
        String plainToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M";

        // when
        testController.login("user@dduktak.com", plainPassword, plainToken);

        // then
        List<String> logMessages = listAppender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .toList();

        // 평문 비밀번호가 로그에 노출되지 않아야 함
        assertThat(logMessages).noneMatch(msg -> msg.contains(plainPassword));
        // 마스킹된 형태로 기록되어야 함
        assertThat(logMessages).anyMatch(msg -> msg.contains("password=****"));
        assertThat(logMessages).anyMatch(msg -> msg.contains("token=****"));
    }

    @Test
    @DisplayName("민감 정보 마스킹 (DTO 내부 및 반환값): DTO toString 내 password 필드와 JWT 토큰이 마스킹되어야 한다")
    void masking_ShouldMaskDtoAndReturnValue() {
        // given
        TestLoginDto dto = new TestLoginDto("chef@dduktak.com", "super-secret-pw");

        // when
        TestLoginResponse response = testController.loginWithDto(dto);

        // then
        List<String> logMessages = listAppender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .toList();

        // DTO 내부의 평문 비밀번호 미노출 확인
        assertThat(logMessages).noneMatch(msg -> msg.contains("super-secret-pw"));
        assertThat(logMessages).anyMatch(msg -> msg.contains("password=****"));

        // 반환값 토큰 마스킹 확인
        assertThat(logMessages).anyMatch(msg -> msg.contains("Return: [PROTECTED_TOKEN]"));
    }

    @Test
    @DisplayName("특수 객체 처리: HttpServletRequest 및 MultipartFile이 예외 없이 안전하게 요약 로깅되어야 한다")
    void specialObjects_ShouldBeLoggedSafely() {
        // given
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockMultipartFile file = new MockMultipartFile("recipeImage", "food.png", "image/png", new byte[1024]);

        // when
        testController.upload(request, file);

        // then
        List<String> logMessages = listAppender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .toList();

        assertThat(logMessages).anyMatch(msg -> msg.contains("request=[HttpServletRequest]"));
        assertThat(logMessages).anyMatch(msg -> msg.contains("[MultipartFile: food.png, 1024 bytes]"));
    }

    // --- 테스트용 보조 도메인 클래스 ---

    @RestController
    static class TestAspectController {
        private final TestAspectService testAspectService;

        public TestAspectController(TestAspectService testAspectService) {
            this.testAspectService = testAspectService;
        }

        public String simpleCall() {
            return MDC.get(LoggingAspect.TRACE_ID_KEY);
        }

        public TracePair callService() {
            String ctrlTrace = MDC.get(LoggingAspect.TRACE_ID_KEY);
            String svcTrace = testAspectService.serviceCall();
            return new TracePair(ctrlTrace, svcTrace);
        }

        public void throwException(String message) {
            throw new IllegalStateException(message);
        }

        public String login(String email, String password, String token) {
            return "SUCCESS";
        }

        public TestLoginResponse loginWithDto(TestLoginDto dto) {
            return new TestLoginResponse("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M");
        }

        public String upload(MockHttpServletRequest request, MockMultipartFile file) {
            return "UPLOAD_SUCCESS";
        }
    }

    @Service
    static class TestAspectService {
        public String serviceCall() {
            return MDC.get(LoggingAspect.TRACE_ID_KEY);
        }
    }

    static class TracePair {
        final String controllerTraceId;
        final String serviceTraceId;

        public TracePair(String controllerTraceId, String serviceTraceId) {
            this.controllerTraceId = controllerTraceId;
            this.serviceTraceId = serviceTraceId;
        }
    }

    static class TestLoginDto {
        private final String email;
        private final String password;

        public TestLoginDto(String email, String password) {
            this.email = email;
            this.password = password;
        }

        public String getEmail() {
            return email;
        }

        public String getPassword() {
            return password;
        }

        @Override
        public String toString() {
            return "TestLoginDto(email=" + email + ", password=" + password + ")";
        }
    }

    static class TestLoginResponse {
        private final String accessToken;

        public TestLoginResponse(String accessToken) {
            this.accessToken = accessToken;
        }

        public String getAccessToken() {
            return accessToken;
        }

        @Override
        public String toString() {
            return accessToken;
        }
    }
}
