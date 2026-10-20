package com.dduktak.domain.inventory.service;

import com.dduktak.domain.inventory.dto.*;
import com.dduktak.domain.inventory.entity.IngredientMaster;
import com.dduktak.domain.inventory.entity.UserIngredient;
import com.dduktak.domain.inventory.repository.IngredientMasterRepository;
import com.dduktak.domain.inventory.repository.UserIngredientRepository;
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
 * 표준 식재료 마스터 조회, 내 냉장고 CRUD, 소비 차감 방어 로직,
 * 바코드 상품명 조회 및 스마트 매칭, Gemini Flash 영수증 OCR 스캔 연동을 관장합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryService {

    private final IngredientMasterRepository ingredientMasterRepository;
    private final UserIngredientRepository userIngredientRepository;
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

    /**
     * 74종 표준 마스터 식재료 목록 및 카테고리 검색 조회 (INV-01-1)
     *
     * @param query 검색어 (식재료명 유사 검색)
     * @param categoryId 카테고리 ID 필터링 (선택)
     * @return 표준 마스터 식재료 응답 DTO 목록
     */
    public List<MasterIngredientResponseDto> getMasterIngredients(String query, Long categoryId) {
        log.info("[InventoryService] 표준 마스터 식재료 검색 조회: query='{}', categoryId={}", query, categoryId);
        return ingredientMasterRepository.searchMasterIngredients(query, categoryId);
    }

    /**
     * 내 냉장고 식재료 수동 직접 등록 (INV-01-2)
     * 독립 레코드(Independent Record) 원칙에 따라 기존 동일 재료가 존재하더라도
     * 수량을 합산(UPDATE)하지 않고 새로운 PK 레코드로 개별 INSERT합니다.
     * 소비기한 미입력 시 표준 식재료 마스터의 권장 보관일수(defaultShelfDays)를 가산하여 자동 계산합니다.
     *
     * @param userId 회원 UUID
     * @param dto 식재료 등록 요청 DTO
     * @return 등록 완료 DTO
     */
    @Transactional
    public IngredientCreateResponseDto addIngredient(UUID userId, IngredientCreateRequestDto dto) {
        log.info("[InventoryService] 식재료 등록 요청: userId={}, masterIngredientId={}",
                userId, dto.getMasterIngredientId());

        // 1. 마스터 식재료 조회 (필수)
        IngredientMaster master = ingredientMasterRepository.findById(dto.getMasterIngredientId())
                .orElseThrow(() -> new CustomException(ErrorCode.COMMON_ALERT_RESOURCE_NOT_FOUND));

        // 2. 단위 및 소비기한 기본값 자동 완성 (미입력 시)
        String unit = (dto.getUnit() != null && !dto.getUnit().isBlank())
                ? dto.getUnit()
                : master.getDefaultUnit();

        LocalDate expireDate = dto.getExpireDate();
        if (expireDate == null) {
            int shelfDays = master.getDefaultShelfDays() != null ? master.getDefaultShelfDays() : 7;
            expireDate = LocalDate.now().plusDays(shelfDays);
        }

        // 3. 독립 레코드 생성 (INV-01-2)
        UserIngredient newIngredient = UserIngredient.builder()
                .userId(userId)
                .masterIngredientId(master.getMasterIngredientId())
                .categoryId(master.getCategoryId())
                .name(master.getName())
                .storageType(dto.getStorageType())
                .quantity(dto.getQuantity())
                .unit(unit)
                .expireDate(expireDate)
                .memo(dto.getMemo())
                .status("ACTIVE")
                .build();

        userIngredientRepository.insert(newIngredient);
        log.info("[InventoryService] 신규 식재료 등록 완료 (독립 레코드 생성): ingredientId={}, name='{}'",
                newIngredient.getIngredientId(), newIngredient.getName());

        return IngredientCreateResponseDto.builder()
                .ingredientId(newIngredient.getIngredientId())
                .name(newIngredient.getName())
                .memo(newIngredient.getMemo())
                .build();
    }

    /**
     * 내 냉장고 식재료 목록 조회 (INV-01-2)
     * SQL 레벨에서 D-Day((expire_date - CURRENT_DATE))를 연산하여 반환하며,
     * 소비기한 임박순(expire_date ASC, created_at ASC)으로 정렬됩니다.
     *
     * @param userId 회원 UUID
     * @param query 검색어 (재료명 또는 메모 유사 검색)
     * @param categoryId 카테고리 필터
     * @param storageType 보관 방법 필터 (REFRIGERATED, FROZEN, ROOM_TEMP)
     * @param status 상태 필터 (기본값 ACTIVE)
     * @return 내 냉장고 식재료 응답 DTO 목록
     */
    public List<IngredientResponseDto> getMyIngredients(
            UUID userId,
            String query,
            Long categoryId,
            String storageType,
            String status
    ) {
        String targetStatus = (status != null && !status.isBlank()) ? status : "ACTIVE";
        log.info("[InventoryService] 냉장고 식재료 목록 조회: userId={}, status={}, query='{}'", userId, targetStatus, query);

        List<UserIngredient> ingredients = userIngredientRepository.findAllByUserIdAndFilter(
                userId, query, categoryId, storageType, targetStatus);

        return ingredients.stream()
                .map(i -> IngredientResponseDto.builder()
                        .ingredientId(i.getIngredientId())
                        .masterIngredientId(i.getMasterIngredientId())
                        .categoryId(i.getCategoryId())
                        .name(i.getName())
                        .storageType(i.getStorageType())
                        .quantity(i.getQuantity())
                        .unit(i.getUnit())
                        .expireDate(i.getExpireDate())
                        .dDay(i.getDDay())
                        .memo(i.getMemo())
                        .build())
                .toList();
    }

    /**
     * 내 냉장고 식재료 개별 정보 수정 (INV-01-2)
     * 식재료 마스터는 불변이며, 보관 방법/수량/단위/소비기한/메모만 수정 가능합니다.
     * 본인 소유가 아니거나 없는 경우 404 (INV_WARN_NOT_FOUND)를 반환합니다.
     *
     * @param userId 회원 UUID
     * @param ingredientId 식재료 ID
     * @param dto 수정 요청 DTO
     * @return 수정 완료 DTO
     */
    @Transactional
    public IngredientUpdateResponseDto updateIngredient(UUID userId, Long ingredientId, IngredientUpdateRequestDto dto) {
        log.info("[InventoryService] 식재료 수정 요청: userId={}, ingredientId={}", userId, ingredientId);

        userIngredientRepository.findByIdAndUserId(ingredientId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.INV_WARN_NOT_FOUND));

        UserIngredient updateTarget = UserIngredient.builder()
                .ingredientId(ingredientId)
                .userId(userId)
                .storageType(dto.getStorageType())
                .quantity(dto.getQuantity())
                .unit(dto.getUnit())
                .expireDate(dto.getExpireDate())
                .memo(dto.getMemo())
                .build();

        userIngredientRepository.update(updateTarget);
        log.info("[InventoryService] 식재료 수정 완료: ingredientId={}", ingredientId);

        return IngredientUpdateResponseDto.builder()
                .ingredientId(ingredientId)
                .quantity(dto.getQuantity())
                .memo(dto.getMemo())
                .build();
    }

    /**
     * 내 냉장고 식재료 소프트 삭제 (INV-01-2)
     * 데이터는 물리 삭제되지 않고 status='DELETED'로 전이됩니다.
     * 본인 소유가 아니거나 없는 경우 404 (INV_WARN_NOT_FOUND)를 반환합니다.
     *
     * @param userId 회원 UUID
     * @param ingredientId 식재료 ID
     */
    @Transactional
    public void deleteIngredient(UUID userId, Long ingredientId) {
        log.info("[InventoryService] 식재료 소프트 삭제 요청: userId={}, ingredientId={}", userId, ingredientId);

        userIngredientRepository.findByIdAndUserId(ingredientId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.INV_WARN_NOT_FOUND));

        userIngredientRepository.softDelete(ingredientId, userId);
        log.info("[InventoryService] 식재료 소프트 삭제 완료: ingredientId={}", ingredientId);
    }

    /**
     * 내 냉장고 식재료 수동 소비 처리 (INV-01-2)
     * 수량 방어 로직: Math.max(0, current - consume)을 적용하여 음수 수량을 방지합니다.
     * 차감 후 잔여 수량이 0 이하가 되면 상태가 'CONSUMED'로 자동 전이됩니다.
     * consumeQuantity가 전달되지 않은 경우 전량 소비로 간주합니다.
     * 본인 소유가 아니거나 없는 경우 404 (INV_WARN_NOT_FOUND)를 반환합니다.
     *
     * @param userId 회원 UUID
     * @param ingredientId 식재료 ID
     * @param dto 소비 요청 DTO (소비 수량 포함, null 가능)
     * @return 소비 처리 결과 DTO (잔여 수량 및 상태)
     */
    @Transactional
    public IngredientConsumeResponseDto consumeIngredient(
            UUID userId,
            Long ingredientId,
            IngredientConsumeRequestDto dto
    ) {
        log.info("[InventoryService] 식재료 소비 처리 요청: userId={}, ingredientId={}, consumeQuantity={}",
                userId, ingredientId, dto != null ? dto.getConsumeQuantity() : "ALL");

        UserIngredient ingredient = userIngredientRepository.findByIdAndUserId(ingredientId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.INV_WARN_NOT_FOUND));

        BigDecimal currentQty = ingredient.getQuantity() != null ? ingredient.getQuantity() : BigDecimal.ZERO;
        BigDecimal remainingQty;
        String newStatus;

        if (dto == null || dto.getConsumeQuantity() == null) {
            // 소비 수량 미입력 시 전량 소비
            remainingQty = BigDecimal.ZERO;
            newStatus = "CONSUMED";
        } else {
            BigDecimal consumeQty = dto.getConsumeQuantity();
            // 수량 방어 로직: 음수 방지 Math.max(0, current - consume)
            BigDecimal calculated = currentQty.subtract(consumeQty);
            if (calculated.compareTo(BigDecimal.ZERO) <= 0) {
                remainingQty = BigDecimal.ZERO;
                newStatus = "CONSUMED";
            } else {
                remainingQty = calculated;
                newStatus = "ACTIVE";
            }
        }

        userIngredientRepository.updateQuantityAndStatus(ingredientId, userId, remainingQty, newStatus);
        log.info("[InventoryService] 식재료 소비 완료: ingredientId={}, remainingQty={}, status={}",
                ingredientId, remainingQty, newStatus);

        return IngredientConsumeResponseDto.builder()
                .ingredientId(ingredientId)
                .remainingQuantity(remainingQty)
                .status(newStatus)
                .build();
    }
}
