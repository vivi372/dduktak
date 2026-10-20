package com.dduktak.domain.inventory.service;

import com.dduktak.domain.inventory.dto.BarcodeIngredientResponseDto;
import com.dduktak.domain.inventory.dto.GeminiReceiptItemDto;
import com.dduktak.domain.inventory.dto.OcrIngredientResponseDto;
import com.dduktak.domain.inventory.entity.IngredientMaster;
import com.dduktak.domain.inventory.repository.IngredientMasterRepository;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * 내 재료 관리소(Inventory) 비즈니스 서비스
 * 바코드 상품명 조회 및 표준 식재료 스마트 매칭, Gemini Flash 기반 영수증 OCR 스캔 연동을 관장합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryService {

    private final IngredientMasterRepository ingredientMasterRepository;
    private final BarcodeProductLookupService barcodeProductLookupService;
    private final IngredientMatcher ingredientMatcher;
    private final GeminiOcrClient geminiOcrClient;

    /**
     * 바코드 번호 기반 표준 식재료 조회 (INV-01-3)
     * 바코드 -> 상품명 조회 -> 74종 표준 식재료 유사 매칭 순으로 탐색하며,
     * 일치하는 표준 식재료가 없을 경우 INV_WARN_BARCODE_NOT_FOUND (404)를 발생시킵니다.
     *
     * @param barcodeNo 바코드 번호
     * @return 매칭된 표준 식재료 정보 및 권장 소비기한 DTO
     */
    public BarcodeIngredientResponseDto getIngredientByBarcode(String barcodeNo) {
        log.info("[InventoryService] 바코드 식재료 조회 요청: '{}'", barcodeNo);

        // 1. 바코드 번호로 유통 상품명 조회 (FoodQR/식품안전나라/로컬 사전)
        Optional<String> productNameOpt = barcodeProductLookupService.lookupProductName(barcodeNo);
        if (productNameOpt.isEmpty()) {
            log.warn("[InventoryService] 바코드 상품명 조회 불가 -> 404 예외 발생: '{}'", barcodeNo);
            throw new CustomException(ErrorCode.INV_WARN_BARCODE_NOT_FOUND);
        }

        String productName = productNameOpt.get();
        log.info("[InventoryService] 조회된 상품명: '{}' (바코드: '{}')", productName, barcodeNo);

        // 2. 74종 표준 마스터 식재료 전체 목록 로드
        List<IngredientMaster> masterList = ingredientMasterRepository.findAll();

        // 3. 스마트 매칭 엔진을 통한 표준 식재료 유사 매칭
        Optional<IngredientMaster> matchedMasterOpt = ingredientMatcher.matchToMaster(productName, masterList);
        if (matchedMasterOpt.isEmpty()) {
            log.warn("[InventoryService] 상품명 '{}'에 대응하는 표준 식재료 없음 (파채 등 미등록) -> 404 예외 발생", productName);
            throw new CustomException(ErrorCode.INV_WARN_BARCODE_NOT_FOUND);
        }

        IngredientMaster master = matchedMasterOpt.get();
        LocalDate recommendedExpireDate = LocalDate.now().plusDays(master.getDefaultShelfDays() != null ? master.getDefaultShelfDays() : 7);

        log.info("[InventoryService] 바코드 매칭 최종 성공: '{}' -> '{}' (ID: {}, 권장 소비기한: {})",
                productName, master.getName(), master.getMasterIngredientId(), recommendedExpireDate);

        return BarcodeIngredientResponseDto.builder()
                .masterIngredientId(master.getMasterIngredientId())
                .name(master.getName())
                .categoryId(master.getCategoryId())
                .recommendedUnit(master.getDefaultUnit())
                .recommendedExpireDate(recommendedExpireDate)
                .build();
    }

    /**
     * 영수증 OCR 이미지 스캔 및 표준 식재료 일괄 추출 (INV-01-3)
     * Google AI Studio Gemini Flash REST API를 통해 식재료 목록을 파싱하고 마스터 식재료와 매핑합니다.
     * 실패하거나 인식되지 않을 경우 500 에러를 차단하고 빈 배열(Collections.emptyList())을 안전하게 반환합니다.
     *
     * @param image 영수증 이미지 파일 (MultipartFile)
     * @return 인식 및 매핑된 식재료 응답 DTO 목록
     */
    public List<OcrIngredientResponseDto> scanReceiptOcr(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            log.warn("[InventoryService] 업로드된 영수증 이미지 파일이 비어 있습니다.");
            return Collections.emptyList();
        }

        try {
            byte[] imageBytes = image.getBytes();
            String contentType = image.getContentType();

            // 1. Gemini Flash API 호출
            List<GeminiReceiptItemDto> ocrItems = geminiOcrClient.scanReceipt(imageBytes, contentType);
            if (ocrItems.isEmpty()) {
                log.info("[InventoryService] Gemini 영수증 인식 결과 식재료 품목 없음 -> 빈 목록 반환");
                return Collections.emptyList();
            }

            // 2. 74종 표준 마스터 식재료 전체 목록 로드
            List<IngredientMaster> masterList = ingredientMasterRepository.findAll();
            List<OcrIngredientResponseDto> resultList = new ArrayList<>();

            // 3. 각 인식 품목에 대해 표준 식재료 매핑 및 DTO 조립
            for (GeminiReceiptItemDto item : ocrItems) {
                // matchedMasterName 우선 매칭 후, 실패 시 rawName 매칭 시도
                Optional<IngredientMaster> masterOpt = ingredientMatcher.matchToMaster(item.getMatchedMasterName(), masterList);
                if (masterOpt.isEmpty() && item.getRawName() != null) {
                    masterOpt = ingredientMatcher.matchToMaster(item.getRawName(), masterList);
                }

                if (masterOpt.isPresent()) {
                    IngredientMaster master = masterOpt.get();
                    BigDecimal quantity = (item.getQuantity() != null && item.getQuantity().compareTo(BigDecimal.ZERO) > 0)
                            ? item.getQuantity()
                            : BigDecimal.valueOf(1.00);

                    String unit = (item.getUnit() != null && !item.getUnit().isBlank())
                            ? item.getUnit()
                            : master.getDefaultUnit();

                    LocalDate recommendedExpireDate = LocalDate.now().plusDays(
                            master.getDefaultShelfDays() != null ? master.getDefaultShelfDays() : 7);

                    resultList.add(OcrIngredientResponseDto.builder()
                            .masterIngredientId(master.getMasterIngredientId())
                            .name(master.getName())
                            .quantity(quantity)
                            .unit(unit)
                            .recommendedExpireDate(recommendedExpireDate)
                            .build());
                } else {
                    log.debug("[InventoryService] 영수증 품목 중 마스터 미등록 항목 제외: rawName='{}', matchedMasterName='{}'",
                            item.getRawName(), item.getMatchedMasterName());
                }
            }

            log.info("[InventoryService] 영수증 OCR 최종 매핑 완료 (추출 품목 수: {})", resultList.size());
            return resultList;

        } catch (Exception e) {
            log.error("[InventoryService] 영수증 OCR 처리 중 예외 발생 (안전한 빈 목록 반환): {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }
}
