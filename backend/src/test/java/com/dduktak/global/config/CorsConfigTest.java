package com.dduktak.global.config;

import com.dduktak.global.filter.TraceIdFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * CorsConfig 전역 CORS 정책 단위 및 통합 테스트
 * 프론트엔드 교차 출처 요청 시 X-Trace-Id 응답 헤더 노출(Expose-Headers) 여부를 검증합니다.
 */
@ExtendWith(SpringExtension.class)
@WebAppConfiguration
@ContextConfiguration(classes = {CorsConfigTest.TestConfig.class})
class CorsConfigTest {

    @Autowired
    private WebApplicationContext wac;

    @Configuration
    @EnableWebMvc
    @Import(CorsConfig.class)
    static class TestConfig {
        @Bean
        public TestCorsController testCorsController() {
            return new TestCorsController();
        }
    }

    @RestController
    static class TestCorsController {
        @GetMapping("/api/test")
        public String test() {
            return "ok";
        }
    }

    @Test
    @DisplayName("CORS Preflight 검증: OPTIONS 요청 시 Access-Control-Expose-Headers에 X-Trace-Id가 포함되어야 한다")
    void corsConfig_ShouldExposeTraceIdHeader() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(wac).build();

        mockMvc.perform(options("/api/test")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, TraceIdFilter.TRACE_ID_HEADER));
    }
}
