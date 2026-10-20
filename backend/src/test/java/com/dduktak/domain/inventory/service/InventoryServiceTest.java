package com.dduktak.domain.inventory.service;

import com.dduktak.domain.inventory.dto.*;
import com.dduktak.domain.inventory.entity.IngredientMaster;
import com.dduktak.domain.inventory.entity.UserIngredient;
import com.dduktak.domain.inventory.repository.IngredientMasterRepository;
import com.dduktak.domain.inventory.repository.UserIngredientRepository;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("[단위 테스트] InventoryService 바코드 조회 및 영수증 OCR 비즈니스 로직 검증")
class InventoryServiceTest {

    @Mock
    private IngredientMasterRepository ingredientMasterRepository;

    @Mock
    private UserIngredientRepository userIngredientRepository;

    @Mock
    private BarcodeProductLookupService barcodeProductLookupService;

    @Spy
    private IngredientMatcher ingredientMatcher = new IngredientMatcher();

    @Mock
    private GeminiOcrClient geminiOcrClient;

    @InjectMocks
    private InventoryService inventoryService;

    private List<IngredientMaster> masterList;

    @BeforeEach
    void setUp() {
        masterList = List.of(
                IngredientMaster.builder().masterIngredientId(1L).categoryId(1L).name("양파").defaultUnit("개").defaultShelfDays(14).build(),
                IngredientMaster.builder().masterIngredientId(2L).categoryId(1L).name("대파").defaultUnit("뿌리").defaultShelfDays(7).build(),
                IngredientMaster.builder().masterIngredientId(3L).categoryId(2L).name("계란").defaultUnit("개").defaultShelfDays(21).build(),
                IngredientMaster.builder().masterIngredientId(4L).categoryId(2L).name("돼지고기 (삼겹살/목살)").defaultUnit("g").defaultShelfDays(3).build(),
                IngredientMaster.builder().masterIngredientId(5L).categoryId(2L).name("소고기 (국거리/불고기용)").defaultUnit("g").defaultShelfDays(3).build(),
                IngredientMaster.builder().masterIngredientId(7L).categoryId(2L).name("닭가슴살").defaultUnit("팩").defaultShelfDays(5).build()
        );
    }

