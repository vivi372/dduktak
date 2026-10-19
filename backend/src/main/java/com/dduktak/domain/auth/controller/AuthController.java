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

/**
 * 회원 및 인증 도메인 REST Controller (/api/v1/auth)
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 이메일 회원가입 (AUTH-01-1)
     */
    @PostMapping("/signup")
    public ResponseEntity<ApiResponseDto<SignupResponseDto>> signup(
            @Valid @RequestBody SignupRequestDto requestDto
    ) {
        SignupResponseDto response = authService.signup(requestDto);
        return ResponseEntity.ok(ApiResponseDto.success(response, "회원가입이 완료되었습니다."));
    }

    /**
     * 이메일 로그인 (AUTH-01-2)
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponseDto<TokenResponseDto>> login(
            @Valid @RequestBody LoginRequestDto requestDto
    ) {
        TokenResponseDto response = authService.login(requestDto);
        return ResponseEntity.ok(ApiResponseDto.success(response, "로그인에 성공했습니다."));
    }

    /**
     * Access/Refresh Token 재발급
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponseDto<TokenResponseDto>> refresh(
            @Valid @RequestBody RefreshTokenRequestDto requestDto
    ) {
        TokenResponseDto response = authService.refresh(requestDto);
        return ResponseEntity.ok(ApiResponseDto.success(response, "토큰이 성공적으로 재발급되었습니다."));
    }

    /**
     * 본인 프로필 정보 조회
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponseDto<UserProfileResponseDto>> getMyProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        Long userId = resolveUserId(userPrincipal);
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
        Long userId = resolveUserId(userPrincipal);
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
        Long userId = resolveUserId(userPrincipal);
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
        Long userId = resolveUserId(userPrincipal);
        authService.withdraw(userId, requestDto);
        return ResponseEntity.ok(ApiResponseDto.success(null, "회원 탈퇴가 완료되었습니다."));
    }

    private Long resolveUserId(UserPrincipal userPrincipal) {
        if (userPrincipal != null && userPrincipal.getUserId() != null) {
            return userPrincipal.getUserId();
        }
        return SecurityUtil.getCurrentUserId();
    }
}
