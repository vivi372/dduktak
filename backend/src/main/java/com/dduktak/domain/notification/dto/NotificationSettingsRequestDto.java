package com.dduktak.domain.notification.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * 알림 설정 변경 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsRequestDto {

    /**
     * 소비기한 임박 알림 활성화 여부
     */
    private Boolean isExpireWarnEnabled;

    /**
     * 소셜 반응(좋아요 등) 알림 활성화 여부
     */
    private Boolean isReactionNoticeEnabled;

    /**
     * 야간 방해금지 시작 시각 (예: "21:00:00")
     */
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime quietTimeStart;

    /**
     * 야간 방해금지 종료 시각 (예: "08:00:00")
     */
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime quietTimeEnd;
}
