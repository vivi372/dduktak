package com.dduktak.global.error;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 전역 예외 처리기(GlobalExceptionHandler) 및 응답 DTO 규격 단위 테스트
 */
class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        // MockMvc 독립 실행 환경 구성 (컨트롤러와 GlobalExceptionHandler 연동)
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("성공 응답: ApiResponseDto 표준 형식 직렬화 검증")
    void successResponse_ShouldReturnStandardFormat() throws Exception {
        mockMvc.perform(get("/test/success"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("뚝딱이"))
                .andExpect(jsonPath("$.message").value("성공적으로 처리되었습니다."));
    }

    @Test
    @DisplayName("커스텀 예외: CustomException 발생 시 정의된 ErrorCode 규격 반환 검증")
    void customException_ShouldReturnErrorCodeFormat() throws Exception {
        mockMvc.perform(get("/test/custom-exception"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INV_WARN_IMMINENT_EXPIRATION"))
                .andExpect(jsonPath("$.message").value("소비기한이 임박한 재료가 존재합니다."))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("커스텀 예외: 동적 커스텀 메시지가 주입된 경우 우선 적용 검증")
    void customException_WithCustomMessage_ShouldOverrideMessage() throws Exception {
        mockMvc.perform(get("/test/custom-message"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("AUTH_WARN_USER_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("지정된 이메일의 유저가 존재하지 않습니다."))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("유효성 검증 예외: @Valid 필드 오류 발생 시 400 Bad Request 및 필드 에러 상세 반환 검증")
    void validationException_ShouldReturnFieldErrors() throws Exception {
        String invalidPayload = "{\"name\":\"\",\"quantity\":-1}";

        mockMvc.perform(post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("COMMON_FIELD_INVALID_INPUT"))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.errors", hasSize(2)))
                .andExpect(jsonPath("$.errors[*].field", containsInAnyOrder("name", "quantity")));
    }

    @Test
    @DisplayName("HTTP 메서드 예외: 지원하지 않는 메서드 요청 시 405 Method Not Allowed 반환 검증")
    void methodNotAllowed_ShouldReturn405() throws Exception {
        mockMvc.perform(post("/test/success"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("COMMON_WARN_METHOD_NOT_ALLOWED"));
    }

    @Test
    @DisplayName("시스템 예외: 처리되지 않은 일반 런타임 예외 발생 시 500 Internal Server Error 반환 검증")
    void unhandledException_ShouldReturn500() throws Exception {
        mockMvc.perform(get("/test/unhandled"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("COMMON_ALERT_INTERNAL_SERVER_ERROR"))
                .andExpect(jsonPath("$.message").value("서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."));
    }

    /**
     * 테스트용 더미 컨트롤러
     */
    @RestController
    @RequestMapping("/test")
    static class TestController {

        @GetMapping("/success")
        public ApiResponseDto<String> success() {
            return ApiResponseDto.success("뚝딱이");
        }

        @GetMapping("/custom-exception")
        public void customException() {
            throw new CustomException(ErrorCode.INV_WARN_IMMINENT_EXPIRATION);
        }

        @GetMapping("/custom-message")
        public void customMessage() {
            throw new CustomException(ErrorCode.AUTH_WARN_USER_NOT_FOUND, "지정된 이메일의 유저가 존재하지 않습니다.");
        }

        @PostMapping("/validation")
        public ApiResponseDto<String> validation(@Valid @RequestBody TestRequest request) {
            return ApiResponseDto.success("검증 성공");
        }

        @GetMapping("/unhandled")
        public void unhandled() {
            throw new RuntimeException("예상치 못한 시스템 런타임 에러");
        }
    }

    static class TestRequest {
        @NotBlank(message = "재료명은 필수 입력 항목입니다.")
        private String name;

        @Positive(message = "수량은 0보다 커야 합니다.")
        private int quantity;

        public TestRequest() {
        }

        public TestRequest(String name, int quantity) {
            this.name = name;
            this.quantity = quantity;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }
    }
}
