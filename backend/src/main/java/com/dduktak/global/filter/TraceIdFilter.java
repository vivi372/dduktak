package com.dduktak.global.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * 전역 서블릿 레벨 Trace ID 추적 및 응답 헤더(X-Trace-Id) 자동 주입 필터
 * HTTP 요청 최우선 진입점(HIGHEST_PRECEDENCE)에서 동작하며,
 * 들어오는 요청 헤더(X-Trace-Id)가 있으면 이를 재사용하고, 없을 경우 6자리 무작위 영숫자를 발급하여
 * SLF4J MDC 및 HTTP 응답 헤더(X-Trace-Id)에 주입합니다.
 * 요청 완료 시 MDC.clear()를 호출하여 서블릿 스레드 재사용 시 메모리 누수 및 컨텍스트 오염을 방지합니다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter extends OncePerRequestFilter {

    /**
     * HTTP 응답 및 요청 헤더 명칭
     */
    public static final String TRACE_ID_HEADER = "X-Trace-Id";

    /**
     * SLF4J MDC 내 Trace ID 바인딩 키 이름
     */
    public static final String TRACE_ID_KEY = "traceId";

    /**
     * Trace ID 기본 길이 (6자리 무작위 영숫자)
     */
    private static final int TRACE_ID_LENGTH = 6;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String traceId = request.getHeader(TRACE_ID_HEADER);

        // 요청 헤더에 X-Trace-Id가 비어있거나 없는 경우 6자리 무작위 영숫자 신규 발급
        if (traceId == null || traceId.isBlank()) {
            traceId = generateTraceId();
        }

        // MDC 등록 및 응답 헤더 주입
        MDC.put(TRACE_ID_KEY, traceId);
        response.setHeader(TRACE_ID_HEADER, traceId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            // 서블릿 스레드 풀 재사용 시 컨텍스트 오염 방지를 위해 MDC 정리
            MDC.clear();
        }
    }

    /**
     * 6자리 무작위 영숫자 Trace ID 생성 (예: 'E4A3F1')
     */
    private String generateTraceId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, TRACE_ID_LENGTH).toUpperCase();
    }
}
