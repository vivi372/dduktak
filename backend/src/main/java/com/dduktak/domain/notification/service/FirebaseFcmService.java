package com.dduktak.domain.notification.service;

import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.AndroidNotification;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Firebase Cloud Messaging 푸시 알림 구현체
 * 디바이스 토큰 1:1 발송 및 토픽 발송을 모두 지원하며,
 * 비동기(Fire-and-Forget) 방식으로 동작하여 인앱 알림 트랜잭션 무결성을 보장합니다.
 */
@Slf4j
@Service
public class FirebaseFcmService implements FcmService {

    private final FirebaseMessaging firebaseMessaging;
    private final Map<UUID, String> userTokenMap = new ConcurrentHashMap<>();

    public FirebaseFcmService(@Autowired(required = false) FirebaseMessaging firebaseMessaging) {
        this.firebaseMessaging = firebaseMessaging;
    }

    @Override
    public void registerUserToken(UUID userId, String fcmToken) {
        if (userId != null && fcmToken != null && !fcmToken.trim().isEmpty()) {
            userTokenMap.put(userId, fcmToken.trim());
            log.info("[FCM Token Registered] 유저 디바이스 토큰 등록 완료: userId={}, tokenPrefix={}",
                    userId, fcmToken.substring(0, Math.min(10, fcmToken.length())) + "...");
        }
    }

    @Override
    public String getUserToken(UUID userId) {
        return userId != null ? userTokenMap.get(userId) : null;
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
            String deviceToken = getUserToken(userId);
            log.info("[FCM Push Send] 유저 대상 푸시 발송 시도: userId={}, hasDeviceToken={}, title='{}', body='{}'",
                    userId, deviceToken != null, title, body);

            Message.Builder messageBuilder = Message.builder();

            // 1. 발송 대상 지정: 디바이스 토큰 우선, 없을 시 토픽 발송
            if (deviceToken != null && !deviceToken.trim().isEmpty()) {
                messageBuilder.setToken(deviceToken.trim());
            } else {
                String userTopic = "user_" + userId.toString().replace("-", "");
                messageBuilder.setTopic(userTopic);
            }

            // 2. 안드로이드 전용 알림 설정 (Android 8.0+ 필수 Notification Channel 연동 및 HIGH 우선순위)
            AndroidConfig androidConfig = AndroidConfig.builder()
                    .setPriority(AndroidConfig.Priority.HIGH)
                    .setNotification(AndroidNotification.builder()
                            .setChannelId("dduktak_channel")
                            .setTitle(title)
                            .setBody(body)
                            .setSound("default")
                            .setDefaultVibrateTimings(true)
                            .build())
                    .build();
            messageBuilder.setAndroidConfig(androidConfig);

            // 3. 표준 알림 페이로드
            messageBuilder.setNotification(Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build());

            // 4. 추가 데이터 페이로드
            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            Message message = messageBuilder.build();
            String response = firebaseMessaging.send(message);
            log.info("[FCM Push Success] 푸시 발송 완료: userId={}, target={}, responseMessageId={}",
                    userId, (deviceToken != null ? "DEVICE_TOKEN" : "TOPIC"), response);
        } catch (Exception e) {
            // 푸시 실패 시에도 비즈니스 예외로 전파하지 않고 로그만 남김 (Fire-and-Forget)
            log.warn("[FCM Push Error] 푸시 발송 실패 (인앱 알림은 정상 저장됨): userId={}, error={}", userId, e.getMessage());
        }
    }
}
