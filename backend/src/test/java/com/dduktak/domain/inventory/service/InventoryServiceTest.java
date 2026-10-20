package com.dduktak.domain.inventory.service;

import com.dduktak.domain.inventory.dto.BarcodeIngredientResponseDto;
import com.dduktak.domain.inventory.dto.GeminiReceiptItemDto;
import com.dduktak.domain.inventory.dto.OcrIngredientResponseDto;
import com.dduktak.domain.inventory.entity.IngredientMaster;
import com.dduktak.domain.inventory.repository.IngredientMasterRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("[단위 테스트] InventoryService 바코드 조회 및 영수증 OCR 비즈니스 로직 검증")
class InventoryServiceTest {

    @Mock
    private IngredientMasterRepository ingredientMasterRepository;

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
}
