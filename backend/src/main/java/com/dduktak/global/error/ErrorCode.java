package com.dduktak.global.error;

import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;

/**
 * 전역 에러 코드 Enum
 * 네이밍 규칙: [도메인]_[UX태그]_[상세원인]
 * (02_ARCHITECTURE_AND_CONVENTIONS.md, 06_UI_UX_GUIDELINES.md 명세 준수)
 *
 * UX 태그 분기:
 * - _FIELD_   : 프론트엔드 입력 폼 하단 빨간 텍스트 노출
 * - _INFO_    : Sonner Toast 정보 팝업
 * - _WARN_    : Sonner Toast 경고 팝업
 * - _ALERT_   : Shadcn AlertDialog 확인 모달 팝업
 * - _CONFIRM_ : 확인/취소 선택형 모달 팝업
 * - _FATAL_   : 시스템 치명적 오류 화면
 */
public enum ErrorCode {

    // =========================================================================
    // 1. 공통 도메인 (COMMON)
    // =========================================================================
    COMMON_FIELD_INVALID_INPUT(HttpStatus.BAD_REQUEST, "COMMON_FIELD_INVALID_INPUT", "요청한 입력값이 올바르지 않습니다."),
    COMMON_WARN_METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "COMMON_WARN_METHOD_NOT_ALLOWED", "지원하지 않는 HTTP 메서드입니다."),
    COMMON_ALERT_RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "COMMON_ALERT_RESOURCE_NOT_FOUND", "요청하신 리소스를 찾을 수 없습니다."),
    COMMON_ALERT_INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_ALERT_INTERNAL_SERVER_ERROR", "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."),
    COMMON_FATAL_SYSTEM_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_FATAL_SYSTEM_ERROR", "시스템에 심각한 오류가 발생했습니다."),

    // =========================================================================
    // 2. 회원 및 인증 도메인 (AUTH)
    // =========================================================================
    AUTH_ALERT_UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH_ALERT_UNAUTHORIZED", "로그인이 필요한 서비스입니다."),
    AUTH_ALERT_ACCESS_DENIED(HttpStatus.FORBIDDEN, "AUTH_ALERT_ACCESS_DENIED", "해당 작업에 대한 접근 권한이 없습니다."),
    AUTH_WARN_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "AUTH_WARN_INVALID_CREDENTIALS", "이메일 또는 비밀번호가 일치하지 않습니다."),
    AUTH_ALERT_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "AUTH_ALERT_TOKEN_EXPIRED", "인증 토큰이 만료되었습니다. 다시 로그인해 주세요."),
    AUTH_ALERT_INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_ALERT_INVALID_TOKEN", "유효하지 않은 인증 토큰입니다."),
    AUTH_FIELD_DUPLICATE_EMAIL(HttpStatus.CONFLICT, "AUTH_FIELD_DUPLICATE_EMAIL", "이미 등록된 이메일 주소입니다."),
    AUTH_FIELD_DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "AUTH_FIELD_DUPLICATE_NICKNAME", "이미 사용 중인 닉네임입니다."),
    AUTH_WARN_USER_NOT_FOUND(HttpStatus.NOT_FOUND, "AUTH_WARN_USER_NOT_FOUND", "존재하지 않는 회원 정보입니다."),
    AUTH_CONFIRM_WITHDRAWAL_FAILED(HttpStatus.BAD_REQUEST, "AUTH_CONFIRM_WITHDRAWAL_FAILED", "비밀번호가 일치하지 않아 탈퇴 처리에 실패했습니다."),

    // =========================================================================
    // 3. 내 냉장고 및 식재료 도메인 (INV)
    // =========================================================================
    INV_WARN_NOT_FOUND(HttpStatus.NOT_FOUND, "INV_WARN_NOT_FOUND", "냉장고에서 해당 식재료를 찾을 수 없습니다."),
    INV_WARN_IMMINENT_EXPIRATION(HttpStatus.BAD_REQUEST, "INV_WARN_IMMINENT_EXPIRATION", "소비기한이 임박한 재료가 존재합니다."),
    INV_FIELD_INVALID_QUANTITY(HttpStatus.BAD_REQUEST, "INV_FIELD_INVALID_QUANTITY", "식재료 수량은 0보다 커야 합니다."),
    INV_FIELD_INVALID_SHELF_LIFE(HttpStatus.BAD_REQUEST, "INV_FIELD_INVALID_SHELF_LIFE", "소비기한은 과거 날짜일 수 없습니다."),
    INV_ALERT_BARCODE_NOT_FOUND(HttpStatus.NOT_FOUND, "INV_ALERT_BARCODE_NOT_FOUND", "등록되지 않은 바코드 제품입니다."),
    INV_ALERT_OCR_PARSING_FAILED(HttpStatus.BAD_REQUEST, "INV_ALERT_OCR_PARSING_FAILED", "영수증 이미지에서 식재료를 인식하지 못했습니다."),

    // =========================================================================
    // 4. 레시피 커뮤니티 도메인 (RECIPE)
    // =========================================================================
    RECIPE_WARN_NOT_FOUND(HttpStatus.NOT_FOUND, "RECIPE_WARN_NOT_FOUND", "요청하신 레시피를 찾을 수 없습니다."),
    RECIPE_WARN_NOT_AUTHOR(HttpStatus.FORBIDDEN, "RECIPE_WARN_NOT_AUTHOR", "레시피 작성자만 수정 및 삭제할 수 있습니다."),
    RECIPE_FIELD_REQUIRED_INGREDIENTS(HttpStatus.BAD_REQUEST, "RECIPE_FIELD_REQUIRED_INGREDIENTS", "레시피 등록 시 최소 1개 이상의 식재료를 입력해야 합니다."),

    // =========================================================================
    // 5. 스마트 매칭 엔진 도메인 (MATCH)
    // =========================================================================
    MATCH_WARN_NO_MATCHING_RECIPE(HttpStatus.NOT_FOUND, "MATCH_WARN_NO_MATCHING_RECIPE", "냉장고 속 재료로 만들 수 있는 추천 레시피가 없습니다."),
    MATCH_WARN_INSUFFICIENT_INGREDIENTS(HttpStatus.BAD_REQUEST, "MATCH_WARN_INSUFFICIENT_INGREDIENTS", "요리에 필요한 재료 수량이 부족합니다."),

    // =========================================================================
    // 6. 알림 센터 도메인 (NOTI)
    // =========================================================================
    NOTI_WARN_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTI_WARN_NOT_FOUND", "해당 알림 내역을 찾을 수 없습니다.");

    /**
     * HTTP 상태 코드
     */
    private final HttpStatus status;

    /**
     * 에러 식별 코드 문자열
     */
    private final String code;

    /**
     * 기본 에러 안내 메시지
     */
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }

    @NonNull
    public HttpStatus getStatus() {
        return this.status;
    }

    @NonNull
    public String getCode() {
        return this.code;
    }

    @NonNull
    public String getMessage() {
        return this.message;
    }
}
