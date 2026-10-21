package com.dduktak.global.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Firebase Admin SDK 설정 클래스
 * FCM(Firebase Cloud Messaging) 비동기 푸시 발송을 위한 FirebaseApp 초기화를 수행합니다.
 */
@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${fcm.credentials.path:backend/src/main/resources/firebase-service-account.json}")
    private String credentialsPath;

    @Value("${fcm.credentials.json:}")
    private String credentialsJson;

    @PostConstruct
    public void initializeFirebase() {
        if (!FirebaseApp.getApps().isEmpty()) {
            log.info("[FirebaseConfig] FirebaseApp이 이미 초기화되어 있습니다.");
            return;
        }

        try {
            InputStream serviceAccountStream = null;

            // 1. JSON 문자열 직접 주입 우선 확인
            if (credentialsJson != null && !credentialsJson.trim().isEmpty()) {
                log.info("[FirebaseConfig] 환경변수 JSON 문자열로부터 Firebase 인증 정보를 로드합니다.");
                serviceAccountStream = new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8));
            } else if (credentialsPath != null && !credentialsPath.trim().isEmpty()) {
                // 2. 파일 경로 지정 확인 (절대경로, 프로젝트 루트 상대경로, 클래스패스 순)
                File file = new File(credentialsPath.trim());
                if (file.exists()) {
                    log.info("[FirebaseConfig] 파일 시스템 경로로부터 Firebase 키를 로드합니다: {}", file.getAbsolutePath());
                    serviceAccountStream = new FileInputStream(file);
                } else {
                    // 클래스패스에서 탐색 시도
                    String cleanPath = credentialsPath.replace("backend/src/main/resources/", "")
                            .replace("src/main/resources/", "");
                    ClassPathResource resource = new ClassPathResource(cleanPath);
                    if (resource.exists()) {
                        log.info("[FirebaseConfig] 클래스패스로부터 Firebase 키를 로드합니다: {}", cleanPath);
                        serviceAccountStream = resource.getInputStream();
                    }
                }
            }

            if (serviceAccountStream == null) {
                log.warn("[FirebaseConfig] 유효한 Firebase 서비스 계정 키를 찾지 못했습니다. (FCM 푸시 기능은 모의 모드로 동작합니다)");
                return;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccountStream))
                    .build();

            FirebaseApp.initializeApp(options);
            log.info("[FirebaseConfig] FirebaseApp 초기화 성공: {}", FirebaseApp.getInstance().getName());
        } catch (Exception e) {
            log.warn("[FirebaseConfig] Firebase 초기화 중 오류가 발생했습니다. (FCM 푸시는 비활성화됩니다): {}", e.getMessage());
        }
    }

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        if (FirebaseApp.getApps().isEmpty()) {
            return null;
        }
        return FirebaseMessaging.getInstance();
    }
}
