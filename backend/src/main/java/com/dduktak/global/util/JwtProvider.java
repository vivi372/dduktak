package com.dduktak.global.util;

import com.dduktak.global.config.JwtProperties;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Supabase Auth JWT 토큰 검증 및 클레임 파싱 프로바이더 (JJWT 0.12.x 기반 + 2-Tier 하이브리드 위임 검증)
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
    private RestClient restClient;

    /**
     * 토큰 검증 결과 인메모리 고속 캐시 (토큰 -> 검증된 사용자 정보)
     * 네트워크 왕복 지연을 방지하기 위해 만료 시간(exp) 동안 캐싱합니다.
     */
    private final Map<String, VerifiedTokenInfo> tokenCache = new ConcurrentHashMap<>();

    public JwtProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    @PostConstruct
    public void init() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.restClient = RestClient.builder().build();
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
     * 2-Tier 하이브리드 토큰 유효성 검증
     * 1) 인메모리 검증 캐시 확인
     * 2) 1차 시도: 로컬 JJWT 서명 검증 (로컬 대칭키 및 단위 테스트 토큰)
     * 3) 2차 시도: Supabase Auth 서버(/auth/v1/user) 원격 위임 검증 (Key Rotation / kid 토큰)
     *
     * @param token JWT 토큰 문자열
     * @return 유효성 여부 (true/false)
     */
    public boolean validateToken(String token) {
        if (!StringUtils.hasText(token)) {
            return false;
        }

        // 1. 캐시 검사: 이미 검증되었고 만료되지 않은 토큰인지 확인
        VerifiedTokenInfo cached = tokenCache.get(token);
        if (cached != null) {
            if (System.currentTimeMillis() < cached.getExpiresAtMillis()) {
                return true;
            }
            tokenCache.remove(token);
        }

        // 2. 1차 시도: 로컬 대칭키 JJWT 서명 검증 (Fast Path)
        try {
            Claims claims = parseClaims(token);
            cacheLocalClaims(token, claims);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("[JwtProvider] 토큰이 만료되었습니다: {}", e.getMessage());
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            log.info("[JwtProvider] 로컬 서명 불일치 (사유: {}). Supabase Auth 원격 위임 검증을 진행합니다.", e.getMessage());
        }

        // 3. 2차 시도: Supabase Auth 서버 원격 위임 검증 (Fallback Path)
        return verifyWithSupabaseAuth(token);
    }

    /**
     * Supabase Auth 서버(/auth/v1/user)로 토큰을 직접 전송하여 원격 유효성을 검증합니다.
     */
    private boolean verifyWithSupabaseAuth(String token) {
        String supabaseUrl = jwtProperties.getSupabaseUrl();
        if (!StringUtils.hasText(supabaseUrl)) {
            log.warn("[JwtProvider] Supabase URL이 설정되지 않아 원격 위임 검증을 수행할 수 없습니다.");
            return false;
        }

        try {
            String endpoint = supabaseUrl.replaceAll("/+$", "") + "/auth/v1/user";
            
            RestClient.RequestHeadersSpec<?> request = restClient.get()
                    .uri(endpoint)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token);

            if (StringUtils.hasText(jwtProperties.getSupabaseKey())) {
                request.header("apikey", jwtProperties.getSupabaseKey());
            }

            SupabaseUserResponse response = request.retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        log.warn("[JwtProvider] Supabase Auth 위임 검증 실패 - HTTP 상태 코드: {}", res.getStatusCode());
                    })
                    .body(SupabaseUserResponse.class);

            if (response != null && response.getId() != null) {
                // 토큰 검증 성공: 기본 5분(300,000ms) 동안 인메모리 캐싱
                long expiresAt = System.currentTimeMillis() + 300_000L;
                VerifiedTokenInfo info = VerifiedTokenInfo.builder()
                        .userId(UUID.fromString(response.getId()))
                        .email(response.getEmail())
                        .role(StringUtils.hasText(response.getRole()) ? response.getRole() : ROLE_AUTHENTICATED)
                        .userMetadata(response.getUserMetadata() != null ? response.getUserMetadata() : Collections.emptyMap())
                        .expiresAtMillis(expiresAt)
                        .build();

                tokenCache.put(token, info);
                log.info("[JwtProvider] Supabase Auth 원격 위임 검증 성공 - userId: {}, email: {}", info.getUserId(), info.getEmail());
                return true;
            }
        } catch (Exception e) {
            log.warn("[JwtProvider] Supabase Auth 원격 검증 중 예외 발생: {}", e.getMessage());
        }

        return false;
    }

    /**
     * 로컬 JJWT Claims 정보를 캐시에 저장
     */
    private void cacheLocalClaims(String token, Claims claims) {
        try {
            UUID userId = UUID.fromString(claims.getSubject());
            String email = claims.get(CLAIM_EMAIL, String.class);
            String role = claims.get(CLAIM_ROLE, String.class);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> metadata = claims.get(CLAIM_USER_METADATA, Map.class);
            long expMillis = claims.getExpiration() != null ? claims.getExpiration().getTime() : System.currentTimeMillis() + 300_000L;

            VerifiedTokenInfo info = VerifiedTokenInfo.builder()
                    .userId(userId)
                    .email(email)
                    .role(role != null ? role : ROLE_AUTHENTICATED)
                    .userMetadata(metadata != null ? metadata : Collections.emptyMap())
                    .expiresAtMillis(expMillis)
                    .build();

            tokenCache.put(token, info);
        } catch (Exception e) {
            log.debug("[JwtProvider] 로컬 클레임 캐싱 중 파싱 무시: {}", e.getMessage());
        }
    }

    /**
     * 토큰 검증 및 상세 예외 발생
     */
    public Claims parseAndValidate(String token) {
        try {
            return parseClaims(token);
        } catch (ExpiredJwtException e) {
            log.warn("[JwtProvider] 토큰 만료 예외: {}", e.getMessage());
            throw new CustomException(ErrorCode.AUTH_ALERT_TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException e) {
            // 로컬 서명 불일치 시 원격 위임 검증 통과 여부 확인
            if (verifyWithSupabaseAuth(token)) {
                return null;
            }
            log.warn("[JwtProvider] 토큰 유효성 예외: {}", e.getMessage());
            throw new CustomException(ErrorCode.AUTH_ALERT_INVALID_TOKEN);
        }
    }

    /**
     * 로컬 JJWT를 통한 Claims 파싱
     */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 토큰에서 회원 UUID (sub) 추출 (캐시 ➔ 원격검증 ➔ 로컬파싱 순서)
     */
    public UUID getUserId(String token) {
        VerifiedTokenInfo info = getOrFetchTokenInfo(token);
        if (info != null && info.getUserId() != null) {
            return info.getUserId();
        }
        String subject = parseClaims(token).getSubject();
        return UUID.fromString(subject);
    }

    /**
     * 토큰에서 이메일 추출
     */
    public String getEmail(String token) {
        VerifiedTokenInfo info = getOrFetchTokenInfo(token);
        if (info != null && info.getEmail() != null) {
            return info.getEmail();
        }
        return parseClaims(token).get(CLAIM_EMAIL, String.class);
    }

    /**
     * 토큰에서 Supabase role 추출
     */
    public String getRole(String token) {
        VerifiedTokenInfo info = getOrFetchTokenInfo(token);
        if (info != null && info.getRole() != null) {
            return info.getRole();
        }
        return parseClaims(token).get(CLAIM_ROLE, String.class);
    }

    /**
     * 토큰에서 user_metadata 맵 추출
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getUserMetadata(String token) {
        VerifiedTokenInfo info = getOrFetchTokenInfo(token);
        if (info != null && info.getUserMetadata() != null) {
            return info.getUserMetadata();
        }
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
        VerifiedTokenInfo info = getOrFetchTokenInfo(token);
        if (info != null) {
            return ROLE_AUTHENTICATED.equalsIgnoreCase(info.getRole()) || info.getUserId() != null;
        }
        try {
            Claims claims = parseClaims(token);
            String role = claims.get(CLAIM_ROLE, String.class);
            return ROLE_AUTHENTICATED.equalsIgnoreCase(role) || claims.getSubject() != null;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 캐시에서 토큰 정보를 획득하거나 필요 시 원격/로컬 검증을 거쳐 획득
     */
    private VerifiedTokenInfo getOrFetchTokenInfo(String token) {
        VerifiedTokenInfo cached = tokenCache.get(token);
        if (cached != null && System.currentTimeMillis() < cached.getExpiresAtMillis()) {
            return cached;
        }
        if (validateToken(token)) {
            return tokenCache.get(token);
        }
        return null;
    }

    /**
     * 캐시용 검증 완료 토큰 정보 DTO
     */
    @Getter
    @Builder
    @AllArgsConstructor
    public static class VerifiedTokenInfo {
        private final UUID userId;
        private final String email;
        private final String role;
        private final Map<String, Object> userMetadata;
        private final long expiresAtMillis;
    }

    /**
     * Supabase Auth /auth/v1/user 응답 매핑 DTO
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupabaseUserResponse {
        private String id;
        private String email;
        private String role;
        
        @JsonProperty("user_metadata")
        private Map<String, Object> userMetadata;
    }
}

