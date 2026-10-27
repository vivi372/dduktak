package com.dduktak.domain.notification.service;

import com.dduktak.domain.auth.entity.Profile;
import com.dduktak.domain.auth.repository.ProfileRepository;
import com.dduktak.domain.notification.dto.ExpiringIngredientTargetVo;
import com.dduktak.domain.notification.dto.NotificationDeleteAllResponseDto;
import com.dduktak.domain.notification.dto.NotificationListResponseDto;
import com.dduktak.domain.notification.dto.NotificationReadAllResponseDto;
import com.dduktak.domain.notification.dto.NotificationReadResponseDto;
import com.dduktak.domain.notification.dto.NotificationSettingsRequestDto;
import com.dduktak.domain.notification.dto.NotificationSettingsResponseDto;
import com.dduktak.domain.notification.entity.Notification;
import com.dduktak.domain.notification.entity.NotificationType;
import com.dduktak.domain.notification.repository.NotificationRepository;
import com.dduktak.global.error.CustomException;
import com.dduktak.global.error.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService 단위 테스트 (모듈 5)")
class NotificationServiceTest {

        @Mock
        private NotificationRepository notificationRepository;

        @Mock
        private ProfileRepository profileRepository;

        @Mock
        private FcmService fcmService;

        @InjectMocks
        private NotificationService notificationService;

        @Nested
        @DisplayName("1. [TC-NOTI-01] 매일 09시 소비기한 임박 묶음 알림 배치 & 멱등성 검증")
        class ExpiringAlertBatchTest {

                @Test
                @DisplayName("임박 재료 1개인 경우 단일 문구 메시지 생성 및 발송")
                void singleExpiringIngredient() {
                        // given
                        UUID userId = UUID.randomUUID();
                        ExpiringIngredientTargetVo vo = ExpiringIngredientTargetVo.builder()
                                        .userId(userId)
                                        .ingredientId(101L)
                                        .ingredientName("우유")
                                        .dDay(3)
                                        .expireDate(LocalDate.now().plusDays(3))
                                        .isExpireWarnEnabled(true)
                                        .build();

                        given(notificationRepository.findExpiringIngredientsForAlert())
                                        .willReturn(Collections.singletonList(vo));
                        given(notificationRepository.existsExpireWarnToday(userId))
                                        .willReturn(false);

                        // when
                        int count = notificationService.processDailyExpiringAlerts();

                        // then
                        assertThat(count).isEqualTo(1);
                        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
                        verify(notificationRepository, times(1)).save(captor.capture());

                        Notification saved = captor.getValue();
                        assertThat(saved.getUserId()).isEqualTo(userId);
                        assertThat(saved.getType()).isEqualTo(NotificationType.EXPIRE_WARN);
                        assertThat(saved.getContent()).contains("🥛 [우유]의 소비기한이 3일 남았어요!");
                        assertThat(saved.getTargetId()).isEqualTo(101L);

                        verify(fcmService, times(1)).sendPushAsync(eq(userId), eq("소비기한 임박 안내"), eq(saved.getContent()),
                                        any());
                }

                @Test
                @DisplayName("임박 재료가 N개(우유, 계란, 치즈)일 경우 1건의 묶음 메시지로 통합 생성")
                void multipleExpiringIngredientsGrouping() {
                        // given
                        UUID userId = UUID.randomUUID();
                        ExpiringIngredientTargetVo vo1 = ExpiringIngredientTargetVo.builder()
                                        .userId(userId)
                                        .ingredientId(101L)
                                        .ingredientName("우유")
                                        .dDay(1)
                                        .expireDate(LocalDate.now().plusDays(1))
                                        .build();
                        ExpiringIngredientTargetVo vo2 = ExpiringIngredientTargetVo.builder()
                                        .userId(userId)
                                        .ingredientId(102L)
                                        .ingredientName("계란")
                                        .dDay(2)
                                        .expireDate(LocalDate.now().plusDays(2))
                                        .build();
                        ExpiringIngredientTargetVo vo3 = ExpiringIngredientTargetVo.builder()
                                        .userId(userId)
                                        .ingredientId(103L)
                                        .ingredientName("슬라이스 치즈")
                                        .dDay(3)
                                        .expireDate(LocalDate.now().plusDays(3))
                                        .build();

                        given(notificationRepository.findExpiringIngredientsForAlert())
                                        .willReturn(Arrays.asList(vo1, vo2, vo3));
                        given(notificationRepository.existsExpireWarnToday(userId))
                                        .willReturn(false);

                        // when
                        int count = notificationService.processDailyExpiringAlerts();

                        // then
                        assertThat(count).isEqualTo(1);
                        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
                        verify(notificationRepository, times(1)).save(captor.capture());

                        Notification saved = captor.getValue();
                        assertThat(saved.getContent()).contains("🥛 [우유] 외 2개 재료의 소비기한이 임박했어요!");
                        assertThat(saved.getTargetId()).isEqualTo(101L); // 대표 식재료 ID
                }

