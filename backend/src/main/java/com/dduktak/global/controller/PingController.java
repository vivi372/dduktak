package com.dduktak.global.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 서버 생존 확인 및 절전 모드 방지용 초경량 핑(Ping) REST 컨트롤러
 * 데이터베이스 커넥션 소모 없이 최소한의 응답("pong", 4 bytes)을 반환하여
 * 외부 헬스체크 스케줄러(cron-job.org 등)의 다운로드 용량 제한 초과를 원천 차단합니다.
 */
@RestController
public class PingController {

    /**
     * 초경량 핑/퐁 헬스체크 엔드포인트
     *
     * @return "pong" (4 바이트 플레인 텍스트)
     */
    @GetMapping("/api/v1/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }
}

