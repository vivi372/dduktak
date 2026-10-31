# 🎥 [Cycle 2] 통합 테스트 화면 녹화(Video Recording) 표준 가이드

본 문서는 **2차 종합 통합 테스트(Cycle 2)**의 시각적 증적 확보 및 향후 **GitHub README, 포트폴리오 시연 영상, 데모 GIF**로 활용하기 위한 화면 녹화 표준 절차를 정의합니다.

---

## 1. 녹화 목표 및 권장 영상 클립 구성 (포트폴리오 5대 핵심 클립)

모든 과정을 1개의 긴 영상으로 찍으면 파일 용량이 크고 포트폴리오에 올리기 어려우므로, **기능 단위별 5대 핵심 클립**으로 분할 녹화하는 것을 강력 권장합니다.

| 클립 번호 | 파일명 | 대상 기능 및 시나리오 | 권장 길이 | 포트폴리오 활용처 |
|:---:|:---|:---|:---:|:---|
| **Clip 1** | `01_onboarding_and_auth.mp4` | 오프닝 스플래시 ➔ 3단계 온보딩 ➔ 이메일/구글 소셜 로그인 | 약 30~45초 | 첫인상 UI/UX, 온보딩 흐름 데모 |
| **Clip 2** | `02_receipt_ocr_and_fridge.mp4` | 영수증 OCR 스캔 ➔ **글자 안 잘리는 검수 모달** ➔ 2-Tier 아코디언 냉장고 | 약 45~60초 | 핵심 기술(Gemini OCR AI, D-Day 관리) |
| **Clip 3** | `03_smart_matching_and_recipe.mp4` | 스마트 추천 피드 ➔ **상세 진입 (매칭점수 100% 일치)** ➔ 15종 고화질 썸네일 | 약 30~45초 | 추천 엔진 알고리즘 시연 |
| **Clip 4** | `04_cook_completion_fifo.mp4` | 요리 완료 ➔ 맞춤 차감 모달 ➔ **선입선출(FIFO) 냉장고 자동 차감** | 약 40~50초 | 핵심 비즈니스 로직 (재고 차감) |
| **Clip 5** | `05_notification_and_mypage.mp4` | 알림 센터(읽음/삭제) ➔ 마이페이지 프로필 변경 ➔ 회원 탈퇴 데이터 익명화 | 약 30~45초 | 완성도 및 데이터 보안/정책 준수 |

> [!TIP]
> 저장 위치: 모든 녹화 영상은 `integration-tests/cycle-02/evidence/recordings/` 디렉토리에 저장합니다.

---

## 2. 녹화 방법 안내

### 📱 방법 A: Android 모바일 실기기 녹화 (가장 추천! 고화질 포트폴리오용)

USB 디버깅이 연결된 Android 스마트폰에서 `adb` 명령어를 통해 **워터마크 없는 초고화질 무손실 MP4 영상**을 직접 녹화하고 PC로 가져옵니다.

#### 1) 녹화 시작 커맨드 (터미널)
```bash
# 스마트폰 화면을 MP4로 녹화 시작 (종료하려면 Ctrl + C 입력)
adb shell screenrecord /sdcard/clip_test.mp4
```

#### 2) PC로 영상 가져오기
```bash
# 녹화된 영상을 cycle-02 녹화 폴더로 다운로드
adb pull /sdcard/clip_test.mp4 "integration-tests/cycle-02/evidence/recordings/01_onboarding_and_auth.mp4"

# 스마트폰 내 임시 파일 정리
adb shell rm /sdcard/clip_test.mp4
```

> [!NOTE]
> `screenrecord` 옵션:
> - 비트레이트 지정: `--bit-rate 8000000` (8Mbps 고화질)
> - 크기 지정: `--size 720x1600` (파일 용량 최적화)

---

### 💻 방법 B: PC 웹 브라우저 녹화 (Vercel 배포 사이트 녹화)

PC 크롬 브라우저에서 모바일 뷰포트(390 × 844 px) 모드로 화면을 녹화합니다.

1. **Windows 내장 게임바 (단축키)**:
   - `Win + Alt + R`: 즉시 화면 녹화 시작 / 중지
   - 녹화 완료 후 `동영상/캡처` 폴더의 MP4 파일을 `cycle-02/evidence/recordings/`로 이동.
2. **크롬 확장 프로그램 / 온라인 도구**:
   - Loom, Scrnli, 또는 크롬 확장 프로그램을 사용해 탭 단위 녹화 후 WebP/MP4 다운로드.
3. **브라우저 개발자 도구 (DevTools Protocol)**:
   - 브라우저 서브에이전트 구동 시 Screencast 자동 덤프 활용.

---

## 3. 포트폴리오 데모 GIF 변환 팁 (선택 사항)

GitHub `README.md`에 영상을 임베드할 때는 5~10MB 이하의 **애니메이션 GIF**가 가장 적합합니다.  
다운로드한 MP4 파일을 [ezgif.com](https://ezgif.com/video-to-gif) 등에서 다음과 같이 변환하면 최적입니다:
- 너비(Width): `360px` 또는 `480px`
- 프레임레이트(FPS): `20fps`
- 최적화: Lossy GIF 압축 (수치 30~35)

