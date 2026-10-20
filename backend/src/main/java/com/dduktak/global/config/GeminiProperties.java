package com.dduktak.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Google AI Studio Gemini API 설정 프로퍼티
 * application.yml의 'gemini' 프리픽스 설정을 바인딩합니다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "gemini")
public class GeminiProperties {

    /**
     * Google AI Studio Gemini API Key
     */
    private String apiKey;

    /**
     * 사용할 Gemini 모델 (기본값: gemini-1.5-flash)
     */
    private String model = "gemini-flash-latest";

    /**
     * Google AI Studio Gemini API 기본 엔드포인트 URL
     */
    private String baseUrl = "https://generativelanguage.googleapis.com";
}
