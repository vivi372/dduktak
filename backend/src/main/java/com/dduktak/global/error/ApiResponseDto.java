package com.dduktak.global.error;

import lombok.Builder;
import lombok.Getter;

/**
 * 전역 표준 성공 응답 DTO
 * 명세서(02_ARCHITECTURE_AND_CONVENTIONS.md, 05_API_SPECIFICATION.md)에 정의된
 * { success: true, data: ..., message: ... } 형식을 엄격히 준수합니다.
 */
@Getter
public class ApiResponseDto<T> {

    /**
     * 성공 여부 (항상 true)
     */
    private final boolean success;

    /**
     * 반환 데이터 페이로드
     */
    private final T data;

    /**
     * 사용자 친화적 완료 안내 메시지
     */
    private final String message;

    /**
     * Eclipse JDT/VS Code 언어 서버의 'Flexible Constructor Bodies' 호환성 문제를 방지하기 위한 명시적 생성자
     */
    @Builder
    private ApiResponseDto(boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    /**
     * 데이터를 포함하는 기본 성공 응답 생성
     *
     * @param data 반환할 데이터 객체
     * @param <T>  데이터 제네릭 타입
     * @return ApiResponseDto 인스턴스
     */
    public static <T> ApiResponseDto<T> success(T data) {
        return ApiResponseDto.<T>builder()
                .success(true)
                .data(data)
                .message("성공적으로 처리되었습니다.")
                .build();
    }

    /**
     * 데이터와 커스텀 안내 메시지를 포함하는 성공 응답 생성
     *
     * @param data    반환할 데이터 객체
     * @param message 사용자 안내 메시지
     * @param <T>     데이터 제네릭 타입
     * @return ApiResponseDto 인스턴스
     */
    public static <T> ApiResponseDto<T> success(T data, String message) {
        return ApiResponseDto.<T>builder()
                .success(true)
                .data(data)
                .message(message)
                .build();
    }

    /**
     * 데이터 본문이 없는 기본 성공 응답 생성 (예: 삭제, 단순 확인 등)
     *
     * @return ApiResponseDto 인스턴스 (data: null)
     */
    public static ApiResponseDto<Void> success() {
        return success(null);
    }
}
