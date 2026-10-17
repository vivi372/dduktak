package com.dduktak.global.error;

import lombok.Getter;

/**
 * 도메인 비즈니스 커스텀 예외
 * 비즈니스 로직 수행 중 발생하는 의도된 예외 상황을 ErrorCode와 함께 캡슐화합니다.
 */
@Getter
public class CustomException extends RuntimeException {

    /**
     * 예외 원인 규격 에러 코드
     */
    private final ErrorCode errorCode;

    /**
     * ErrorCode 기본 메시지를 사용하는 예외 생성
     *
     * @param errorCode 에러 코드
     */
    public CustomException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    /**
     * 개별 상황에 맞춘 커스텀 메시지를 포함하는 예외 생성
     *
     * @param errorCode     에러 코드
     * @param customMessage 상세 원인 메시지
     */
    public CustomException(ErrorCode errorCode, String customMessage) {
        super(customMessage != null && !customMessage.isBlank() ? customMessage : errorCode.getMessage());
        this.errorCode = errorCode;
    }

    /**
     * 원인 예외(Throwable)를 포함하는 예외 생성
     *
     * @param errorCode 에러 코드
     * @param cause     상위 원인 예외
     */
    public CustomException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode;
    }

    /**
     * 커스텀 메시지와 원인 예외를 함께 포함하는 예외 생성
     *
     * @param errorCode     에러 코드
     * @param customMessage 상세 원인 메시지
     * @param cause         상위 원인 예외
     */
    public CustomException(ErrorCode errorCode, String customMessage, Throwable cause) {
        super(customMessage != null && !customMessage.isBlank() ? customMessage : errorCode.getMessage(), cause);
        this.errorCode = errorCode;
    }
}
