package com.dduktak.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 회원 탈퇴 요청 DTO (/api/v1/auth/withdraw)
 * 이메일 가입 회원의 경우 본인 인증용 비밀번호를 전달받습니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawRequestDto {

    private String password;
}
