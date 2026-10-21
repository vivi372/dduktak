package com.dduktak.domain.home.controller;

import com.dduktak.domain.home.dto.HomeBriefingResponseDto;
import com.dduktak.domain.home.service.HomeService;
import com.dduktak.global.error.ApiResponseDto;
import com.dduktak.global.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * 메인 화면 브리핑 REST Controller (/api/v1/home)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/home")
@RequiredArgsConstructor
public class HomeController {

    private final HomeService homeService;

    /**
     * 메인 화면 종합 브리핑 위젯 조회
     * (임박 재료 수 집계, 상위 3개 목록, 최고 매칭 또는 인기 레시피)
     */
    @GetMapping("/briefing")
    public ResponseEntity<ApiResponseDto<HomeBriefingResponseDto>> getBriefing() {
        UUID userId = SecurityUtil.getCurrentUserId();
        HomeBriefingResponseDto response = homeService.getBriefing(userId);
        return ResponseEntity.ok(ApiResponseDto.success(response, "메인 화면 종합 브리핑 조회가 완료되었습니다."));
    }
}
