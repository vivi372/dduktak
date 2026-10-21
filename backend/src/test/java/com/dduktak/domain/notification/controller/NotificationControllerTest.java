package com.dduktak.domain.notification.controller;

import com.dduktak.domain.notification.dto.NotificationDeleteAllResponseDto;
import com.dduktak.domain.notification.dto.NotificationItemDto;
import com.dduktak.domain.notification.dto.NotificationListResponseDto;
import com.dduktak.domain.notification.dto.NotificationReadAllResponseDto;
import com.dduktak.domain.notification.dto.NotificationReadResponseDto;
import com.dduktak.domain.notification.dto.NotificationSettingsRequestDto;
import com.dduktak.domain.notification.dto.NotificationSettingsResponseDto;
import com.dduktak.domain.notification.entity.NotificationType;
import com.dduktak.domain.notification.service.NotificationService;
import com.dduktak.global.error.GlobalExceptionHandler;
import com.dduktak.global.filter.TraceIdFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("[슬라이스 테스트] NotificationController API 명세 검증")
class NotificationControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

    private final UUID TEST_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper);

        mockMvc = MockMvcBuilders.standaloneSetup(notificationController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(new TraceIdFilter())
                .setMessageConverters(converter)
                .build();

        Authentication auth = new UsernamePasswordAuthenticationToken(TEST_USER_ID.toString(), null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /api/v1/notifications - 알림 목록 및 미읽음 뱃지 조회 성공 (200 OK)")
    void getNotificationsSuccess() throws Exception {
        NotificationItemDto item = NotificationItemDto.builder()
                .notificationId(1L)
                .type(NotificationType.EXPIRE_WARN)
                .title("소비기한 임박")
                .content("계란의 소비기한이 2일 남았습니다.")
                .targetId(10L)
                .isRead(false)
                .createdAt(OffsetDateTime.now())
                .build();

        NotificationListResponseDto responseDto = NotificationListResponseDto.builder()
                .unreadCount(2)
                .hasUnread(true)
                .notifications(Collections.singletonList(item))
                .build();

        given(notificationService.getNotificationList(eq(TEST_USER_ID), eq(0), eq(20)))
                .willReturn(responseDto);

        mockMvc.perform(get("/api/v1/notifications")
                        .param("page", "0")
                        .param("size", "20")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.unreadCount").value(2))
                .andExpect(jsonPath("$.data.hasUnread").value(true))
                .andExpect(jsonPath("$.data.notifications[0].notificationId").value(1))
                .andExpect(jsonPath("$.data.notifications[0].type").value("EXPIRE_WARN"))
                .andExpect(jsonPath("$.data.notifications[0].targetId").value(10));
    }

    @Test
    @DisplayName("PATCH /api/v1/notifications/{notificationId}/read - 단일 알림 읽음 처리 성공 (200 OK)")
    void markAsReadSuccess() throws Exception {
        NotificationReadResponseDto responseDto = NotificationReadResponseDto.builder()
                .notificationId(1L)
                .isRead(true)
                .build();

        given(notificationService.markAsRead(eq(TEST_USER_ID), eq(1L)))
                .willReturn(responseDto);

        mockMvc.perform(patch("/api/v1/notifications/1/read")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.notificationId").value(1))
                .andExpect(jsonPath("$.data.isRead").value(true));
    }

    @Test
    @DisplayName("PATCH /api/v1/notifications/read-all - 모든 알림 일괄 읽음 처리 성공 (200 OK)")
    void markAllAsReadSuccess() throws Exception {
        NotificationReadAllResponseDto responseDto = NotificationReadAllResponseDto.builder()
                .updatedCount(5)
                .build();

        given(notificationService.markAllAsRead(eq(TEST_USER_ID)))
                .willReturn(responseDto);

        mockMvc.perform(patch("/api/v1/notifications/read-all")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.updatedCount").value(5));
    }

    @Test
    @DisplayName("DELETE /api/v1/notifications/{notificationId} - 단일 알림 수동 삭제 성공 (200 OK)")
    void deleteNotificationSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/notifications/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("DELETE /api/v1/notifications/all - 모든 알림 일괄 삭제 성공 (200 OK)")
    void deleteAllNotificationsSuccess() throws Exception {
        NotificationDeleteAllResponseDto responseDto = NotificationDeleteAllResponseDto.builder()
                .deletedCount(10)
                .build();

        given(notificationService.deleteAllNotifications(eq(TEST_USER_ID)))
                .willReturn(responseDto);

        mockMvc.perform(delete("/api/v1/notifications/all")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.deletedCount").value(10));
    }

    @Test
    @DisplayName("PATCH /api/v1/notifications/settings - 알림 통합 설정 성공 (200 OK)")
    void updateSettingsSuccess() throws Exception {
        NotificationSettingsRequestDto requestDto = NotificationSettingsRequestDto.builder()
                .isExpireWarnEnabled(true)
                .isReactionNoticeEnabled(false)
                .quietTimeStart(LocalTime.of(22, 0, 0))
                .quietTimeEnd(LocalTime.of(7, 0, 0))
                .build();

        NotificationSettingsResponseDto responseDto = NotificationSettingsResponseDto.builder()
                .isExpireWarnEnabled(true)
                .isReactionNoticeEnabled(false)
                .quietTimeStart(LocalTime.of(22, 0, 0))
                .quietTimeEnd(LocalTime.of(7, 0, 0))
                .build();

        given(notificationService.updateSettings(eq(TEST_USER_ID), any(NotificationSettingsRequestDto.class)))
                .willReturn(responseDto);

        mockMvc.perform(patch("/api/v1/notifications/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isExpireWarnEnabled").value(true))
                .andExpect(jsonPath("$.data.isReactionNoticeEnabled").value(false))
                .andExpect(jsonPath("$.data.quietTimeStart").value("22:00:00"))
                .andExpect(jsonPath("$.data.quietTimeEnd").value("07:00:00"));
    }
}
