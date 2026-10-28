package com.dduktak.domain.inventory.service;

import com.dduktak.global.config.FoodQrProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class BarcodeProductLookupServiceTest {

    private BarcodeProductLookupService barcodeService;

    @BeforeEach
    void setUp() {
        FoodQrProperties properties = new FoodQrProperties();
        properties.setBaseUrl("https://foodqr.kr");
        // 실제 발급받은 accessKey
        properties.setApiKey("AAABoVmTXN25gJhM/S6vtuSeH6BYHVbaKM4yxA==");

        barcodeService = new BarcodeProductLookupService(properties);
    }

    @Test
    @DisplayName("식약처 푸드QR 실제 API 호출 테스트 - 08801045121086 (파채양념) 조회 성공")
    void lookup_realApi_success() {
        // Given
        String barcode = "08801045121086";

        // When
        Optional<String> result = barcodeService.lookupProductName(barcode);

        // Then
        assertThat(result).isPresent();
        System.out.println("조회된 상품명: " + result.get());
        assertThat(result.get()).contains("파채양념");
    }

    @Test
    @DisplayName("식약처 푸드QR 실제 API 호출 테스트 - 8801448129337 (미등록 바코드) 조회 시 빈 값 반환")
    void lookup_realApi_notFoundBarcode() {
        // Given
        String barcode = "8801448129337";

        // When
        Optional<String> result = barcodeService.lookupProductName(barcode);

        // Then
        System.out.println("조회 결과(8801448129337): " + result);
        assertThat(result).isEmpty();
    }
}

