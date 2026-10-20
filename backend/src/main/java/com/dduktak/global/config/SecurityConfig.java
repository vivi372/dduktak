package com.dduktak.global.config;

import com.dduktak.global.filter.JwtAuthenticationFilter;
import com.dduktak.global.security.JwtAccessDeniedHandler;
import com.dduktak.global.security.JwtAuthenticationEntryPoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security 6.x 보안 설정
 * 무상태(Stateless) JWT 기반 인증 아키텍처 및 경로별 인가 규칙을 구성합니다.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint,
            JwtAccessDeniedHandler jwtAccessDeniedHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
        this.jwtAccessDeniedHandler = jwtAccessDeniedHandler;
    }

    /**
     * 비밀번호 단방향 암호화용 BCryptPasswordEncoder Bean
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * SecurityFilterChain 구성
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // REST API 환경이므로 CSRF 비활성화
                .csrf(AbstractHttpConfigurer::disable)
                // 전역 CORS 설정 연동
                .cors(Customizer.withDefaults())
                // 세션 미사용 (Stateless)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 엔드포인트별 인가 규칙
                .authorizeHttpRequests(auth -> auth
                        // 1. 비인증 공개 허용 엔드포인트
                        .requestMatchers("/error").permitAll()
                        // 2. 그 외 모든 요청(세션 동기화, 본인 정보 조회/수정/탈퇴 등)은 Supabase JWT 인증 필수
                        .anyRequest().authenticated())
                // 인증 및 인가 실패 핸들러 등록
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(jwtAccessDeniedHandler))
                // JWT 인증 필터를 UsernamePasswordAuthenticationFilter 앞단에 배치
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
