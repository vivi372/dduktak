package com.dduktak.domain.notification.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * 알림 설정 변경 완료 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsResponseDto {

    private Boolean isExpireWarnEnabled;
    private Boolean isReactionNoticeEnabled;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime quietTimeStart;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime quietTimeEnd;
}
