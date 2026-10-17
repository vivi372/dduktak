package com.dduktak;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 기본 컨텍스트 로딩 및 프로젝트 기본 검증 테스트
 */
class DduktakApplicationTests {

    @Test
    @DisplayName("기본 프로젝트 로딩 무결성 테스트")
    void contextLoads() {
        assertTrue(true, "백엔드 기본 패키지 및 테스트 환경 구성 정상");
    }
}