                @Test
                @DisplayName("당일 이미 EXPIRE_WARN 알림이 발송된 유저는 멱등성에 의해 중복 생성을 건너뜀")
                void idempotencySkipWhenAlreadySentToday() {
                        // given
                        UUID userId = UUID.randomUUID();
                        ExpiringIngredientTargetVo vo = ExpiringIngredientTargetVo.builder()
                                        .userId(userId)
                                        .ingredientId(101L)
                                        .ingredientName("우유")
                                        .dDay(2)
                                        .build();

                        given(notificationRepository.findExpiringIngredientsForAlert())
                                        .willReturn(Collections.singletonList(vo));
                        given(notificationRepository.existsExpireWarnToday(userId))
                                        .willReturn(true); // 오늘 이미 발송됨

                        // when
                        int count = notificationService.processDailyExpiringAlerts();

                        // then
                        assertThat(count).isEqualTo(0);
                        verify(notificationRepository, never()).save(any());
                        verify(fcmService, never()).sendPushAsync(any(), any(), any(), any());
                }
        }

        @Nested
        @DisplayName("2. [TC-NOTI-02] 소셜 반응 알림 연동 & 자추 스킵 검증")
        class SocialNotificationTest {

                @Test
                @DisplayName("자추(authorId == actorId) 발생 시 소셜 알림 생성을 전면 스킵")
                void selfActionSkipped() {
                        // given
                        UUID authorId = UUID.randomUUID();

                        // when
                        notificationService.sendSocialNotification(
                                        authorId, authorId, NotificationType.LIKE_NOTICE, 10L, "김치찌개", "본인닉네임");

                        // then
                        verify(profileRepository, never()).findById(any());
                        verify(notificationRepository, never()).save(any());
                        verify(fcmService, never()).sendPushAsync(any(), any(), any(), any());
                }

                @Test
                @DisplayName("타 유저의 반응 시 정상적으로 DB 알림 저장 및 FCM 발송")
                void otherUserActionSuccess() {
                        // given
                        UUID authorId = UUID.randomUUID();
                        UUID actorId = UUID.randomUUID();

                        Profile author = Profile.builder()
                                        .id(authorId)
                                        .isReactionNoticeEnabled(true)
                                        .quietTimeStart(LocalTime.of(21, 0))
                                        .quietTimeEnd(LocalTime.of(8, 0))
                                        .build();

                        given(profileRepository.findById(authorId)).willReturn(Optional.of(author));

                        // when
                        notificationService.sendSocialNotification(
                                        authorId, actorId, NotificationType.LIKE_NOTICE, 50L, "돼지고기 김치찌개", "뚝딱이");

                        // then
                        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
                        verify(notificationRepository, times(1)).save(captor.capture());

                        Notification saved = captor.getValue();
                        assertThat(saved.getUserId()).isEqualTo(authorId);
                        assertThat(saved.getType()).isEqualTo(NotificationType.LIKE_NOTICE);
                        assertThat(saved.getContent()).contains("❤️ 뚝딱이님이 회원님의 '돼지고기 김치찌개' 레시피를 좋아합니다.");
                        assertThat(saved.getTargetId()).isEqualTo(50L);
                }

