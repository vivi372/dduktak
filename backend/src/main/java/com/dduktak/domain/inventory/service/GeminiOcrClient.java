package com.dduktak.domain.inventory.service;

import com.dduktak.domain.inventory.dto.GeminiReceiptItemDto;
import com.dduktak.global.config.GeminiProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;

/**
 * Google AI Studio Gemini Flash REST API 통신 클라이언트
 * 영수증 이미지를 Gemini Flash 모델로 전달하여 식재료 품목 JSON 배열을 추출합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiOcrClient {

    private final GeminiProperties geminiProperties;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT = """
            당신은 한국 마트 영수증에서 구매한 식재료 품목을 정밀하게 추출하는 전문가입니다.
            첨부된 영수증 이미지에서 식품/식재료 품목만을 감지하여 JSON 배열로 반환하세요.
            공산품, 잡화, 종량제 봉투, 할인 내역 등은 제외하세요.
            
            반드시 아래 JSON 스키마 규격의 배열([]) 형태로만 출력해야 합니다:
            [
              {
                "rawName": "영수증 원문 품목명 (예: 일판란 30구(특란), 호주산냉장곡물양지국거리)",
                "matchedMasterName": "가장 적절한 한국 표준 식재료명 (예: 계란, 소고기 (국거리/불고기용), 돼지고기 (삼겹살/목살), 닭가슴살 등)",
                "quantity": 구매수량(숫자, 기본값 1.0),
                "unit": "단위(개, g, ml, 팩, 봉, 모 등, 없으면 개)"
              }
            ]
            """;

    /**
     * 영수증 이미지를 Gemini Flash API로 분석하여 식재료 품목 목록 추출
     *
     * @param imageBytes 이미지 바이트 배열
     * @param mimeType   이미지 MIME 타입 (예: image/jpeg, image/png)
     * @return 파싱된 식재료 품목 목록 (실패/미인식 시 안전하게 빈 리스트 반환)
     */
    public List<GeminiReceiptItemDto> scanReceipt(byte[] imageBytes, String mimeType) {
        if (imageBytes == null || imageBytes.length == 0) {
            log.warn("[GeminiOcrClient] 전송된 영수증 이미지 바이트가 비어 있습니다.");
            return Collections.emptyList();
        }

        String apiKey = geminiProperties.getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[GeminiOcrClient] GEMINI_API_KEY 환경변수가 설정되지 않아 영수증 인식을 건너뜁니다.");
            return Collections.emptyList();
        }

        String resolvedMimeType = (mimeType != null && !mimeType.isBlank()) ? mimeType : MediaType.IMAGE_JPEG_VALUE;
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        try {
            log.info("[GeminiOcrClient] Gemini Flash API 호출 시작 (모델: {}, 이미지 크기: {} bytes)",
                    geminiProperties.getModel(), imageBytes.length);

            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(Duration.ofSeconds(10));
            requestFactory.setReadTimeout(Duration.ofSeconds(60));

            RestClient restClient = RestClient.builder()
                    .requestFactory(requestFactory)
                    .baseUrl(geminiProperties.getBaseUrl())
                    .build();

            // Google AI Studio REST API 페이로드 구성 (camelCase 표준 스키마 준수)
            Map<String, Object> textPart = Map.of("text", SYSTEM_PROMPT);
            Map<String, Object> inlineData = Map.of(
                    "mimeType", resolvedMimeType,
                    "data", base64Image
            );
            Map<String, Object> imagePart = Map.of("inlineData", inlineData);

            Map<String, Object> contentObj = Map.of(
                    "parts", List.of(textPart, imagePart)
            );

            Map<String, Object> generationConfig = Map.of(
                    "responseMimeType", "application/json"
            );

            Map<String, Object> requestPayload = Map.of(
                    "contents", List.of(contentObj),
                    "generationConfig", generationConfig
            );

            List<String> targetModels = new ArrayList<>();
            String primaryModel = geminiProperties.getModel();
            targetModels.add(primaryModel);
            if (!"gemini-3.1-flash-lite".equalsIgnoreCase(primaryModel)) {
                targetModels.add("gemini-3.1-flash-lite");
            }

            String rawResponse = null;
            for (String currentModel : targetModels) {
                String uri = String.format("/v1beta/models/%s:generateContent?key=%s",
                        currentModel, apiKey);
                try {
                    log.info("[GeminiOcrClient] Gemini API 호출 시도 (모델: {})", currentModel);
                    rawResponse = restClient.post()
                            .uri(uri)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(requestPayload)
                            .retrieve()
                            .body(String.class);

                    if (rawResponse != null && !rawResponse.isBlank()) {
                        log.info("[GeminiOcrClient] Gemini 모델 '{}' 분석 응답 성공", currentModel);
                        break;
                    }
                } catch (Exception ex) {
                    log.warn("[GeminiOcrClient] Gemini 모델 '{}' 호출 실패: {}. 다음 모델로 폴백 시도합니다.",
                            currentModel, ex.getMessage());
                }
            }

            if (rawResponse == null || rawResponse.isBlank()) {
                log.warn("[GeminiOcrClient] Gemini API 응답 본문이 비어 있습니다.");
                return Collections.emptyList();
            }

            log.info("[GeminiOcrClient] Gemini API 원문 수신 완료: {}", rawResponse);
            return parseGeminiResponse(rawResponse);

        } catch (Exception e) {
            log.error("[GeminiOcrClient] Gemini Flash OCR 처리 중 예외 발생 (안전한 빈 리스트 반환): {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Gemini generateContent 응답 JSON에서 품목 배열 파싱
     */
    private List<GeminiReceiptItemDto> parseGeminiResponse(String rawResponse) {
        try {
            JsonNode rootNode = objectMapper.readTree(rawResponse);
            JsonNode candidates = rootNode.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                log.warn("[GeminiOcrClient] Gemini 응답에 candidates 배열이 없습니다.");
                return Collections.emptyList();
            }

            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (!parts.isArray() || parts.isEmpty()) {
                log.warn("[GeminiOcrClient] Gemini 응답 candidates[0]에 parts가 없습니다.");
                return Collections.emptyList();
            }

            String jsonText = parts.get(0).path("text").asText();
            if (jsonText == null || jsonText.isBlank()) {
                return Collections.emptyList();
            }

            log.info("[GeminiOcrClient] Gemini 파싱 원문 JSON: {}", jsonText);
            return objectMapper.readValue(jsonText, new TypeReference<List<GeminiReceiptItemDto>>() {});

        } catch (Exception e) {
            log.warn("[GeminiOcrClient] Gemini 응답 JSON 파싱 실패: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
