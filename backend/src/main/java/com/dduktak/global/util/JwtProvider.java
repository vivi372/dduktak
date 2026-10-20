package com.dduktak.global.util;

import com.dduktak.global.config.JwtProperties;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * Supabase Auth JWT 토큰 검증 및 클레임 파싱 프로바이더 (JJWT 0.12.x 기반)
 */
@Slf4j
@Component
public class JwtProvider {

    public static final String CLAIM_EMAIL = "email";
    public static final String CLAIM_ROLE = "role";
    public static final String CLAIM_USER_METADATA = "user_metadata";
    public static final String ROLE_AUTHENTICATED = "authenticated";

    private final JwtProperties jwtProperties;
    private SecretKey secretKey;

    public JwtProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    @PostConstruct
    public void init() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * 단위/통합 테스트용 Supabase 호환 JWT 토큰 발급 헬퍼
     *
     * @param userId       Supabase Auth UUID
     * @param email        사용자 이메일
     * @param userMetadata 사용자 메타데이터 (닉네임 등)
     * @return 서명된 JWT 토큰 문자열
     */
    public String createTestToken(UUID userId, String email, Map<String, Object> userMetadata) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getExpiration());

        return Jwts.builder()
                .subject(userId.toString())
                .audience().add(ROLE_AUTHENTICATED).and()
                .claim(CLAIM_EMAIL, email)
                .claim(CLAIM_ROLE, ROLE_AUTHENTICATED)
                .claim(CLAIM_USER_METADATA, userMetadata != null ? userMetadata : Collections.emptyMap())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    /**
     * 토큰 서명 및 만료 여부 유효성 검증
     *
     * @param token JWT 토큰 문자열
     * @return 유효성 여부 (true/false)
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("[JwtProvider] 토큰이 만료되었습니다: {}", e.getMessage());
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("[JwtProvider] 유효하지 않은 토큰입니다: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 토큰 검증 및 상세 예외 발생
     *
     * @param token JWT 토큰 문자열
     * @return Claims 페이로드
     */
    public Claims parseAndValidate(String token) {
        try {
            return parseClaims(token);
        } catch (ExpiredJwtException e) {
            log.warn("[JwtProvider] 토큰 만료 예외: {}", e.getMessage());
            throw new CustomException(ErrorCode.AUTH_ALERT_TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("[JwtProvider] 토큰 유효성 예외: {}", e.getMessage());
            throw new CustomException(ErrorCode.AUTH_ALERT_INVALID_TOKEN);
        }
    }

    /**
     * 토큰에서 Claims 페이로드 추출
     *
     * @param token JWT 토큰 문자열
     * @return Claims 객체
     */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 토큰에서 회원 UUID (sub) 추출
     */
    public UUID getUserId(String token) {
        String subject = parseClaims(token).getSubject();
        return UUID.fromString(subject);
    }

    /**
     * 토큰에서 이메일 추출
     */
    public String getEmail(String token) {
        return parseClaims(token).get(CLAIM_EMAIL, String.class);
    }

    /**
     * 토큰에서 Supabase role 추출
     */
    public String getRole(String token) {
        return parseClaims(token).get(CLAIM_ROLE, String.class);
    }

    /**
     * 토큰에서 user_metadata 맵 추출
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getUserMetadata(String token) {
        Object metadataObj = parseClaims(token).get(CLAIM_USER_METADATA);
        if (metadataObj instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Collections.emptyMap();
    }

    /**
     * user_metadata에서 닉네임 추출
     */
    public String getNicknameFromMetadata(String token) {
        Map<String, Object> metadata = getUserMetadata(token);
        if (metadata.containsKey("nickname")) {
            return String.valueOf(metadata.get("nickname"));
        }
        if (metadata.containsKey("name")) {
            return String.valueOf(metadata.get("name"));
        }
        if (metadata.containsKey("full_name")) {
            return String.valueOf(metadata.get("full_name"));
        }
        return null;
    }

    /**
     * user_metadata에서 프로필 이미지 URL 추출
     */
    public String getProfileImageFromMetadata(String token) {
        Map<String, Object> metadata = getUserMetadata(token);
        if (metadata.containsKey("profile_image")) {
            return String.valueOf(metadata.get("profile_image"));
        }
        if (metadata.containsKey("avatar_url")) {
            return String.valueOf(metadata.get("avatar_url"));
        }
        return null;
    }

    /**
     * Access Token 여부 확인 (Supabase 토큰 유효성 및 role 검증)
     */
    public boolean isAccessToken(String token) {
        try {
            Claims claims = parseClaims(token);
            String role = claims.get(CLAIM_ROLE, String.class);
            return ROLE_AUTHENTICATED.equalsIgnoreCase(role) || claims.getSubject() != null;
        } catch (Exception e) {
            return false;
        }
    }
}
