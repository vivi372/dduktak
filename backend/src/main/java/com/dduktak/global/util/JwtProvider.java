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
import java.util.Date;

/**
 * JJWT 0.12.x 기반 JWT 토큰 생성, 파싱 및 유효성 검증 프로바이더
 */
@Slf4j
@Component
public class JwtProvider {

    public static final String CLAIM_TOKEN_TYPE = "tokenType";
    public static final String CLAIM_EMAIL = "email";
    public static final String CLAIM_ROLE = "role";

    public static final String TOKEN_TYPE_ACCESS = "ACCESS";
    public static final String TOKEN_TYPE_REFRESH = "REFRESH";

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
     * Access Token 신규 발급 (유효 시간 24시간)
     *
     * @param userId 회원 고유 식별자 (user_id)
     * @param email  회원 이메일
     * @return 서명된 Access Token 문자열
     */
    public String createAccessToken(Long userId, String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getExpiration());

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(CLAIM_EMAIL, email)
                .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS)
                .claim(CLAIM_ROLE, "ROLE_USER")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Refresh Token 신규 발급 (유효 시간 7일)
     *
     * @param userId 회원 고유 식별자 (user_id)
     * @return 서명된 Refresh Token 문자열
     */
    public String createRefreshToken(Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getRefreshExpiration());

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_REFRESH)
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
     * 토큰에서 회원 PK(userId) 추출
     */
    public Long getUserId(String token) {
        String subject = parseClaims(token).getSubject();
        return Long.parseLong(subject);
    }

    /**
     * 토큰에서 이메일 추출
     */
    public String getEmail(String token) {
        return parseClaims(token).get(CLAIM_EMAIL, String.class);
    }

    /**
     * 토큰 타입 추출 (ACCESS 또는 REFRESH)
     */
    public String getTokenType(String token) {
        return parseClaims(token).get(CLAIM_TOKEN_TYPE, String.class);
    }

    /**
     * Refresh Token 여부 확인
     */
    public boolean isRefreshToken(String token) {
        return TOKEN_TYPE_REFRESH.equals(getTokenType(token));
    }

    /**
     * Access Token 여부 확인
     */
    public boolean isAccessToken(String token) {
        return TOKEN_TYPE_ACCESS.equals(getTokenType(token));
    }
}
