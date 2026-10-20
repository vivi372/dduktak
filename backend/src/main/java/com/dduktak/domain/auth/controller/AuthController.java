package com.dduktak.domain.auth.controller;

import com.dduktak.domain.auth.dto.*;
import com.dduktak.domain.auth.service.AuthService;
import com.dduktak.global.error.ApiResponseDto;
import com.dduktak.global.security.SecurityUtil;
import com.dduktak.global.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

/**
 * 회원 및 인증 도메인 REST Controller (/api/v1/auth)
 * Supabase Auth 기반 Lazy Profile JIT Sync, 프로필 조회/수정 및 회원 탈퇴 제공
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 첫 로그인 시점 세션 동기화 및 지연 프로필 생성 (Lazy Profile JIT Sync, AUTH-01-2, AUTH-02-2)
     */
    @PostMapping("/init")
    public ResponseEntity<ApiResponseDto<InitProfileResponseDto>> initProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UUID userId = resolveUserId(userPrincipal);
        String email = (userPrincipal != null) ? userPrincipal.getEmail() : null;
        Map<String, Object> metadata = (userPrincipal != null) ? userPrincipal.getUserMetadata() : Collections.emptyMap();

        InitProfileResponseDto response = authService.initProfile(userId, email, metadata);
        return ResponseEntity.ok(ApiResponseDto.success(response, "프로필 세션 동기화가 완료되었습니다."));
    }

    /**
     * 본인 프로필 정보 조회
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponseDto<UserProfileResponseDto>> getMyProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UUID userId = resolveUserId(userPrincipal);
        UserProfileResponseDto response = authService.getMyProfile(userId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    /**
     * 본인 프로필 정보 수정 (닉네임, 프로필 이미지)
     */
    @PatchMapping("/me")
    public ResponseEntity<ApiResponseDto<UpdateProfileResponseDto>> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateProfileRequestDto requestDto
    ) {
        UUID userId = resolveUserId(userPrincipal);
        UpdateProfileResponseDto response = authService.updateMyProfile(userId, requestDto);
        return ResponseEntity.ok(ApiResponseDto.success(response, "프로필이 성공적으로 수정되었습니다."));
    }

    /**
     * 야간 방해금지 시간 설정
     */
    @PatchMapping("/me/quiet-time")
    public ResponseEntity<ApiResponseDto<QuietTimeResponseDto>> updateQuietTime(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody QuietTimeRequestDto requestDto
    ) {
        UUID userId = resolveUserId(userPrincipal);
        QuietTimeResponseDto response = authService.updateQuietTime(userId, requestDto);
        return ResponseEntity.ok(ApiResponseDto.success(response, "방해금지 시간이 설정되었습니다."));
    }

    /**
     * 회원 탈퇴 (USER-02)
     */
    @DeleteMapping("/withdraw")
    public ResponseEntity<ApiResponseDto<Void>> withdraw(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody(required = false) WithdrawRequestDto requestDto
    ) {
        UUID userId = resolveUserId(userPrincipal);
        authService.withdraw(userId, requestDto);
        return ResponseEntity.ok(ApiResponseDto.success(null, "회원 탈퇴가 완료되었습니다."));
    }

    private UUID resolveUserId(UserPrincipal userPrincipal) {
        if (userPrincipal != null && userPrincipal.getUserId() != null) {
            return userPrincipal.getUserId();
        }
        return SecurityUtil.getCurrentUserId();
    }
}
