package com.dduktak.global.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 초경량 핑(Ping) 엔드포인트 단위/슬라이스 테스트
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("[단위/슬라이스 테스트] PingController 초경량 헬스체크 규격 검증")
class PingControllerTest {

    private MockMvc mockMvc;

    @InjectMocks
    private PingController pingController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(pingController).build();
    }

    @Test
    @DisplayName("GET /api/v1/ping 호출 시 200 OK 및 'pong' 문자열(4 Bytes)을 반환한다")
    void ping_returnsPong() throws Exception {
        mockMvc.perform(get("/api/v1/ping"))
                .andExpect(status().isOk())
                .andExpect(content().string("pong"));
    }
}

