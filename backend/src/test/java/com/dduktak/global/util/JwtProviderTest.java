package com.dduktak.global.util;

import com.dduktak.global.config.JwtProperties;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("[단위 테스트] JwtProvider Supabase JWT 토큰 검증 및 클레임 추출 테스트")
class JwtProviderTest {

    private JwtProvider jwtProvider;
    private JwtProperties jwtProperties;

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties();
        jwtProperties.setSecret("dduktak-test-secret-key-must-be-at-least-256-bits-long-for-hmac-sha-algorithm-test");
        jwtProperties.setExpiration(1000L * 60 * 60); // 1 hour
        jwtProperties.setRefreshExpiration(1000L * 60 * 60 * 24 * 7); // 7 days

        jwtProvider = new JwtProvider(jwtProperties);
        jwtProvider.init();
    }

    @Test
    @DisplayName("Supabase 호환 Access Token 발급 및 UUID, email, user_metadata 클레임 추출 성공 검증")
    void createAndParseSupabaseToken_Success() {
        // given
        UUID userId = UUID.randomUUID();
        String email = "chef@dduktak.com";
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("nickname", "뚝딱셰프");
        metadata.put("avatar_url", "https://image.url/avatar.png");

        // when
        String token = jwtProvider.createTestToken(userId, email, metadata);

        // then
        assertThat(token).isNotBlank();
        assertThat(jwtProvider.validateToken(token)).isTrue();
        assertThat(jwtProvider.isAccessToken(token)).isTrue();
        assertThat(jwtProvider.getUserId(token)).isEqualTo(userId);
        assertThat(jwtProvider.getEmail(token)).isEqualTo(email);
        assertThat(jwtProvider.getRole(token)).isEqualTo(JwtProvider.ROLE_AUTHENTICATED);
        assertThat(jwtProvider.getNicknameFromMetadata(token)).isEqualTo("뚝딱셰프");
        assertThat(jwtProvider.getProfileImageFromMetadata(token)).isEqualTo("https://image.url/avatar.png");
    }

    @Test
    @DisplayName("만료된 토큰 검증 시 validateToken은 false를 반환하고 parseAndValidate는 AUTH_ALERT_TOKEN_EXPIRED 발생")
    void expiredToken_ThrowsException() throws InterruptedException {
        // given: 유효 시간이 1밀리초인 프로바이더 생성
        JwtProperties shortLivedProps = new JwtProperties();
        shortLivedProps.setSecret("dduktak-test-secret-key-must-be-at-least-256-bits-long-for-hmac-sha-algorithm-test");
        shortLivedProps.setExpiration(1L);
        JwtProvider shortLivedProvider = new JwtProvider(shortLivedProps);
        shortLivedProvider.init();

        UUID userId = UUID.randomUUID();
        String token = shortLivedProvider.createTestToken(userId, "chef@dduktak.com", null);
        Thread.sleep(10); // 만료 대기

        // when & then
        assertThat(shortLivedProvider.validateToken(token)).isFalse();
        assertThatThrownBy(() -> shortLivedProvider.parseAndValidate(token))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AUTH_ALERT_TOKEN_EXPIRED);
    }

    @Test
    @DisplayName("위조되거나 잘못된 형식의 토큰 검증 시 AUTH_ALERT_INVALID_TOKEN 발생")
    void invalidToken_ThrowsException() {
        // given
        String malformedToken = "invalid.token.structure";

        // when & then
        assertThat(jwtProvider.validateToken(malformedToken)).isFalse();
        assertThatThrownBy(() -> jwtProvider.parseAndValidate(malformedToken))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AUTH_ALERT_INVALID_TOKEN);
    }
}
