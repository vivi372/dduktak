package com.dduktak.global.security;

import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Spring Security 인증 주체(Principal) 구현체
 * JWT 인증 필터를 거친 로그인 사용자의 식별자(userId) 및 이메일, 기본 권한을 보관합니다.
 */
@Getter
public class UserPrincipal implements UserDetails {

    /**
     * 회원 식별 고유 PK (users.user_id)
     */
    private final Long userId;

    /**
     * 회원 이메일
     */
    private final String email;

    private final String role;

    @Builder
    public UserPrincipal(Long userId, String email, String role) {
        this.userId = userId;
        this.email = email;
        this.role = (role != null) ? role : "ROLE_USER";
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority(this.role));
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return this.email != null ? this.email : String.valueOf(this.userId);
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
