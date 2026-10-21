📄 [모듈 5 최종 확정 명세서] 알림 시스템 (Notification Engine)

1. 개요 및 시스템 정책
• 목적: 소비기한 임박 식재료를 알려주어 식재료 낭비를 줄이고, 소셜 반응(내 레시피 좋아요 등)을 실시간 전달하여 앱 재방문 유도.
• 주요 전달 채널: Android Webview 푸시 알림 (FCM + Service Worker) 및 앱 내 알림 센터.
• 알림 수신 및 발송 제한 정책:
  ◦ 마이페이지(알림 설정)에서 소비기한 알림 ON/OFF, 소셜 반응 알림 ON/OFF 토글 및 야간 방해금지 시간(기본 21:00~08:00) 설정을 단일 통합 API(`PATCH /api/v1/notifications/settings`)로 제공.
  ◦ 야간 푸시 방지 (고정): 21:00 ~ 08:00 시간대 푸시 발송 금지 (임박 알림 배치 작업은 매일 09:00 일괄 실행).
  ◦ 실시간 소셜 알림 검증: 타 유저의 좋아요/요리완료 발생 시, 수신 유저의 `is_reaction_notice_enabled = TRUE` 및 방해금지 시간 설정(`quiet_time_start` ~ `quiet_time_end`)을 검증하여 방해금지 시간 내 푸시 발송을 차단/스킵.
  ◦ 자추(Self-Action) 알림 필터링: 본인이 작성한 레시피에 본인이 좋아요/요리완료를 누르는 자추 행위는 전면 허용하되, 자기 자신에게 소셜 알림 메시지가 생성되는 것은 차단 (`authorId != actorId` 조건 필터링).

2. 세부 기능 요구사항 (Functional Requirements)

2.1. 소비기한 임박 알림 (Inventory Alert - 묶음 발송)
• NOTI-01-1 [소비기한 임박 스케줄러 (매일 09:00 Batch & 멱등성 보장)]:
  ◦ 매일 09:00 시스템 배치(`@Scheduled(cron = "0 0 9 * * *")`)가 실행되어 유저별 D-3 및 D-Day/D-1 임박 식재료 추출.
  ◦ 스케줄러 멱등성(Idempotency): 동일 날짜 중복 실행 시에도 동일 유저에게 당일 `EXPIRE_WARN` 알림이 중복 작성되지 않도록 당일 작성 이력(`DATE(created_at) = CURRENT_DATE`) 확인 후 `INSERT`.
• NOTI-01-2 [동일 유형 알림 묶음 발송 (Notification Grouping)]:
  ◦ 임박 재료가 N개일 경우 개별 푸시를 도배하지 않고 1건의 묶음 알림으로 통합 전송.
  ◦ 단일 재료 예시: "🥛 [우유]의 소비기한이 3일 남았어요!"
  ◦ 다중 재료 묶음 예시: "🥛 [우유], [계란] 외 3개 재료의 소비기한이 임박했어요!"
• NOTI-01-3 [내 냉장고 딥링크 (Deep Link) 및 딥링크 예외 복구]:
  ◦ 해당 알림 터치 시 이동용 메타데이터(`type: EXPIRE_WARN`, `targetId`)를 기반으로 내 냉장고 화면으로 이동하며 대표 식재료 카드의 아코디언을 자동으로 열어 하이라이팅.

2.2. 커뮤니티 소셜 알림 (Social Alert)
• NOTI-02-1 [내 레시피 반응 알림 & 자추 허용]:
  ◦ 본인의 레시피에 직접 좋아요/요리완료를 실행하는 자추 동작은 정상 허용.
  ◦ 타 유저의 반응 시 알림 생성:
    - 좋아요 알림: "❤️ [유저 닉네임]님이 회원님의 '[돼지고기 김치찌개]' 레시피를 좋아합니다."
    - 요리완료 알림: "🍳 [유저 닉네임]님이 회원님의 '[계란볶음밥]' 레시피로 요리를 완성했어요!"
• NOTI-02-2 [레시피 상세 딥링크 및 파기된 리소스 안전 대응]:
  ◦ 해당 푸시/알림 터치 시 메타데이터(`type`, `targetId`)를 기반으로 해당 레시피 상세 페이지로 즉시 이동.
  ◦ 딥링크 대상 레시피가 이미 삭제/파기된 경우, "이미 삭제되었거나 찾을 수 없는 콘텐츠입니다" 안내 토스트 노출 후 메인 화면으로 안전하게 리다이렉트 (Graceful Fallback).

2.3. 앱 내 알림 센터 및 관리 (Notification Center)
• NOTI-03-1 [헤더 알림 뱃지(Red Dot) 및 목록 고속 조회]:
  ◦ 상단 종 모양(🔔) 아이콘 렌더링을 위해 `GET /api/v1/notifications` 응답 상단에 `unreadCount` (읽지 않은 알림 수) 및 `hasUnread` (Boolean) 필드 포함.
  ◦ 복합 인덱스 `idx_notification_user_created (user_id, created_at DESC)` 적용으로 최신순 목록 고속 조회.
• NOTI-03-2 [알림 보존 및 3-Way 삭제 정책]:
  ◦ 수동 개별 삭제: 알림 항목 스와이프/삭제 버튼 클릭 시 `DELETE /api/v1/notifications/{notificationId}` 수행.
  ◦ 수동 일괄 처리: 단일/일괄 읽음 처리(`PATCH /read-all`) 및 전체 삭제(`DELETE /api/v1/notifications/all`) 제공.
  ◦ 자동 Cleanup 배치: 읽은 알림(`is_read = true`)은 생성 후 30일 경과 시 백엔드 정기 스케줄러가 DB에서 자동 Cleanup 삭제.
