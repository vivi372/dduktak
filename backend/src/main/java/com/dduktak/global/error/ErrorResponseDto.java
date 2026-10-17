package com.dduktak.global.error;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 전역 표준 에러 응답 DTO
 * 명세서(02_ARCHITECTURE_AND_CONVENTIONS.md, 05_API_SPECIFICATION.md)에 정의된
 * { success: false, code: "...", message: "...", timestamp: "..." } 형식을 준수하며,
 * 폼 검증 실패 시 상세 필드 에러 목록(errors)을 함께 제공합니다.
 */
@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ErrorResponseDto {

    /**
     * 성공 여부 (항상 false)
     */
    private final boolean success;

    /**
     * 에러 식별 코드 ([도메인]_[UX태그]_[상세원인] 규격)
     */
    private final String code;

    /**
     * 에러 안내 메시지
     */
    private final String message;

    /**
     * 에러 발생 시각 (ISO-8601 형식)
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime timestamp;

    /**
     * 필드 유효성 검증 실패 상세 목록 (존재할 경우에만 JSON 직렬화에 포함)
     */
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private final List<FieldErrorDetail> errors;

    /**
     * ErrorCode 기본 메시지를 기반으로 ErrorResponseDto 생성
     *
     * @param errorCode 사전 정의된 에러 코드
     * @return ErrorResponseDto 인스턴스
     */
    public static ErrorResponseDto of(ErrorCode errorCode) {
        return ErrorResponseDto.builder()
                .success(false)
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * ErrorCode와 사용자 정의 상세 메시지를 기반으로 ErrorResponseDto 생성
     *
     * @param errorCode     사전 정의된 에러 코드
     * @param customMessage 개별 예외 상황에 맞춤화된 메시지
     * @return ErrorResponseDto 인스턴스
     */
    public static ErrorResponseDto of(ErrorCode errorCode, String customMessage) {
        return ErrorResponseDto.builder()
                .success(false)
                .code(errorCode.getCode())
                .message(customMessage != null && !customMessage.isBlank() ? customMessage : errorCode.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * 필드 검증 실패 목록을 포함하는 ErrorResponseDto 생성
     *
     * @param errorCode     사전 정의된 에러 코드
     * @param customMessage 대표 에러 메시지
     * @param errors        필드별 상세 오류 목록
     * @return ErrorResponseDto 인스턴스
     */
    public static ErrorResponseDto of(ErrorCode errorCode, String customMessage, List<FieldErrorDetail> errors) {
        return ErrorResponseDto.builder()
                .success(false)
                .code(errorCode.getCode())
                .message(customMessage != null && !customMessage.isBlank() ? customMessage : errorCode.getMessage())
                .timestamp(LocalDateTime.now())
                .errors(errors)
                .build();
    }

    /**
     * 개별 필드 유효성 검증 실패 상세 정보
     */
    @Getter
    @Builder
    @AllArgsConstructor
    public static class FieldErrorDetail {
        /**
         * 유효성 검증에 실패한 필드명
         */
        private final String field;

        /**
         * 사용자가 입력한 거절된 값
         */
        private final String value;

        /**
         * 유효성 검증 실패 사유
         */
        private final String reason;
    }
}
