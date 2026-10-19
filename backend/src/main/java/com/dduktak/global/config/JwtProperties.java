package com.dduktak.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT(Json Web Token) 설정 프로퍼티
 * application.yml의 'jwt' 프리픽스 프로퍼티를 바인딩합니다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /**
     * HMAC-SHA 암호화용 서명 비밀키 (최소 256비트 이상)
     */
    private String secret = "dduktak-dev-secret-key-must-be-at-least-256-bits-long-for-hmac-sha-algorithm";

    /**
     * Access Token 유효 시간 (밀리초 단위, 기본 24시간)
     */
    private long expiration = 86400000L;

    /**
     * Refresh Token 유효 시간 (밀리초 단위, 기본 7일)
     */
    private long refreshExpiration = 604800000L;
}
