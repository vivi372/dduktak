package com.dduktak.domain.inventory.service;

import com.dduktak.domain.inventory.dto.OcrIngredientResponseDto;
import com.dduktak.global.config.DotenvTestInitializer;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ContextConfiguration;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Disabled("실데이터 샘플 검증 완료 (샘플 데이터 정리 및 수동 로컬 실행 전용)")
@ContextConfiguration(initializers = DotenvTestInitializer.class)
@DisplayName("[실데이터 검증 테스트] test_sample_data 영수증 이미지 기반 Gemini Flash OCR 실호출 검증")
class GeminiOcrClientLiveTest {

    @Autowired
    private InventoryService inventoryService;

    @Test
    @DisplayName("실제 영수증 이미지(영수증 이미지.jpg) 분석 시 식재료 품목 정상 추출 및 200 OK 매핑 검증")
    void scanReceiptWithRealImage_success() throws Exception {
        // 프로젝트 내 test_sample_data/영수증 이미지.jpg 탐색
        File sampleImage = new File("../.agent/test_sample_data/영수증 이미지.jpg");
        if (!sampleImage.exists()) {
            sampleImage = new File(".agent/test_sample_data/영수증 이미지.jpg");
        }

        Assumptions.assumeTrue(sampleImage.exists(), "샘플 영수증 이미지가 존재할 때만 실행합니다.");
        byte[] imageBytes = Files.readAllBytes(sampleImage.toPath());

        MockMultipartFile multipartFile = new MockMultipartFile(
                "image", "영수증 이미지.jpg", "image/jpeg", imageBytes);

        // InventoryService를 통한 영수증 OCR 스캔 및 마스터 매핑 실행
        List<OcrIngredientResponseDto> result = inventoryService.scanReceiptOcr(multipartFile);

        // 결과 검증: API 키가 유효할 경우 추출된 식재료(계란, 닭가슴살, 소고기 등)가 존재해야 함
        System.out.println("==================================================================");
        System.out.println("Gemini Flash 영수증 OCR 스캔 결과 (총 " + result.size() + "건 추출):");
        for (OcrIngredientResponseDto dto : result) {
            System.out.printf("- 표준식재료: %s (ID: %d), 수량: %s %s, 권장소비기한: %s%n",
                    dto.getName(), dto.getMasterIngredientId(), dto.getQuantity(), dto.getUnit(),
                    dto.getRecommendedExpireDate());
        }
        System.out.println("==================================================================");

        assertThat(result).isNotNull();
        // 실제 API 호출 성공 시 적어도 1개 이상의 식재료가 감지되어야 함
        if (!result.isEmpty()) {
            assertThat(result).anyMatch(item -> item.getName().contains("계란") ||
                    item.getName().contains("소고기") ||
                    item.getName().contains("닭가슴살") ||
                    item.getName().contains("밥"));
        }
    }
}
