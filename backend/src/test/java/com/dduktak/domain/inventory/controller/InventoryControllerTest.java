package com.dduktak.domain.inventory.controller;

import com.dduktak.domain.inventory.dto.BarcodeIngredientResponseDto;
import com.dduktak.domain.inventory.dto.OcrIngredientResponseDto;
import com.dduktak.domain.inventory.service.InventoryService;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import com.dduktak.global.error.GlobalExceptionHandler;
import com.dduktak.global.filter.TraceIdFilter;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("[단위/슬라이스 테스트] InventoryController 바코드 및 영수증 OCR API 명세 검증")
class InventoryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private InventoryService inventoryService;

    @InjectMocks
    private InventoryController inventoryController;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter(objectMapper);

        mockMvc = MockMvcBuilders.standaloneSetup(inventoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(converter)
                .addFilters(new TraceIdFilter())
                .build();
    }

    @AfterEach
    void tearDown() {
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
}
