package com.dduktak.domain.inventory.controller;

import com.dduktak.domain.inventory.dto.*;
import com.dduktak.domain.inventory.service.InventoryService;
import com.dduktak.global.error.ApiResponseDto;
import com.dduktak.global.security.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * 내 재료 관리소(Inventory) 도메인 REST Controller (/api/v1/inventory)
 * 표준 마스터 식재료 조회, 내 냉장고 CRUD, 소비 처리, 바코드 조회 및 영수증 OCR 스캔 엔드포인트를 제공합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    /**
     * 74종 표준 마스터 식재료 목록 및 카테고리 검색 조회 (INV-01-1)
     * 식재료 직접 등록 시 자동완성/선택 검색창에 활용됩니다.
     *
     * @param query 식재료명 유사 검색어 (선택)
     * @param categoryId 카테고리 식별자 필터 (선택)
     * @return 마스터 식재료 목록 응답 DTO
     */
    @GetMapping("/master-ingredients")
    public ResponseEntity<ApiResponseDto<List<MasterIngredientResponseDto>>> getMasterIngredients(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "categoryId", required = false) Long categoryId
    ) {
        List<MasterIngredientResponseDto> response = inventoryService.getMasterIngredients(query, categoryId);
        return ResponseEntity.ok(ApiResponseDto.success(response, "표준 식재료 마스터 조회가 완료되었습니다."));
    }

    /**
     * 내 냉장고 식재료 수동 직접 등록 (INV-01-2)
     * 독립 레코드(Independent Record) 원칙에 따라 기존 식재료와 수량을 합산하지 않고 새 레코드로 저장합니다.
     *
     * @param dto 식재료 등록 요청 DTO
     * @return 등록 완료 DTO
     */
    @PostMapping
    public ResponseEntity<ApiResponseDto<IngredientCreateResponseDto>> addIngredient(
            @Valid @RequestBody IngredientCreateRequestDto dto
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        IngredientCreateResponseDto response = inventoryService.addIngredient(userId, dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseDto.success(response, "식재료가 성공적으로 등록되었습니다."));
    }

    /**
     * 내 냉장고 식재료 목록 조회 (INV-01-2)
     * SQL 레벨에서 실시간 D-Day 연산 및 소비기한 임박순 정렬을 수행하여 반환합니다.
     *
     * @param query 재료명/메모 유사 검색어 (선택)
     * @param categoryId 카테고리 필터 (선택)
     * @param storageType 보관 방법 필터 (선택, REFRIGERATED, FROZEN, ROOM_TEMP)
     * @param status 상태 필터 (선택, 기본값 ACTIVE)
     * @return 냉장고 식재료 목록 DTO
     */
    @GetMapping
    public ResponseEntity<ApiResponseDto<List<IngredientResponseDto>>> getMyIngredients(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "storageType", required = false) String storageType,
            @RequestParam(value = "status", required = false, defaultValue = "ACTIVE") String status
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        List<IngredientResponseDto> response = inventoryService.getMyIngredients(userId, query, categoryId, storageType, status);
        return ResponseEntity.ok(ApiResponseDto.success(response, "내 냉장고 식재료 목록 조회가 완료되었습니다."));
    }

    /**
     * 내 냉장고 식재료 개별 정보 수정 (INV-01-2)
     * 본인 소유의 식재료에 한해 보관방법, 수량, 단위, 소비기한, 메모를 수정합니다.
     *
     * @param ingredientId 식재료 ID
     * @param dto 수정 요청 DTO
     * @return 수정 완료 DTO
     */
    @PutMapping("/{ingredientId}")
    public ResponseEntity<ApiResponseDto<IngredientUpdateResponseDto>> updateIngredient(
            @PathVariable("ingredientId") Long ingredientId,
            @Valid @RequestBody IngredientUpdateRequestDto dto
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        IngredientUpdateResponseDto response = inventoryService.updateIngredient(userId, ingredientId, dto);
        return ResponseEntity.ok(ApiResponseDto.success(response, "식재료 정보가 성공적으로 수정되었습니다."));
    }

    /**
     * 내 냉장고 식재료 소프트 삭제 (INV-01-2)
     * status='DELETED'로 소프트 삭제 처리합니다.
     *
     * @param ingredientId 식재료 ID
     * @return 공통 성공 응답
     */
    @DeleteMapping("/{ingredientId}")
    public ResponseEntity<ApiResponseDto<Void>> deleteIngredient(
            @PathVariable("ingredientId") Long ingredientId
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        inventoryService.deleteIngredient(userId, ingredientId);
        return ResponseEntity.ok(ApiResponseDto.success(null, "식재료가 성공적으로 삭제되었습니다."));
    }

    /**
     * 내 냉장고 식재료 수동 소비 처리 (INV-01-2)
     * 수량 방어 로직(Math.max)이 적용되며 잔여 수량이 0이 되면 status='CONSUMED'로 자동 전이됩니다.
     *
     * @param ingredientId 식재료 ID
     * @param dto 소비 요청 DTO (수량 미입력 시 전량 소비)
     * @return 소비 처리 결과 DTO
     */
    @PatchMapping("/{ingredientId}/consume")
    public ResponseEntity<ApiResponseDto<IngredientConsumeResponseDto>> consumeIngredient(
            @PathVariable("ingredientId") Long ingredientId,
            @Valid @RequestBody(required = false) IngredientConsumeRequestDto dto
    ) {
        UUID userId = SecurityUtil.getCurrentUserId();
        IngredientConsumeResponseDto response = inventoryService.consumeIngredient(userId, ingredientId, dto);
        return ResponseEntity.ok(ApiResponseDto.success(response, "식재료 소비가 성공적으로 처리되었습니다."));
    }

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
