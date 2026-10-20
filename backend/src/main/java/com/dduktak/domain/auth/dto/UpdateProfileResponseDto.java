package com.dduktak.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * 프로필 정보 수정 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileResponseDto {

    private UUID userId;
    private String nickname;
    private String profileImage;
}
