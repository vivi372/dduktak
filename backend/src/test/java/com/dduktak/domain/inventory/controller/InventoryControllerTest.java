package com.dduktak.domain.inventory.controller;

import com.dduktak.domain.inventory.dto.*;
import com.dduktak.domain.inventory.service.InventoryService;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import com.dduktak.global.error.GlobalExceptionHandler;
import com.dduktak.global.filter.TraceIdFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("[단위/슬라이스 테스트] InventoryController 바코드 및 영수증 OCR API 명세 검증")
class InventoryControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private InventoryService inventoryService;

    @InjectMocks
    private InventoryController inventoryController;

    private final UUID TEST_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter(objectMapper);

        mockMvc = MockMvcBuilders.standaloneSetup(inventoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(converter)
                .addFilters(new TraceIdFilter())
                .build();

        Authentication auth = new UsernamePasswordAuthenticationToken(TEST_USER_ID.toString(), null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        MDC.clear();
    }

    @Test
    @DisplayName("GET /api/v1/inventory/barcode/{barcodeNo} - 등록/매칭된 바코드 조회 시 200 OK 및 DTO 반환")
    void getIngredientByBarcode_success() throws Exception {
        // given
        String barcode = "0246890115701";
        BarcodeIngredientResponseDto responseDto = BarcodeIngredientResponseDto.builder()
                .masterIngredientId(4L)
                .name("돼지고기 (삼겹살/목살)")
                .categoryId(2L)
                .recommendedUnit("g")
                .recommendedExpireDate(LocalDate.now().plusDays(3))
                .build();

        given(inventoryService.getIngredientByBarcode(eq(barcode)))
                .willReturn(responseDto);

        // when & then
        mockMvc.perform(get("/api/v1/inventory/barcode/{barcodeNo}", barcode)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.masterIngredientId").value(4))
                .andExpect(jsonPath("$.data.name").value("돼지고기 (삼겹살/목살)"))
                .andExpect(jsonPath("$.data.categoryId").value(2))
                .andExpect(jsonPath("$.data.recommendedUnit").value("g"))
                .andExpect(jsonPath("$.data.recommendedExpireDate").value(LocalDate.now().plusDays(3).toString()));
    }

    @Test
    @DisplayName("GET /api/v1/inventory/barcode/{barcodeNo} - 미등록 또는 매핑 불가 바코드 조회 시 404 INV_WARN_BARCODE_NOT_FOUND 반환")
    void getIngredientByBarcode_notFound() throws Exception {
        // given
        String barcode = "08801045121086";
        given(inventoryService.getIngredientByBarcode(eq(barcode)))
                .willThrow(new CustomException(ErrorCode.INV_WARN_BARCODE_NOT_FOUND));

        // when & then
        mockMvc.perform(get("/api/v1/inventory/barcode/{barcodeNo}", barcode)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INV_WARN_BARCODE_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("등록되지 않은 바코드 제품입니다."));
    }

    @Test
    @DisplayName("POST /api/v1/inventory/scan-ocr - 정상 영수증 이미지 분석 시 200 OK 및 식재료 품목 배열 반환")
    void scanReceiptOcr_success() throws Exception {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image", "receipt.jpg", MediaType.IMAGE_JPEG_VALUE, "dummy image content".getBytes()
        );

        List<OcrIngredientResponseDto> responseList = List.of(
                OcrIngredientResponseDto.builder()
                        .masterIngredientId(3L)
                        .name("계란")
                        .quantity(BigDecimal.valueOf(2))
                        .unit("개")
                        .recommendedExpireDate(LocalDate.now().plusDays(21))
                        .build()
        );

        given(inventoryService.scanReceiptOcr(any()))
                .willReturn(responseList);

        // when & then
        mockMvc.perform(multipart("/api/v1/inventory/scan-ocr")
                        .file(file)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].masterIngredientId").value(3))
                .andExpect(jsonPath("$.data[0].name").value("계란"))
                .andExpect(jsonPath("$.data[0].quantity").value(2))
                .andExpect(jsonPath("$.data[0].unit").value("개"));
    }

    @Test
    @DisplayName("POST /api/v1/inventory/scan-ocr - 미인식 또는 분석 실패 시 200 OK 및 빈 배열 [] 안전 반환")
    void scanReceiptOcr_emptyFallback() throws Exception {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image", "corrupted.jpg", MediaType.IMAGE_JPEG_VALUE, "corrupted content".getBytes()
        );

        given(inventoryService.scanReceiptOcr(any()))
                .willReturn(Collections.emptyList());

        // when & then
        mockMvc.perform(multipart("/api/v1/inventory/scan-ocr")
                        .file(file)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    // =========================================================================
    // 모듈 2: 내 냉장고 CRUD 및 마스터 조회 API 슬라이스 테스트
    // =========================================================================

    @Test
    @DisplayName("GET /api/v1/inventory/master-ingredients - 마스터 식재료 목록 조회 시 200 OK 및 목록 반환")
    void getMasterIngredients_success() throws Exception {
        // given
        List<MasterIngredientResponseDto> responseList = List.of(
                MasterIngredientResponseDto.builder()
                        .masterIngredientId(3L)
                        .name("계란")
                        .categoryId(2L)
                        .categoryName("정육/계란")
                        .defaultUnit("개")
                        .defaultShelfDays(21)
                        .build()
        );

        given(inventoryService.getMasterIngredients(eq("계란"), eq(2L)))
                .willReturn(responseList);

        // when & then
        mockMvc.perform(get("/api/v1/inventory/master-ingredients")
                        .param("query", "계란")
                        .param("categoryId", "2")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].masterIngredientId").value(3))
                .andExpect(jsonPath("$.data[0].name").value("계란"))
                .andExpect(jsonPath("$.data[0].categoryName").value("정육/계란"));
    }

    @Test
    @DisplayName("POST /api/v1/inventory - 정상 식재료 등록 시 201 Created 및 DTO 반환")
    void addIngredient_success() throws Exception {
        // given
        IngredientCreateRequestDto requestDto = IngredientCreateRequestDto.builder()
                .masterIngredientId(3L)
                .storageType("REFRIGERATED")
                .quantity(new BigDecimal("10.00"))
                .unit("개")
                .expireDate(LocalDate.now().plusDays(21))
                .memo("독립 레코드 등록")
                .build();

        IngredientCreateResponseDto responseDto = IngredientCreateResponseDto.builder()
                .ingredientId(101L)
                .name("계란")
                .memo("독립 레코드 등록")
                .build();

        given(inventoryService.addIngredient(eq(TEST_USER_ID), any(IngredientCreateRequestDto.class)))
                .willReturn(responseDto);

        // when & then
        mockMvc.perform(post("/api/v1/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.ingredientId").value(101))
                .andExpect(jsonPath("$.data.name").value("계란"))
                .andExpect(jsonPath("$.data.memo").value("독립 레코드 등록"));
    }

    @Test
    @DisplayName("POST /api/v1/inventory - 유효하지 않은 수량(0 이하) 입력 시 400 Bad Request 반환")
    void addIngredient_validationFailed_zeroQuantity() throws Exception {
        // given: quantity = 0 -> @Positive 위반
        IngredientCreateRequestDto invalidDto = IngredientCreateRequestDto.builder()
                .masterIngredientId(3L)
                .storageType("REFRIGERATED")
                .quantity(BigDecimal.ZERO)
                .build();

        // when & then
        mockMvc.perform(post("/api/v1/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDto))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("COMMON_FIELD_INVALID_INPUT"));
    }

    @Test
    @DisplayName("GET /api/v1/inventory - 내 냉장고 식재료 목록 조회 시 200 OK 및 D-Day 포함 목록 반환")
    void getMyIngredients_success() throws Exception {
        // given
        List<IngredientResponseDto> responseList = List.of(
                IngredientResponseDto.builder()
                        .ingredientId(101L)
                        .masterIngredientId(3L)
                        .categoryId(2L)
                        .name("계란")
                        .storageType("REFRIGERATED")
                        .quantity(new BigDecimal("10.00"))
                        .unit("개")
                        .expireDate(LocalDate.now().plusDays(5))
                        .dDay(5)
                        .memo("신선란")
                        .build()
        );

        given(inventoryService.getMyIngredients(eq(TEST_USER_ID), eq("계란"), eq(2L), eq("REFRIGERATED"), eq("ACTIVE")))
                .willReturn(responseList);

        // when & then
        mockMvc.perform(get("/api/v1/inventory")
                        .param("query", "계란")
                        .param("categoryId", "2")
                        .param("storageType", "REFRIGERATED")
                        .param("status", "ACTIVE")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].ingredientId").value(101))
                .andExpect(jsonPath("$.data[0].dDay").value(5))
                .andExpect(jsonPath("$.data[0].name").value("계란"));
    }

    @Test
    @DisplayName("PUT /api/v1/inventory/{ingredientId} - 정상 수정 시 200 OK 및 수정 DTO 반환")
    void updateIngredient_success() throws Exception {
        // given
        IngredientUpdateRequestDto updateDto = IngredientUpdateRequestDto.builder()
                .storageType("FROZEN")
                .quantity(new BigDecimal("5.00"))
                .unit("개")
                .expireDate(LocalDate.now().plusDays(10))
                .memo("냉동 보관")
                .build();

        IngredientUpdateResponseDto responseDto = IngredientUpdateResponseDto.builder()
                .ingredientId(101L)
                .quantity(new BigDecimal("5.00"))
                .memo("냉동 보관")
                .build();

        given(inventoryService.updateIngredient(eq(TEST_USER_ID), eq(101L), any(IngredientUpdateRequestDto.class)))
                .willReturn(responseDto);

        // when & then
        mockMvc.perform(put("/api/v1/inventory/{ingredientId}", 101L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.ingredientId").value(101))
                .andExpect(jsonPath("$.data.memo").value("냉동 보관"));
    }

    @Test
    @DisplayName("PUT /api/v1/inventory/{ingredientId} - 타인 소유 또는 미존재 시 404 INV_WARN_NOT_FOUND 반환")
    void updateIngredient_notFound() throws Exception {
        // given
        IngredientUpdateRequestDto updateDto = IngredientUpdateRequestDto.builder()
                .storageType("REFRIGERATED")
                .quantity(new BigDecimal("1.00"))
                .unit("개")
                .expireDate(LocalDate.now().plusDays(10))
                .build();

        given(inventoryService.updateIngredient(eq(TEST_USER_ID), eq(999L), any(IngredientUpdateRequestDto.class)))
                .willThrow(new CustomException(ErrorCode.INV_WARN_NOT_FOUND));

        // when & then
        mockMvc.perform(put("/api/v1/inventory/{ingredientId}", 999L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INV_WARN_NOT_FOUND"));
    }

    @Test
    @DisplayName("DELETE /api/v1/inventory/{ingredientId} - 정상 소프트 삭제 시 200 OK 반환")
    void deleteIngredient_success() throws Exception {
        mockMvc.perform(delete("/api/v1/inventory/{ingredientId}", 101L)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("식재료가 성공적으로 삭제되었습니다."));
    }

    @Test
    @DisplayName("DELETE /api/v1/inventory/{ingredientId} - 타인 소유 또는 미존재 시 404 반환")
    void deleteIngredient_notFound() throws Exception {
        org.mockito.BDDMockito.willThrow(new CustomException(ErrorCode.INV_WARN_NOT_FOUND))
                .given(inventoryService).deleteIngredient(eq(TEST_USER_ID), eq(999L));

        mockMvc.perform(delete("/api/v1/inventory/{ingredientId}", 999L)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INV_WARN_NOT_FOUND"));
    }

    @Test
    @DisplayName("PATCH /api/v1/inventory/{ingredientId}/consume - 정상 소비 처리 시 200 OK 및 잔여 정보 반환")
    void consumeIngredient_success() throws Exception {
        // given
        IngredientConsumeRequestDto consumeDto = IngredientConsumeRequestDto.builder()
                .consumeQuantity(new BigDecimal("3.00"))
                .build();

        IngredientConsumeResponseDto responseDto = IngredientConsumeResponseDto.builder()
                .ingredientId(101L)
                .remainingQuantity(new BigDecimal("7.00"))
                .status("ACTIVE")
                .build();

        given(inventoryService.consumeIngredient(eq(TEST_USER_ID), eq(101L), any(IngredientConsumeRequestDto.class)))
                .willReturn(responseDto);

        // when & then
        mockMvc.perform(patch("/api/v1/inventory/{ingredientId}/consume", 101L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(consumeDto))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.ingredientId").value(101))
                .andExpect(jsonPath("$.data.remainingQuantity").value(7.00))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("PATCH /api/v1/inventory/{ingredientId}/consume - 타인 소유 또는 미존재 시 404 반환")
    void consumeIngredient_notFound() throws Exception {
        given(inventoryService.consumeIngredient(eq(TEST_USER_ID), eq(999L), any()))
                .willThrow(new CustomException(ErrorCode.INV_WARN_NOT_FOUND));

        mockMvc.perform(patch("/api/v1/inventory/{ingredientId}/consume", 999L)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INV_WARN_NOT_FOUND"));
    }
}
