package com.dduktak.domain.notification.mapper;

import com.dduktak.domain.auth.entity.Profile;
import com.dduktak.domain.auth.mapper.ProfileMapper;
import com.dduktak.domain.notification.dto.ExpiringIngredientTargetVo;
import com.dduktak.domain.notification.entity.Notification;
import com.dduktak.domain.notification.entity.NotificationType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@DisplayName("[통합 테스트] NotificationMapper MyBatis SQL 매핑 및 실제 DB 연동 검증")
class NotificationMapperIntegrationTest {

    @Autowired
    private NotificationMapper notificationMapper;

    @Autowired
    private ProfileMapper profileMapper;

    private final UUID TEST_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Test
    @DisplayName("신규 알림 insert 및 findById, selectNotificationsByUserId 조회 검증")
    void insertAndSelect_success() {
        Notification notification = Notification.builder()
                .userId(TEST_USER_ID)
                .type(NotificationType.EXPIRE_WARN)
                .title("소비기한 임박 테스트")
                .content("🥛 [우유]의 소비기한이 2일 남았어요!")
                .targetId(100L)
                .isRead(false)
                .build();

        int inserted = notificationMapper.insert(notification);
        assertThat(inserted).isEqualTo(1);
        assertThat(notification.getNotificationId()).isNotNull();

        Optional<Notification> found = notificationMapper.findById(notification.getNotificationId());
        assertThat(found).isPresent();
        assertThat(found.get().getType()).isEqualTo(NotificationType.EXPIRE_WARN);
        assertThat(found.get().getTargetId()).isEqualTo(100L);
        assertThat(found.get().getTitle()).isEqualTo("소비기한 임박 테스트");

        List<Notification> list = notificationMapper.selectNotificationsByUserId(TEST_USER_ID, 0, 10);
        assertThat(list).isNotEmpty();
    }

    @Test
    @DisplayName("미읽음 알림 count 및 단일/전체 읽음 처리(updateReadStatus, updateReadAll) 검증")
    void countUnreadAndUpdateRead_success() {
        Notification n1 = Notification.builder()
                .userId(TEST_USER_ID)
                .type(NotificationType.LIKE_NOTICE)
                .title("좋아요 테스트 1")
                .content("내용 1")
                .isRead(false)
                .build();
        Notification n2 = Notification.builder()
                .userId(TEST_USER_ID)
                .type(NotificationType.COOKED_NOTICE)
                .title("요리완료 테스트 2")
                .content("내용 2")
                .isRead(false)
                .build();

        notificationMapper.insert(n1);
        notificationMapper.insert(n2);

        int unreadBefore = notificationMapper.countUnreadByUserId(TEST_USER_ID);
        assertThat(unreadBefore).isGreaterThanOrEqualTo(2);

        // 단일 읽음 처리
        notificationMapper.updateReadStatus(n1.getNotificationId(), true);
        Optional<Notification> n1Updated = notificationMapper.findById(n1.getNotificationId());
        assertThat(n1Updated.get().getIsRead()).isTrue();

        // 전체 읽음 처리
        notificationMapper.updateReadAllByUserId(TEST_USER_ID);
        int unreadAfter = notificationMapper.countUnreadByUserId(TEST_USER_ID);
        assertThat(unreadAfter).isEqualTo(0);
    }

    @Test
    @DisplayName("단일 삭제(deleteById) 및 전체 삭제(deleteAllByUserId) 검증")
    void deleteOperations_success() {
        Notification n = Notification.builder()
                .userId(TEST_USER_ID)
                .type(NotificationType.SYSTEM)
                .title("삭제 테스트")
                .content("내용")
                .isRead(true)
                .build();

        notificationMapper.insert(n);
        Long id = n.getNotificationId();

        notificationMapper.deleteById(id);
        Optional<Notification> deleted = notificationMapper.findById(id);
        assertThat(deleted).isEmpty();

        // 전체 삭제 검증
        Notification n2 = Notification.builder()
                .userId(TEST_USER_ID)
                .type(NotificationType.SYSTEM)
                .title("삭제 테스트 2")
                .content("내용 2")
                .isRead(true)
                .build();
        notificationMapper.insert(n2);

        int deletedCount = notificationMapper.deleteAllByUserId(TEST_USER_ID);
        assertThat(deletedCount).isGreaterThanOrEqualTo(1);

        List<Notification> remaining = notificationMapper.selectNotificationsByUserId(TEST_USER_ID, 0, 10);
        assertThat(remaining).isEmpty();
    }

    @Test
    @DisplayName("당일 소비기한 임박 알림 발송 여부(existsExpireWarnToday) 멱등성 쿼리 검증")
    void existsExpireWarnToday_success() {
        Notification n = Notification.builder()
                .userId(TEST_USER_ID)
                .type(NotificationType.EXPIRE_WARN)
                .title("당일 알림")
                .content("우유 3일 남음")
                .isRead(false)
                .build();

        notificationMapper.insert(n);

        boolean exists = notificationMapper.existsExpireWarnToday(TEST_USER_ID);
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("소비기한 임박(0 <= D-Day <= 3) 대상 식재료 조회 SQL 문법 및 연산 검증")
    void selectExpiringIngredientsForAlert_success() {
        List<ExpiringIngredientTargetVo> results = notificationMapper.selectExpiringIngredientsForAlert();
        assertThat(results).isNotNull();
    }

    @Test
    @DisplayName("ProfileMapper 알림 통합 설정(updateNotificationSettings) SQL 검증")
    void updateNotificationSettings_success() {
        int updated = profileMapper.updateNotificationSettings(
                TEST_USER_ID,
                false,
                true,
                LocalTime.of(23, 0, 0),
                LocalTime.of(7, 0, 0)
        );
        assertThat(updated).isEqualTo(1);

        Optional<Profile> profileOpt = profileMapper.findById(TEST_USER_ID);
        assertThat(profileOpt).isPresent();
        Profile profile = profileOpt.get();
        assertThat(profile.getIsExpireWarnEnabled()).isFalse();
        assertThat(profile.getIsReactionNoticeEnabled()).isTrue();
        assertThat(profile.getQuietTimeStart()).isEqualTo(LocalTime.of(23, 0, 0));
        assertThat(profile.getQuietTimeEnd()).isEqualTo(LocalTime.of(7, 0, 0));
    }
}
