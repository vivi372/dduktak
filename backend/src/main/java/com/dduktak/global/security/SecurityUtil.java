package com.dduktak.global.security;

import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Spring Security Context에서 인증된 유저 정보를 추출하는 보안 유틸리티
 */
public final class SecurityUtil {

    private SecurityUtil() {
        // 인스턴스화 방지
    }

    /**
     * 현재 SecurityContext에 인증된 회원의 userId(PK)를 반환합니다.
     * 미인증 상태이거나 익명 사용자인 경우 AUTH_ALERT_UNAUTHORIZED 예외를 발생시킵니다.
     *
     * @return 로그인한 회원의 userId
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new CustomException(ErrorCode.AUTH_ALERT_UNAUTHORIZED);
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getUserId();
        }
        if (principal instanceof String principalStr && !"anonymousUser".equals(principalStr)) {
            try {
                return Long.parseLong(principalStr);
            } catch (NumberFormatException ignored) {
                // 숫자가 아닌 principal인 경우 하단 예외 발생
            }
        }

        throw new CustomException(ErrorCode.AUTH_ALERT_UNAUTHORIZED);
    }
}
