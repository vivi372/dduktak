package com.dduktak.domain.auth.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * 방해금지 시간 설정 요청 DTO (/api/v1/auth/me/quiet-time)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuietTimeRequestDto {

    @NotNull(message = "방해금지 시작 시각은 필수 입력 항목입니다.")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    private LocalTime quietTimeStart;

    @NotNull(message = "방해금지 종료 시각은 필수 입력 항목입니다.")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    private LocalTime quietTimeEnd;
}
