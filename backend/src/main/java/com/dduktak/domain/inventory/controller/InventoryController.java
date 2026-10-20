package com.dduktak.domain.inventory.controller;

import com.dduktak.domain.inventory.dto.BarcodeIngredientResponseDto;
import com.dduktak.domain.inventory.dto.OcrIngredientResponseDto;
import com.dduktak.domain.inventory.service.InventoryService;
import com.dduktak.global.error.ApiResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 내 재료 관리소(Inventory) 도메인 REST Controller (/api/v1/inventory)
 * 바코드 식재료 조회 및 Gemini Flash 기반 영수증 OCR 스캔 엔드포인트를 제공합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    /**
     * 바코드 번호 기반 표준 식재료 조회 (INV-01-3)
     * 바코드로 상품명을 조회한 뒤 74종 표준 식재료와 유사 매칭을 수행합니다.
     * 미등록 또는 매핑 불가 시 404 Not Found (INV_WARN_BARCODE_NOT_FOUND)를 반환합니다.
     *
     * @param barcodeNo EAN-13 / GTIN-14 바코드 번호
     * @return 표준 식재료 정보 및 권장 소비기한 DTO
     */
    @GetMapping("/barcode/{barcodeNo}")
    public ResponseEntity<ApiResponseDto<BarcodeIngredientResponseDto>> getIngredientByBarcode(
            @PathVariable("barcodeNo") String barcodeNo
    ) {
        BarcodeIngredientResponseDto response = inventoryService.getIngredientByBarcode(barcodeNo);
        return ResponseEntity.ok(ApiResponseDto.success(response, "바코드 식재료 조회가 완료되었습니다."));
    }

    /**
     * 영수증 OCR 이미지 스캔 및 식재료 일괄 파싱 (INV-01-3)
     * Google AI Studio Gemini Flash REST API를 활용해 영수증 이미지를 JSON 품목 배열로 파싱합니다.
     * 실패하거나 인식되지 않을 경우 500 에러를 방지하고 200 OK 빈 배열(data: [])을 반환합니다.
     *
     * @param image 영수증 이미지 파일 (MultipartFile)
     * @return 인식 및 표준 매핑된 식재료 목록 DTO
     */
    @PostMapping(value = "/scan-ocr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponseDto<List<OcrIngredientResponseDto>>> scanReceiptOcr(
            @RequestParam("image") MultipartFile image
    ) {
        List<OcrIngredientResponseDto> response = inventoryService.scanReceiptOcr(image);
        return ResponseEntity.ok(ApiResponseDto.success(response, "영수증 OCR 스캔 분석이 완료되었습니다."));
    }
}
