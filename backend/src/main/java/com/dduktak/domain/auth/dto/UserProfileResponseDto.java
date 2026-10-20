package com.dduktak.domain.auth.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.UUID;

/**
 * 회원 프로필 본인 정보 조회 응답 DTO (/api/v1/auth/me)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponseDto {

    private UUID userId;
    private String email;
    private String nickname;
    private String userTag;
    private String profileImage;

    @Builder.Default
    private String status = "ACTIVE";

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    private LocalTime quietTimeStart;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    private LocalTime quietTimeEnd;
}
