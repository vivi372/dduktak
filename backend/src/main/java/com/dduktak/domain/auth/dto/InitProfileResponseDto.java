package com.dduktak.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * 첫 로그인 시점 지연 프로필 생성/동기화 응답 DTO (POST /api/v1/auth/init)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitProfileResponseDto {

    private UUID userId;
    private String nickname;
    private String userTag;
    private String profileImage;
}
