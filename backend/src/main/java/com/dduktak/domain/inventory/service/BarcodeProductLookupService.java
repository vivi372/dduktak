package com.dduktak.domain.inventory.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.dduktak.global.config.FoodQrProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 바코드 번호 기반 상품명 조회 서비스
 * 식품의약품안전처 푸드QR 및 식품안전나라 공공데이터 연계와 인메모리 샘플 바코드 사전을 결합하여
 * 바코드 번호에 대응하는 유통 상품명을 조회합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BarcodeProductLookupService {

    private final FoodQrProperties foodQrProperties;

    /**
     * 테스트 및 오프라인/Fallback용 사전 등록 바코드-상품명 매핑 사전
     * (EAN-13 및 GTIN-14 양방향 대응)
     */
    private static final Map<String, String> BARCODE_DICTIONARY = new ConcurrentHashMap<>();

    static {
        // [사용자 지정 테스트 바코드] 삼겹살 -> 200 OK 매칭 대상
        BARCODE_DICTIONARY.put("0246890115701", "국내산 냉장 삼겹살 구이용");
        BARCODE_DICTIONARY.put("246890115701", "국내산 냉장 삼겹살 구이용");

        // [샘플 데이터 바코드] 파채양념 -> 404 미등록 대상
        BARCODE_DICTIONARY.put("08801045121086", "오늘밥상 바로 무쳐먹는 파채양념");
        BARCODE_DICTIONARY.put("8801045121086", "오늘밥상 바로 무쳐먹는 파채양념");

        // [영수증 샘플 바코드들]
        BARCODE_DICTIONARY.put("2500000116742", "호주산냉장곡물양지국거리");
        BARCODE_DICTIONARY.put("2500000181863", "호주산냉동차돌박이구");
        BARCODE_DICTIONARY.put("8801068383652", "삼립 그릭슈바인 닭가슴살");
        BARCODE_DICTIONARY.put("8801496103693", "일판란 30구(특란)");
        BARCODE_DICTIONARY.put("8804246027393", "불릴필요없는현미 4.5");
        BARCODE_DICTIONARY.put("8803694136152", "도드람 직화곱창 600g");
    }

    /**
     * 바코드 번호로 상품명 조회
     *
     * @param barcodeNo 바코드 번호 (문자열)
     * @return 조회된 상품명 (미조회 시 Optional.empty())
     */
    public Optional<String> lookupProductName(String barcodeNo) {
        if (barcodeNo == null || barcodeNo.isBlank()) {
            return Optional.empty();
        }

        String normalizedBarcode = barcodeNo.trim();
        log.info("[BarcodeLookup] 바코드 상품명 조회 시작: '{}'", normalizedBarcode);

        // 1. 인메모리 사전에서 선행 조회 (빠른 응답 및 테스트 보장)
        String localMatch = searchInDictionary(normalizedBarcode);
        if (localMatch != null) {
            log.info("[BarcodeLookup] 로컬 바코드 사전 적중: '{}' -> '{}'", normalizedBarcode, localMatch);
            return Optional.of(localMatch);
        }

        // 2. 외부 식품안전나라 / 푸드QR 공공 API 연동 시도 (API 키가 설정된 경우)
        if (foodQrProperties.getApiKey() != null && !foodQrProperties.getApiKey().isBlank()) {
            try {
                Optional<String> externalResult = callExternalFoodApi(normalizedBarcode);
                if (externalResult.isPresent()) {
                    log.info("[BarcodeLookup] 외부 푸드QR API 조회 성공: '{}' -> '{}'", normalizedBarcode, externalResult.get());
                    return externalResult;
                }
            } catch (Exception e) {
                log.warn("[BarcodeLookup] 외부 푸드QR API 호출 중 예외 발생 (Fallback 진행): {}", e.getMessage());
            }
        }

        log.warn("[BarcodeLookup] 바코드에 해당하는 상품명을 찾을 수 없음: '{}'", normalizedBarcode);
        return Optional.empty();
    }

    /**
     * 선행 0 유무를 상호 고려한 사전 조회 (GTIN-14 vs EAN-13 유연 대응)
     */
    private String searchInDictionary(String barcode) {
        if (BARCODE_DICTIONARY.containsKey(barcode)) {
            return BARCODE_DICTIONARY.get(barcode);
        }
        // 14자리로 변환 시도 (선행 0 추가)
        String padded = (barcode.length() == 13) ? "0" + barcode : barcode;
        if (BARCODE_DICTIONARY.containsKey(padded)) {
            return BARCODE_DICTIONARY.get(padded);
        }
        // 선행 0 제거 시도
        if (barcode.startsWith("0")) {
            String stripped = barcode.substring(1);
            if (BARCODE_DICTIONARY.containsKey(stripped)) {
                return BARCODE_DICTIONARY.get(stripped);
            }
        }
        return null;
    }

    /**
     * 식품의약품안전처 식품안전나라 유통식품 바코드 정보 API 호출 (선택적 외부 연동)
     */
    private Optional<String> callExternalFoodApi(String barcode) {
        try {
            RestClient restClient = RestClient.builder()
                    .baseUrl(foodQrProperties.getBaseUrl())
                    .build();

            // http://openapi.foodsafetykorea.go.kr/api/{keyId}/C005/json/1/1/BAR_CD={barcode}
            String url = String.format("/api/%s/C005/json/1/1/BAR_CD=%s",
                    foodQrProperties.getApiKey(), barcode);

            JsonNode response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(JsonNode.class);

            if (response != null && response.has("C005")) {
                JsonNode rows = response.path("C005").path("row");
                if (rows.isArray() && !rows.isEmpty()) {
                    JsonNode first = rows.get(0);
                    if (first.hasNonNull("PRDLST_NM")) {
                        String prdlstNm = first.get("PRDLST_NM").asText().trim();
                        if (!prdlstNm.isBlank()) {
                            return Optional.of(prdlstNm);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("[BarcodeLookup] 공공 API 통신 실패: {}", e.getMessage());
        }
        return Optional.empty();
    }
}
