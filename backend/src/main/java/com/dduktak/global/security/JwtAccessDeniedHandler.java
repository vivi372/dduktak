package com.dduktak.global.security;

import com.dduktak.global.error.ErrorCode;
import com.dduktak.global.error.ErrorResponseDto;
import com.dduktak.global.filter.TraceIdFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Spring Security 인가 실패(403 Forbidden) 핸들러
 * 권한이 부족한 요청 시 전역 ErrorResponseDto 규격으로 응답합니다.
 */
@Slf4j
@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public JwtAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException {
        log.warn("[JwtAccessDeniedHandler] Forbidden access - Path: {}, Message: {}",
                request.getRequestURI(), accessDeniedException.getMessage());

        String traceId = MDC.get(TraceIdFilter.TRACE_ID_KEY);
        if (traceId != null && !traceId.isBlank()) {
            response.setHeader(TraceIdFilter.TRACE_ID_HEADER, traceId);
        }

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ErrorResponseDto errorResponse = ErrorResponseDto.of(ErrorCode.AUTH_ALERT_ACCESS_DENIED);
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