                @Test
                @DisplayName("소셜 알림 푸시 거부(isReactionNoticeEnabled=false) 유저라도 인앱 알림은 DB에 정상 보관되고 FCM 푸시만 차단")
                void disabledSocialNoticeStillSavesInAppNotification() {
                        // given
                        UUID authorId = UUID.randomUUID();
                        UUID actorId = UUID.randomUUID();

                        Profile author = Profile.builder()
                                        .id(authorId)
                                        .isReactionNoticeEnabled(false) // 비활성화
                                        .build();

                        given(profileRepository.findById(authorId)).willReturn(Optional.of(author));

                        // when
                        notificationService.sendSocialNotification(
                                        authorId, actorId, NotificationType.COOKED_NOTICE, 30L, "계란볶음밥", "요리왕");

                        // then: 인앱 알림은 DB에 정상 저장되고, FCM 푸시만 스킵
                        verify(notificationRepository, times(1)).save(any(Notification.class));
                        verify(fcmService, never()).sendPushAsync(any(), any(), any(), any());
                }

                @Test
                @DisplayName("야간 방해금지 시간대 판정 유틸리티 검증 (21:00 ~ 08:00)")
                void quietTimeCheck() {
                        LocalTime start = LocalTime.of(21, 0);
                        LocalTime end = LocalTime.of(8, 0);

                        // 야간 시간대 (true)
                        assertThat(notificationService.isQuietTime(LocalTime.of(22, 0), start, end)).isTrue();
                        assertThat(notificationService.isQuietTime(LocalTime.of(2, 0), start, end)).isTrue();
                        assertThat(notificationService.isQuietTime(LocalTime.of(7, 59), start, end)).isTrue();

                        // 주간 활동 시간대 (false)
                        assertThat(notificationService.isQuietTime(LocalTime.of(8, 0), start, end)).isFalse();
                        assertThat(notificationService.isQuietTime(LocalTime.of(14, 0), start, end)).isFalse();
                        assertThat(notificationService.isQuietTime(LocalTime.of(20, 59), start, end)).isFalse();
                }
        }

        @Nested
        @DisplayName("3. [TC-NOTI-03] 알림 센터 목록 조회, 읽음, 삭제 및 30일 Cleanup 검증")
        class NotificationCrudTest {

                @Test
                @DisplayName("알림 목록 조회 시 unreadCount, hasUnread 및 targetId가 정상 반환됨")
                void getNotificationListSuccess() {
                        // given
                        UUID userId = UUID.randomUUID();
                        Notification n1 = Notification.builder()
                                        .notificationId(1L)
                                        .userId(userId)
                                        .type(NotificationType.EXPIRE_WARN)
                                        .title("소비기한 임박")
                                        .content("우유 3일 남음")
                                        .targetId(10L)
                                        .isRead(false)
                                        .createdAt(OffsetDateTime.now())
                                        .build();

                        given(notificationRepository.countUnreadByUserId(userId)).willReturn(1);
                        given(notificationRepository.findNotificationsByUserId(userId, 0, 20))
                                        .willReturn(Collections.singletonList(n1));

                        // when
                        NotificationListResponseDto result = notificationService.getNotificationList(userId, 0, 20);

                        // then
                        assertThat(result.getUnreadCount()).isEqualTo(1);
                        assertThat(result.isHasUnread()).isTrue();
                        assertThat(result.getNotifications()).hasSize(1);
                        assertThat(result.getNotifications().get(0).getTargetId()).isEqualTo(10L);
                }

                @Test
                @DisplayName("단일 알림 읽음 처리 성공")
                void markAsReadSuccess() {
                        // given
                        UUID userId = UUID.randomUUID();
                        Notification n = Notification.builder()
                                        .notificationId(1L)
                                        .userId(userId)
                                        .isRead(false)
                                        .build();

                        given(notificationRepository.findById(1L)).willReturn(Optional.of(n));

                        // when
                        NotificationReadResponseDto result = notificationService.markAsRead(userId, 1L);

                        // then
                        assertThat(result.getNotificationId()).isEqualTo(1L);
                        assertThat(result.getIsRead()).isTrue();
                        verify(notificationRepository, times(1)).updateReadStatus(1L, true);
                }

