package com.dduktak.global.config;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

/**
 * 테스트 환경에서 프로젝트 루트의 .env 파일을 읽어 JVM System Property로 주입하는 초기화 클래스.
 * IDE(IntelliJ 등)에서 개별 테스트 단독 실행 시에도 로컬 환경변수를 안전하게 주입받도록 지원합니다.
 */
public class DotenvTestInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        // 프로젝트 루트 디렉터리의 .env 파일 탐색 (backend 하위 실행 또는 루트 실행 대응)
        File envFile = new File("../.env");
        if (!envFile.exists()) {
            envFile = new File(".env");
        }

        if (envFile.exists()) {
            try {
                List<String> lines = Files.readAllLines(envFile.toPath());
                for (String line : lines) {
                    String trimmed = line.trim();
                    // 주석 및 빈 줄 무시, KEY=VALUE 형식 파싱
                    if (!trimmed.isEmpty() && !trimmed.startsWith("#") && trimmed.contains("=")) {
                        String[] parts = trimmed.split("=", 2);
                        String key = parts[0].trim();
                        String val = parts[1].trim();
                        // 기존 시스템 프로퍼티 또는 OS 환경변수에 없을 경우에만 주입
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            System.setProperty(key, val);
                        }
                    }
                }
            } catch (Exception ignored) {
                // 테스트 초기화 중 .env 파싱 오류 발생 시 기본값으로 폴백
            }
        }
    }
}
