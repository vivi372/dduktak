package com.dduktak.global.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 데이터베이스 DDL 안전 자동 마이그레이션 컴포넌트
 * profiles 테이블의 fcm_token 칼럼 자동 추가 등을 수행합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSchemaInitializer {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void initSchema() {
        try {
            log.info("[DatabaseSchemaInitializer] profiles 테이블 fcm_token 칼럼 존재 여부 확인 및 생성 시도...");
            jdbcTemplate.execute("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;");
            log.info("[DatabaseSchemaInitializer] profiles 테이블 fcm_token 칼럼 확인 완료.");
        } catch (Exception e) {
            log.warn("[DatabaseSchemaInitializer] fcm_token 칼럼 확인 중 예외 (무시 가능): {}", e.getMessage());
        }
    }
}
