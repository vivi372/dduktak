package com.dduktak.global.filter;

import com.dduktak.global.security.UserPrincipal;
import com.dduktak.global.util.JwtProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * HTTP 요청의 Authorization 헤더에서 Supabase JWT 토큰을 추출하여
 * 유효성을 검증하고 SecurityContext에 인증 주체(UserPrincipal)를 등록하는 필터
 */
@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtProvider jwtProvider;

    public JwtAuthenticationFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);

        if (StringUtils.hasText(token) && jwtProvider.validateToken(token)) {
            if (jwtProvider.isAccessToken(token)) {
                UUID userId = jwtProvider.getUserId(token);
                String email = jwtProvider.getEmail(token);
                Map<String, Object> userMetadata = jwtProvider.getUserMetadata(token);

                UserPrincipal principal = UserPrincipal.builder()
                        .userId(userId)
                        .email(email)
                        .userMetadata(userMetadata)
                        .build();

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        principal.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("[JwtAuthenticationFilter] SecurityContext에 인증 정보 등록 완료 - UserID: {}, Path: {}", userId,
                        request.getRequestURI());
            } else {
                log.warn("[JwtAuthenticationFilter] 유효하지 않은 인가 토큰 접근 시도 차단 - Path: {}",
                        request.getRequestURI());
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Authorization 헤더에서 "Bearer " 접두사를 제거한 순수 토큰 문자열 추출
     */
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length()).trim();
        }
        return null;
    }
}
