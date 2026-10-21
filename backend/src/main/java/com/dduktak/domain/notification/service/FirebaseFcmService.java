package com.dduktak.domain.notification.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

/**
 * Firebase Cloud Messaging 푸시 알림 구현체
 * 비동기(Fire-and-Forget) 방식으로 동작하며, 푸시 실패 시에도 인앱 알림 DB 트랜잭션의 무결성을 보장합니다.
 */
@Slf4j
@Service
public class FirebaseFcmService implements FcmService {

    private final FirebaseMessaging firebaseMessaging;

    public FirebaseFcmService(@Autowired(required = false) FirebaseMessaging firebaseMessaging) {
        this.firebaseMessaging = firebaseMessaging;
    }

    @Async
    @Override
    public void sendPushAsync(UUID userId, String title, String body, Map<String, String> data) {
        if (firebaseMessaging == null) {
            log.info(
                    "[FCM Push Skip] FirebaseMessaging이 활성화되지 않아 푸시 발송을 시뮬레이션 로깅합니다: userId={}, title='{}', body='{}', data={}",
                    userId, title, body, data);
            return;
        }

        try {
            log.info("[FCM Push Send] 유저 대상 푸시 발송 시도: userId={}, title='{}', body='{}'", userId, title, body);

            // 유저별 토큰이 지정되지 않은 프로토타입/개발 환경에서는 유저 토픽(topic) 또는 시뮬레이션으로 전송
            String userTopic = "user_" + userId.toString().replace("-", "");
            Message.Builder messageBuilder = Message.builder()
                    .setTopic(userTopic)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build());

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            Message message = messageBuilder.build();
            String response = firebaseMessaging.send(message);
            log.info("[FCM Push Success] 푸시 발송 완료: userId={}, responseMessageId={}", userId, response);
        } catch (Exception e) {
            // 푸시 실패 시에도 비즈니스 예외로 전파하지 않고 로그만 남김 (Fire-and-Forget)
            log.warn("[FCM Push Error] 푸시 발송 실패 (인앱 알림은 정상 저장됨): userId={}, error={}", userId, e.getMessage());
        }
    }
}
