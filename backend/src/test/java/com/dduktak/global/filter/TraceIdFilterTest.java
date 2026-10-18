package com.dduktak.global.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TraceIdFilter 단위 및 통합 동작 검증 테스트
 * HTTP 요청/응답 주기 내 6자리 Trace ID 발급, 전파, 응답 헤더 주입 및 MDC 라이프사이클을 검증합니다.
 */
class TraceIdFilterTest {

    private TraceIdFilter traceIdFilter;

    @BeforeEach
    void setUp() {
        traceIdFilter = new TraceIdFilter();
        MDC.clear();
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    @Test
    @DisplayName("신규 Trace ID 발급: 요청 헤더에 X-Trace-Id가 없을 때 6자리 ID 생성 및 응답 헤더와 MDC에 주입되어야 한다")
    void traceIdFilter_ShouldGenerateNewTraceId_WhenHeaderMissing() throws ServletException, IOException {
        // given
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> mdcInsideChain = new AtomicReference<>();

        FilterChain filterChain = (req, res) -> {
            // 체인 실행 중 MDC에 바인딩된 Trace ID 캡처
            mdcInsideChain.set(MDC.get(TraceIdFilter.TRACE_ID_KEY));
        };

        // when
        traceIdFilter.doFilter(request, response, filterChain);

        // then
        String responseTraceId = response.getHeader(TraceIdFilter.TRACE_ID_HEADER);
        assertThat(responseTraceId).isNotNull();
        assertThat(responseTraceId).hasSize(6);
        assertThat(responseTraceId).matches("^[A-Z0-9]{6}$");

        // 필터 체인 내부에서 MDC에 동일한 값이 바인딩되었는지 확인
        assertThat(mdcInsideChain.get()).isEqualTo(responseTraceId);

        // 필터 체인 종료 후에는 스레드 오염 방지를 위해 MDC가 정리되어야 함
        assertThat(MDC.get(TraceIdFilter.TRACE_ID_KEY)).isNull();
    }

    @Test
    @DisplayName("기존 Trace ID 유지: 요청 헤더에 X-Trace-Id가 전달된 경우 해당 ID를 그대로 재사용해야 한다")
    void traceIdFilter_ShouldPreserveTraceId_WhenHeaderPresent() throws ServletException, IOException {
        // given
        String existingTraceId = "MYTR01";
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(TraceIdFilter.TRACE_ID_HEADER, existingTraceId);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> mdcInsideChain = new AtomicReference<>();

        FilterChain filterChain = (req, res) -> {
            mdcInsideChain.set(MDC.get(TraceIdFilter.TRACE_ID_KEY));
        };

        // when
        traceIdFilter.doFilter(request, response, filterChain);

        // then
        assertThat(response.getHeader(TraceIdFilter.TRACE_ID_HEADER)).isEqualTo(existingTraceId);
        assertThat(mdcInsideChain.get()).isEqualTo(existingTraceId);
        assertThat(MDC.get(TraceIdFilter.TRACE_ID_KEY)).isNull();
    }

    @Test
    @DisplayName("예외 발생 시 MDC 정리: 필터 체인 실행 중 예외가 발생하더라도 finally 블록에서 MDC.clear()가 보장되어야 한다")
    void traceIdFilter_ShouldClearMdc_EvenWhenExceptionThrown() {
        // given
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        FilterChain throwingChain = (req, res) -> {
            assertThat(MDC.get(TraceIdFilter.TRACE_ID_KEY)).isNotNull();
            throw new RuntimeException("체인 내부 비즈니스 오류 발생");
        };

        // when & then
        assertThatThrownBy(() -> traceIdFilter.doFilter(request, response, throwingChain))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("체인 내부 비즈니스 오류 발생");

        // 예외 발생 후에도 MDC는 반드시 정리(null)되어야 함
        assertThat(MDC.get(TraceIdFilter.TRACE_ID_KEY)).isNull();
    }

    @Test
    @DisplayName("MockMvc 연동 테스트: 실제 컨트롤러 호출 시 HTTP 응답 헤더에 X-Trace-Id가 정상 포함되어야 한다")
    void traceIdFilter_IntegratedWithMockMvc() throws Exception {
        // given
        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(new TestSampleController())
                .addFilters(traceIdFilter)
                .build();

        // when & then
        mockMvc.perform(get("/sample"))
                .andExpect(status().isOk())
                .andExpect(header().exists(TraceIdFilter.TRACE_ID_HEADER))
                .andExpect(header().string(TraceIdFilter.TRACE_ID_HEADER, org.hamcrest.Matchers.matchesRegex("^[A-Z0-9]{6}$")));

        // 요청 완료 후 MDC 정리 확인
        assertThat(MDC.get(TraceIdFilter.TRACE_ID_KEY)).isNull();
    }

    @RestController
    static class TestSampleController {
        @GetMapping("/sample")
        public String sample() {
            return "ok";
        }
    }
}
