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
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Spring Security 인증 실패(401 Unauthorized) 진입점
 * 미인증 유저의 보호된 리소스 접근 시 전역 ErrorResponseDto 규격으로 응답합니다.
 */
@Slf4j
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public JwtAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException {
        log.warn("[JwtAuthenticationEntryPoint] Unauthorized request - Path: {}, Message: {}",
                request.getRequestURI(), authException.getMessage());

        String traceId = MDC.get(TraceIdFilter.TRACE_ID_KEY);
        if (traceId != null && !traceId.isBlank()) {
            response.setHeader(TraceIdFilter.TRACE_ID_HEADER, traceId);
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ErrorResponseDto errorResponse = ErrorResponseDto.of(ErrorCode.AUTH_ALERT_UNAUTHORIZED);
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
