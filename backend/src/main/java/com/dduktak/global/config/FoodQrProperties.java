package com.dduktak.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 식품의약품안전처 푸드QR 및 식품안전나라 연계 설정 프로퍼티
 * application.yml의 'food-qr' 프리픽스 설정을 바인딩합니다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "food-qr")
public class FoodQrProperties {

    /**
     * 식품안전나라 / 푸드QR 공공 API 인증 키
     */
    private String apiKey;

    /**
     * 기본 연동 베이스 URL (식약처 푸드QR 공식 도메인)
     */
    private String baseUrl = "https://foodqr.kr";
}
