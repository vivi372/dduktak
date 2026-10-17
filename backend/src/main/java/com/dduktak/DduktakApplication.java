package com.dduktak;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 오늘의 뚝딱 (Dduktak) 백엔드 메인 애플리케이션 진입점
 */
@EnableScheduling // 소비기한 D-Day 알림 배치 스케줄러 활성화
@SpringBootApplication
public class DduktakApplication {

    public static void main(String[] args) {
        SpringApplication.run(DduktakApplication.class, args);
    }
}