    @Test
    @DisplayName("바코드 조회 성공: '0246890115701' (삼겹살) -> '돼지고기 (삼겹살/목살)' 매칭 및 권장소비기한(오늘+3일) 반환")
    void getIngredientByBarcode_samgyeopsal_success() {
        // given
        String barcode = "0246890115701";
        given(barcodeProductLookupService.lookupProductName(barcode))
                .willReturn(Optional.of("국내산 냉장 삼겹살 구이용"));
        given(ingredientMasterRepository.findAll())
                .willReturn(masterList);

        // when
        BarcodeIngredientResponseDto response = inventoryService.getIngredientByBarcode(barcode);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getMasterIngredientId()).isEqualTo(4L);
        assertThat(response.getName()).isEqualTo("돼지고기 (삼겹살/목살)");
        assertThat(response.getCategoryId()).isEqualTo(2L);
        assertThat(response.getRecommendedUnit()).isEqualTo("g");
        assertThat(response.getRecommendedExpireDate()).isEqualTo(LocalDate.now().plusDays(3));
    }

    @Test
    @DisplayName("바코드 조회 실패: '08801045121086' (파채양념) -> 74종 마스터 미등록으로 404 INV_WARN_BARCODE_NOT_FOUND 예외 발생")
    void getIngredientByBarcode_pachae_throwsNotFound() {
        // given
        String barcode = "08801045121086";
        given(barcodeProductLookupService.lookupProductName(barcode))
                .willReturn(Optional.of("오늘밥상 바로 무쳐먹는 파채양념"));
        given(ingredientMasterRepository.findAll())
                .willReturn(masterList);

        // when & then
        assertThatThrownBy(() -> inventoryService.getIngredientByBarcode(barcode))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INV_WARN_BARCODE_NOT_FOUND);
    }

    @Test
    @DisplayName("바코드 조회 실패: 미등록 임의 바코드 -> 상품명 조회 불가로 404 INV_WARN_BARCODE_NOT_FOUND 예외 발생")
    void getIngredientByBarcode_unknownBarcode_throwsNotFound() {
        // given
        String barcode = "9999999999999";
        given(barcodeProductLookupService.lookupProductName(barcode))
                .willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> inventoryService.getIngredientByBarcode(barcode))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INV_WARN_BARCODE_NOT_FOUND);
    }

    @Test
    @DisplayName("영수증 OCR 스캔 성공: Gemini 파싱 항목을 표준 식재료로 매핑하여 리스트 반환")
    void scanReceiptOcr_success() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image", "receipt.jpg", "image/jpeg", "dummy receipt image bytes".getBytes()
        );

        List<GeminiReceiptItemDto> ocrItems = List.of(
                GeminiReceiptItemDto.builder()
                        .rawName("일판란 30구(특란)")
                        .matchedMasterName("계란")
                        .quantity(BigDecimal.valueOf(2))
                        .unit("개")
                        .build(),
                GeminiReceiptItemDto.builder()
                        .rawName("삼립 그릭슈바인 닭가")
                        .matchedMasterName("닭가슴살")
                        .quantity(BigDecimal.valueOf(1))
                        .unit("팩")
                        .build()
        );

        given(geminiOcrClient.scanReceipt(any(), anyString()))
                .willReturn(ocrItems);
        given(ingredientMasterRepository.findAll())
                .willReturn(masterList);

        // when
        List<OcrIngredientResponseDto> result = inventoryService.scanReceiptOcr(file);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("계란");
        assertThat(result.get(0).getQuantity()).isEqualByComparingTo("2");
        assertThat(result.get(0).getRecommendedExpireDate()).isEqualTo(LocalDate.now().plusDays(21));

        assertThat(result.get(1).getName()).isEqualTo("닭가슴살");
        assertThat(result.get(1).getQuantity()).isEqualByComparingTo("1");
        assertThat(result.get(1).getRecommendedExpireDate()).isEqualTo(LocalDate.now().plusDays(5));
    }

    @Test
    @DisplayName("영수증 OCR 스캔 안전 복구: 파일이 비어있는 경우 빈 배열 [] 반환")
    void scanReceiptOcr_emptyFile_returnsEmptyList() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "image", "empty.jpg", "image/jpeg", new byte[0]
        );

        List<OcrIngredientResponseDto> result = inventoryService.scanReceiptOcr(emptyFile);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("영수증 OCR 스캔 안전 복구: Gemini API 실패 또는 미인식 시 빈 배열 [] 반환 (500 에러 방지)")
    void scanReceiptOcr_geminiError_returnsEmptyList() {
        MockMultipartFile file = new MockMultipartFile(
                "image", "receipt.jpg", "image/jpeg", "image bytes".getBytes()
        );

        given(geminiOcrClient.scanReceipt(any(), anyString()))
                .willReturn(List.of());

        List<OcrIngredientResponseDto> result = inventoryService.scanReceiptOcr(file);

        assertThat(result).isEmpty();
    }

    // =========================================================================
    // 모듈 2 (내 재료 관리소) 핵심 CRUD 및 소비 차감 테스트
    // =========================================================================

    private final UUID TEST_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Test
    @DisplayName("표준 마스터 식재료 검색 조회: query 및 categoryId 필터링 정상 위임")
    void getMasterIngredients_success() {
        // given
        List<MasterIngredientResponseDto> mockList = List.of(
                MasterIngredientResponseDto.builder().masterIngredientId(3L).name("계란").categoryName("정육/계란").build()
        );
        given(ingredientMasterRepository.searchMasterIngredients("계란", 2L))
                .willReturn(mockList);

        // when
        List<MasterIngredientResponseDto> result = inventoryService.getMasterIngredients("계란", 2L);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("계란");
    }

    @Test
    @DisplayName("신규 식재료 등록: 독립 레코드 생성 및 소비기한 자동 계산 검증 (INV-01-2)")
    void addIngredient_independentRecord_success() {
        // given: 소비기한 및 단위 미입력 DTO -> 마스터 기본값(defaultUnit="개", defaultShelfDays=21) 적용
        IngredientCreateRequestDto dto = IngredientCreateRequestDto.builder()
                .masterIngredientId(3L) // 계란
                .storageType("REFRIGERATED")
                .quantity(new BigDecimal("10.00"))
                .memo("독립 레코드 테스트")
                .build();

        IngredientMaster eggMaster = IngredientMaster.builder()
                .masterIngredientId(3L)
                .categoryId(2L)
                .name("계란")
                .defaultUnit("개")
                .defaultShelfDays(21)
                .build();

        given(ingredientMasterRepository.findById(3L)).willReturn(Optional.of(eggMaster));

        // when
        IngredientCreateResponseDto response = inventoryService.addIngredient(TEST_USER_ID, dto);

        // then: 새 UserIngredient 객체로 insert 호출 검증 (수량 합산 UPDATE 없음)
        verify(userIngredientRepository).insert(any(UserIngredient.class));
        assertThat(response.getName()).isEqualTo("계란");
        assertThat(response.getMemo()).isEqualTo("독립 레코드 테스트");
    }

    @Test
    @DisplayName("신규 식재료 등록 실패: 마스터 미존재 시 404 예외 발생")
    void addIngredient_masterNotFound_throwsNotFound() {
        IngredientCreateRequestDto dto = IngredientCreateRequestDto.builder()
                .masterIngredientId(999L)
                .storageType("REFRIGERATED")
                .quantity(new BigDecimal("1.00"))
                .build();

        given(ingredientMasterRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.addIngredient(TEST_USER_ID, dto))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COMMON_ALERT_RESOURCE_NOT_FOUND);
    }

    @Test
    @DisplayName("내 냉장고 식재료 목록 조회: DTO 매핑 및 기본 상태 ACTIVE 적용 검증")
    void getMyIngredients_success() {
        // given
        UserIngredient entity = UserIngredient.builder()
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
                .status("ACTIVE")
                .build();

        given(userIngredientRepository.findAllByUserIdAndFilter(TEST_USER_ID, "계란", 2L, "REFRIGERATED", "ACTIVE"))
                .willReturn(List.of(entity));

        // when
        List<IngredientResponseDto> result = inventoryService.getMyIngredients(
                TEST_USER_ID, "계란", 2L, "REFRIGERATED", null);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getIngredientId()).isEqualTo(101L);
        assertThat(result.get(0).getDDay()).isEqualTo(5);
        assertThat(result.get(0).getName()).isEqualTo("계란");
    }

    @Test
    @DisplayName("식재료 개별 정보 수정: 본인 소유 정상 수정 검증")
    void updateIngredient_success() {
        // given
        UserIngredient existing = UserIngredient.builder()
                .ingredientId(101L)
                .userId(TEST_USER_ID)
                .name("계란")
                .storageType("REFRIGERATED")
                .quantity(new BigDecimal("10.00"))
                .unit("개")
                .status("ACTIVE")
                .build();

        given(userIngredientRepository.findByIdAndUserId(101L, TEST_USER_ID))
                .willReturn(Optional.of(existing));

        IngredientUpdateRequestDto dto = IngredientUpdateRequestDto.builder()
                .storageType("FROZEN")
                .quantity(new BigDecimal("8.00"))
                .unit("개")
                .expireDate(LocalDate.now().plusDays(30))
                .memo("냉동 보관")
                .build();

        // when
        IngredientUpdateResponseDto response = inventoryService.updateIngredient(TEST_USER_ID, 101L, dto);

        // then
        verify(userIngredientRepository).update(any(UserIngredient.class));
        assertThat(response.getIngredientId()).isEqualTo(101L);
        assertThat(response.getQuantity()).isEqualByComparingTo(new BigDecimal("8.00"));
        assertThat(response.getMemo()).isEqualTo("냉동 보관");
    }

    @Test
    @DisplayName("식재료 개별 정보 수정 실패: 타인 소유 또는 미존재 시 404 (INV_WARN_NOT_FOUND) 예외 발생")
    void updateIngredient_notOwner_throwsNotFound() {
        given(userIngredientRepository.findByIdAndUserId(999L, TEST_USER_ID))
                .willReturn(Optional.empty());

        IngredientUpdateRequestDto dto = IngredientUpdateRequestDto.builder()
                .storageType("REFRIGERATED")
                .quantity(BigDecimal.ONE)
                .build();

        assertThatThrownBy(() -> inventoryService.updateIngredient(TEST_USER_ID, 999L, dto))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INV_WARN_NOT_FOUND);
    }

    @Test
    @DisplayName("식재료 소프트 삭제: 본인 소유 정상 소프트 삭제 검증")
    void deleteIngredient_success() {
        UserIngredient existing = UserIngredient.builder()
                .ingredientId(101L)
                .userId(TEST_USER_ID)
                .status("ACTIVE")
                .build();

        given(userIngredientRepository.findByIdAndUserId(101L, TEST_USER_ID))
                .willReturn(Optional.of(existing));

        inventoryService.deleteIngredient(TEST_USER_ID, 101L);

        verify(userIngredientRepository).softDelete(101L, TEST_USER_ID);
    }

    @Test
    @DisplayName("식재료 소프트 삭제 실패: 타인 소유 또는 미존재 시 404 예외 발생")
    void deleteIngredient_notOwner_throwsNotFound() {
        given(userIngredientRepository.findByIdAndUserId(999L, TEST_USER_ID))
                .willReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.deleteIngredient(TEST_USER_ID, 999L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INV_WARN_NOT_FOUND);
    }

    @Test
    @DisplayName("수동 소비 처리: 부분 소비 시 잔여 수량 차감 및 ACTIVE 상태 유지 검증")
    void consumeIngredient_partialConsume_success() {
        // given: 10개 중 3개 소비 -> 잔여 7개, ACTIVE 유지
        UserIngredient existing = UserIngredient.builder()
                .ingredientId(101L)
                .userId(TEST_USER_ID)
                .quantity(new BigDecimal("10.00"))
                .status("ACTIVE")
                .build();

        given(userIngredientRepository.findByIdAndUserId(101L, TEST_USER_ID))
                .willReturn(Optional.of(existing));

        IngredientConsumeRequestDto dto = IngredientConsumeRequestDto.builder()
                .consumeQuantity(new BigDecimal("3.00"))
                .build();

        // when
        IngredientConsumeResponseDto response = inventoryService.consumeIngredient(TEST_USER_ID, 101L, dto);

        // then
        verify(userIngredientRepository).updateQuantityAndStatus(
                101L, TEST_USER_ID, new BigDecimal("7.00"), "ACTIVE");
        assertThat(response.getRemainingQuantity()).isEqualByComparingTo(new BigDecimal("7.00"));
        assertThat(response.getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("수동 소비 처리: 보유량 초과 소비 시 Math.max 방어 로직으로 0 고정 및 CONSUMED 자동 전이 (INV-01-2)")
    void consumeIngredient_fullConsume_defensiveClamping_success() {
        // given: 5개 보유 중 8개 소비 요청 -> 방어 로직으로 0으로 클램핑, CONSUMED 전이
        UserIngredient existing = UserIngredient.builder()
                .ingredientId(101L)
                .userId(TEST_USER_ID)
                .quantity(new BigDecimal("5.00"))
                .status("ACTIVE")
                .build();

        given(userIngredientRepository.findByIdAndUserId(101L, TEST_USER_ID))
                .willReturn(Optional.of(existing));

        IngredientConsumeRequestDto dto = IngredientConsumeRequestDto.builder()
                .consumeQuantity(new BigDecimal("8.00"))
                .build();

        // when
        IngredientConsumeResponseDto response = inventoryService.consumeIngredient(TEST_USER_ID, 101L, dto);

        // then
        verify(userIngredientRepository).updateQuantityAndStatus(
                101L, TEST_USER_ID, BigDecimal.ZERO, "CONSUMED");
        assertThat(response.getRemainingQuantity()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getStatus()).isEqualTo("CONSUMED");
    }

    @Test
    @DisplayName("수동 소비 처리: 소비 수량 미입력 시 전량 소비 간주 (잔여 0, CONSUMED 전이)")
    void consumeIngredient_nullConsumeQty_consumesAll() {
        UserIngredient existing = UserIngredient.builder()
                .ingredientId(101L)
                .userId(TEST_USER_ID)
                .quantity(new BigDecimal("5.00"))
                .status("ACTIVE")
                .build();

        given(userIngredientRepository.findByIdAndUserId(101L, TEST_USER_ID))
                .willReturn(Optional.of(existing));

        IngredientConsumeResponseDto response = inventoryService.consumeIngredient(TEST_USER_ID, 101L, null);

        verify(userIngredientRepository).updateQuantityAndStatus(
                101L, TEST_USER_ID, BigDecimal.ZERO, "CONSUMED");
        assertThat(response.getRemainingQuantity()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getStatus()).isEqualTo("CONSUMED");
    }

    @Test
    @DisplayName("수동 소비 처리 실패: 타인 소유 또는 미존재 시 404 (INV_WARN_NOT_FOUND) 예외 발생")
    void consumeIngredient_notOwner_throwsNotFound() {
        given(userIngredientRepository.findByIdAndUserId(999L, TEST_USER_ID))
                .willReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.consumeIngredient(TEST_USER_ID, 999L, null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INV_WARN_NOT_FOUND);
    }
}
