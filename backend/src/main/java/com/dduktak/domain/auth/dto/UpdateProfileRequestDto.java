package com.dduktak.domain.auth.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 프로필 정보 수정 요청 DTO (/api/v1/auth/me)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequestDto {

    @Size(min = 2, max = 10, message = "닉네임은 2자 이상 10자 이하이어야 합니다.")
    private String nickname;

    private String profileImage;
}
