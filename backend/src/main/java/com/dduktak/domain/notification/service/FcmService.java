package com.dduktak.domain.notification.service;

import java.util.Map;
import java.util.UUID;

/**
 * FCM(Firebase Cloud Messaging) 비동기 푸시 발송 서비스 인터페이스
 * 인앱 DB 저장 후 Fire-and-Forget 방식으로 동작합니다.
 */
public interface FcmService {

    /**
     * 유저의 FCM 디바이스 토큰 등록/갱신
     */
    void registerUserToken(UUID userId, String fcmToken);

    /**
     * 유저의 등록된 FCM 디바이스 토큰 조회
     */
    String getUserToken(UUID userId);

    /**
     * 비동기 푸시 알림 발송 (Fire-and-Forget)
     *
     * @param userId 수신 회원 UUID
     * @param title 푸시 알림 제목
     * @param body 푸시 알림 본문
     * @param data 이동용 메타데이터 (type, targetId 등)
     */
    void sendPushAsync(UUID userId, String title, String body, Map<String, String> data);
}