                @Test
                @DisplayName("타인의 알림 읽음 처리 시 403 Forbidden 예외 발생")
                void markAsReadForbiddenWhenOtherUser() {
                        // given
                        UUID ownerId = UUID.randomUUID();
                        UUID strangerId = UUID.randomUUID();
                        Notification n = Notification.builder()
                                        .notificationId(1L)
                                        .userId(ownerId)
                                        .isRead(false)
                                        .build();

                        given(notificationRepository.findById(1L)).willReturn(Optional.of(n));

                        // when & then
                        assertThatThrownBy(() -> notificationService.markAsRead(strangerId, 1L))
                                        .isInstanceOf(CustomException.class)
                                        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.AUTH_ALERT_ACCESS_DENIED);
                }

                @Test
                @DisplayName("전체 알림 일괄 읽음 처리 성공")
                void markAllAsReadSuccess() {
                        // given
                        UUID userId = UUID.randomUUID();
                        given(notificationRepository.markAllAsRead(userId)).willReturn(5);

                        // when
                        NotificationReadAllResponseDto result = notificationService.markAllAsRead(userId);

                        // then
                        assertThat(result.getUpdatedCount()).isEqualTo(5);
                }

                @Test
                @DisplayName("단일 알림 수동 삭제 성공")
                void deleteNotificationSuccess() {
                        // given
                        UUID userId = UUID.randomUUID();
                        Notification n = Notification.builder()
                                        .notificationId(10L)
                                        .userId(userId)
                                        .build();

                        given(notificationRepository.findById(10L)).willReturn(Optional.of(n));

                        // when
                        notificationService.deleteNotification(userId, 10L);

                        // then
                        verify(notificationRepository, times(1)).deleteById(10L);
                }

                @Test
                @DisplayName("전체 알림 일괄 삭제 성공")
                void deleteAllNotificationsSuccess() {
                        // given
                        UUID userId = UUID.randomUUID();
                        given(notificationRepository.deleteAllByUserId(userId)).willReturn(10);

                        // when
                        NotificationDeleteAllResponseDto result = notificationService.deleteAllNotifications(userId);

                        // then
                        assertThat(result.getDeletedCount()).isEqualTo(10);
                        verify(notificationRepository, times(1)).deleteAllByUserId(userId);
                }

                @Test
                @DisplayName("읽은 알림 30일 경과 자동 Cleanup 스케줄러 삭제 성공")
                void cleanupOldReadNotifications() {
                        // given
                        given(notificationRepository.deleteReadNotificationsOlderThan(30)).willReturn(15);

                        // when
                        int deleted = notificationService.cleanupOldReadNotifications(30);

                        // then
                        assertThat(deleted).isEqualTo(15);
                        verify(notificationRepository, times(1)).deleteReadNotificationsOlderThan(30);
                }

                @Test
                @DisplayName("알림 수신 및 방해금지 시간 통합 설정 성공")
                void updateSettingsSuccess() {
                        // given
                        UUID userId = UUID.randomUUID();
                        Profile profile = Profile.builder()
                                        .id(userId)
                                        .isExpireWarnEnabled(true)
                                        .isReactionNoticeEnabled(true)
                                        .quietTimeStart(LocalTime.of(21, 0))
                                        .quietTimeEnd(LocalTime.of(8, 0))
                                        .build();

                        given(profileRepository.findById(userId)).willReturn(Optional.of(profile));

                        NotificationSettingsRequestDto req = NotificationSettingsRequestDto.builder()
                                        .isExpireWarnEnabled(false)
                                        .isReactionNoticeEnabled(true)
                                        .quietTimeStart(LocalTime.of(22, 0))
                                        .quietTimeEnd(LocalTime.of(7, 0))
                                        .build();

                        // when
                        NotificationSettingsResponseDto res = notificationService.updateSettings(userId, req);

                        // then
                        assertThat(res.getIsExpireWarnEnabled()).isFalse();
                        assertThat(res.getIsReactionNoticeEnabled()).isTrue();
                        assertThat(res.getQuietTimeStart()).isEqualTo(LocalTime.of(22, 0));
                        assertThat(res.getQuietTimeEnd()).isEqualTo(LocalTime.of(7, 0));
                        verify(profileRepository, times(1)).updateNotificationSettings(
                                        userId, false, true, LocalTime.of(22, 0), LocalTime.of(7, 0));
                }
        }
}
