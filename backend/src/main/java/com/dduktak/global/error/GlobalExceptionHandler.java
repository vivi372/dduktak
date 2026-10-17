package com.dduktak.global.error;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;

/**
 * 전역 예외 처리기 (Global Exception Handler)
 * 프로젝트 내 모든 @RestController에서 발생하는 예외를 일관된 규격(ErrorResponseDto)으로 변환하여 반환합니다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 비즈니스 로직 상 의도된 커스텀 예외 처리
     */
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponseDto> handleCustomException(CustomException e) {
        log.warn("[CustomException] Code: {}, Message: {}", e.getErrorCode().getCode(), e.getMessage());
        ErrorCode errorCode = e.getErrorCode();
        return ResponseEntity
                .status(errorCode.getStatus())
                .body(ErrorResponseDto.of(errorCode, e.getMessage()));
    }

    /**
     * DTO @Valid 유효성 검증 실패 예외 처리 (Request Body)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDto> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        log.warn("[MethodArgumentNotValidException] Validation failed: {}", e.getMessage());

        List<ErrorResponseDto.FieldErrorDetail> fieldErrors = e.getBindingResult().getFieldErrors().stream()
                .map(err -> ErrorResponseDto.FieldErrorDetail.builder()
                        .field(err.getField())
                        .value(err.getRejectedValue() == null ? "" : err.getRejectedValue().toString())
                        .reason(err.getDefaultMessage())
                        .build())
                .toList();

        String firstErrorMessage = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(MessageSourceResolvable::getDefaultMessage)
                .orElse(ErrorCode.COMMON_FIELD_INVALID_INPUT.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponseDto.of(ErrorCode.COMMON_FIELD_INVALID_INPUT, firstErrorMessage, fieldErrors));
    }

    /**
     * 메서드 파라미터 유효성 검증 실패 예외 처리 (Spring 6.1+ Controller Method Validation)
     */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponseDto> handleHandlerMethodValidationException(HandlerMethodValidationException e) {
        log.warn("[HandlerMethodValidationException] Validation failed: {}", e.getMessage());

        String message = e.getAllErrors().stream()
                .findFirst()
                .map(MessageSourceResolvable::getDefaultMessage)
                .orElse(ErrorCode.COMMON_FIELD_INVALID_INPUT.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponseDto.of(ErrorCode.COMMON_FIELD_INVALID_INPUT, message));
    }

    /**
     * 제약조건 위반 예외 처리 (Path Variable, Query Parameter 등 @Validated)
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponseDto> handleConstraintViolationException(ConstraintViolationException e) {
        log.warn("[ConstraintViolationException] Constraint violated: {}", e.getMessage());

        List<ErrorResponseDto.FieldErrorDetail> fieldErrors = e.getConstraintViolations().stream()
                .map(violation -> ErrorResponseDto.FieldErrorDetail.builder()
                        .field(violation.getPropertyPath().toString())
                        .value(violation.getInvalidValue() == null ? "" : violation.getInvalidValue().toString())
                        .reason(violation.getMessage())
                        .build())
                .toList();

        String firstErrorMessage = e.getConstraintViolations().stream()
                .findFirst()
                .map(jakarta.validation.ConstraintViolation::getMessage)
                .orElse(ErrorCode.COMMON_FIELD_INVALID_INPUT.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponseDto.of(ErrorCode.COMMON_FIELD_INVALID_INPUT, firstErrorMessage, fieldErrors));
    }

    /**
     * 필수 요청 쿼리 파라미터 누락 예외 처리
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponseDto> handleMissingServletRequestParameterException(MissingServletRequestParameterException e) {
        log.warn("[MissingServletRequestParameterException] Missing parameter: {}", e.getParameterName());
        String message = String.format("필수 요청 파라미터 '%s'가 누락되었습니다.", e.getParameterName());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponseDto.of(ErrorCode.COMMON_FIELD_INVALID_INPUT, message));
    }

    /**
     * 요청 파라미터 타입 불일치 예외 처리
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponseDto> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException e) {
        log.warn("[MethodArgumentTypeMismatchException] Parameter '{}' type mismatch: {}", e.getName(), e.getMessage());
        String message = String.format("파라미터 '%s'의 형식이 올바르지 않습니다.", e.getName());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponseDto.of(ErrorCode.COMMON_FIELD_INVALID_INPUT, message));
    }

    /**
     * 지원하지 않는 HTTP 메서드 요청 예외 처리 (405 Method Not Allowed)
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponseDto> handleHttpRequestMethodNotSupportedException(HttpRequestMethodNotSupportedException e) {
        log.warn("[HttpRequestMethodNotSupportedException] Method: {}", e.getMethod());
        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ErrorResponseDto.of(ErrorCode.COMMON_WARN_METHOD_NOT_ALLOWED, e.getMessage()));
    }

    /**
     * 요청 리소스 부재 예외 처리 (404 Not Found)
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponseDto> handleNoResourceFoundException(NoResourceFoundException e) {
        log.warn("[NoResourceFoundException] Path: {}", e.getResourcePath());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ErrorResponseDto.of(ErrorCode.COMMON_ALERT_RESOURCE_NOT_FOUND));
    }

    /**
     * Spring Security 인가 실패 예외 처리 (403 Forbidden)
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponseDto> handleAccessDeniedException(AccessDeniedException e) {
        log.warn("[AccessDeniedException] Forbidden access: {}", e.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ErrorResponseDto.of(ErrorCode.AUTH_ALERT_ACCESS_DENIED));
    }

    /**
     * Spring Security 인증 실패 예외 처리 (401 Unauthorized)
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponseDto> handleAuthenticationException(AuthenticationException e) {
        log.warn("[AuthenticationException] Unauthorized request: {}", e.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponseDto.of(ErrorCode.AUTH_ALERT_UNAUTHORIZED));
    }

    /**
     * 기타 처리되지 않은 모든 서버 내부 시스템 예외 처리 (500 Internal Server Error)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> handleGeneralException(Exception e) {
        log.error("[Unhandled Exception] Unexpected server error occurred", e);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponseDto.of(ErrorCode.COMMON_ALERT_INTERNAL_SERVER_ERROR));
    }
}
