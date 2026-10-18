package com.dduktak.global.config;

import com.dduktak.global.filter.TraceIdFilter;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 전역 CORS(Cross-Origin Resource Sharing) 설정
 * 프론트엔드(React/Axios)에서 X-Trace-Id 응답 헤더를 정상적으로 읽을 수 있도록
 * exposedHeaders에 "X-Trace-Id"를 등록하고 기본 교차 출처 리소스 공유를 허용합니다.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders(TraceIdFilter.TRACE_ID_HEADER)
                .allowCredentials(true)
                .maxAge(3600);
    }
}
