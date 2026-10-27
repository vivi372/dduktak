# Supabase Auth 이메일 템플릿 가이드 (오늘의 뚝딱)

Supabase 대시보드 (`Authentication` ➔ `Email Templates`)에 바로 복사하여 사용할 수 있는 '오늘의 뚝딱' 공식 브랜드 HTML 이메일 템플릿입니다.

* **브랜드 대표 컬러**: 코랄 핑크 (`#FF8A7A`), 딥 코랄 (`#E5604F`), 민트 티얼 (`#4ECDC4`), 다크 차콜 (`#2C302E`)
* **로고 이미지**: `https://hefryhbaoovrhgzevfad.supabase.co/storage/v1/object/public/profiles/Default%20Profile.png` 또는 공식 로고 경로

---

## 1. 회원가입 이메일 인증 (Confirm signup)
* **메일 제목 (Subject)**: `[오늘의 뚝딱] 회원가입 이메일 인증을 완료해 주세요`
* **설명**: 메일함에서 링크를 클릭하면 전용 브릿지 페이지(`/auth/callback`)로 연결되어 원래 탭을 자동으로 로그인 상태로 전환하고 현재 창을 닫도록 안내합니다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>오늘의 뚝딱 - 회원가입 인증</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Pretendard', Roboto, 'Noto Sans KR', sans-serif; color: #2C302E;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #FFFFFF; border-radius: 28px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #ECEEF0;" cellspacing="0" cellpadding="0">
          <!-- 상단 코랄 그라데이션 포인트 바 -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #FF8A7A 0%, #FFA89B 50%, #4ECDC4 100%);"></td>
          </tr>

          <!-- 메인 콘텐츠 영역 -->
          <tr>
            <td style="padding: 40px 32px 32px 32px; text-align: center;">
              <!-- 서비스 로고 & 명칭 -->
              <div style="margin-bottom: 24px;">
                <span style="font-size: 24px; font-weight: 900; color: #FF8A7A; letter-spacing: -0.5px;">오늘의 뚝딱</span>
                <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 700; color: #8E95A2; text-transform: uppercase; letter-spacing: 1px;">Smart Fridge & Recipe Solution</p>
              </div>

              <!-- 타이틀 & 안내 문구 -->
              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #1E232A; line-height: 1.4;">
                환영합니다! 👨‍🍳<br>이메일 인증을 완료해 주세요
              </h1>
              <p style="margin: 0 0 32px 0; font-size: 14px; line-height: 1.6; color: #5A6270; word-break: keep-all;">
                '오늘의 뚝딱'에 오신 것을 진심으로 환영합니다.<br>
                아래 버튼을 누르면 이메일 인증이 완료되며, 나만의 맞춤 냉장고 관리와 요리 추천을 바로 시작하실 수 있습니다.
              </p>

              <!-- 인증 액션 버튼 -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; width: 100%; max-width: 340px; padding: 16px 0; background-color: #FF8A7A; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 800; border-radius: 18px; box-shadow: 0 6px 16px rgba(255, 138, 122, 0.35); text-align: center;">
                      이메일 인증 완료하기
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 안내 팁 박스 -->
              <div style="background-color: #F8F9FA; border-radius: 16px; padding: 16px; text-align: left; border: 1px solid #ECEEF0;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #2C302E;">💡 안내사항</p>
                <p style="margin: 0; font-size: 11px; color: #7B8494; line-height: 1.5; word-break: keep-all;">
                  • 본 인증 링크는 발송 후 24시간 동안만 유효합니다.<br>
                  • 회원가입을 요청하지 않으셨다면 본 메일을 무시하셔도 안전합니다.<br>
                  • 모바일 앱에서 가입하셨다면 인증 완료 후 뚝딱 앱으로 돌아가시면 됩니다.
                </p>
              </div>
            </td>
          </tr>

          <!-- 푸터 카피라이트 -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FAFAFA; border-top: 1px solid #F0F2F4; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9AA1AF; line-height: 1.5;">
                본 메일은 발신 전용 메일입니다.<br>
                © 2026 오늘의 뚝딱 (Dduktak). All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. 이메일 변경 확인 (Confirm email change)
* **메일 제목 (Subject)**: `[오늘의 뚝딱] 새 이메일 주소 변경을 승인해 주세요`
* **설명**: 마이페이지 계정 설정에서 이메일 변경 시 새 메일 주소의 유효성을 검증하는 확인 링크 메일입니다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>오늘의 뚝딱 - 이메일 변경 확인</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Pretendard', Roboto, 'Noto Sans KR', sans-serif; color: #2C302E;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #FFFFFF; border-radius: 28px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #ECEEF0;" cellspacing="0" cellpadding="0">
          <!-- 상단 민트-코랄 그라데이션 포인트 바 -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #4ECDC4 0%, #FF8A7A 100%);"></td>
          </tr>

          <!-- 메인 콘텐츠 영역 -->
          <tr>
            <td style="padding: 40px 32px 32px 32px; text-align: center;">
              <div style="margin-bottom: 24px;">
                <span style="font-size: 24px; font-weight: 900; color: #FF8A7A; letter-spacing: -0.5px;">오늘의 뚝딱</span>
                <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 700; color: #8E95A2; text-transform: uppercase; letter-spacing: 1px;">Smart Fridge & Recipe Solution</p>
              </div>

              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #1E232A; line-height: 1.4;">
                이메일 주소 변경 확인
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #5A6270; word-break: keep-all;">
                계정의 로그인 이메일을 아래의 새 주소로 변경 요청하셨습니다.<br>
                정상적인 변경을 위해 아래 버튼을 눌러 인증을 완료해 주세요.
              </p>

              <!-- 새 이메일 주소 표시 박스 -->
              <div style="margin-bottom: 28px; padding: 14px 20px; background-color: #FFF5F4; border: 1px dashed #FFA89B; border-radius: 14px; display: inline-block;">
                <span style="font-size: 14px; font-weight: 800; color: #E5604F;">{{ .NewEmail }}</span>
              </div>

              <!-- 인증 액션 버튼 -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; width: 100%; max-width: 340px; padding: 16px 0; background-color: #FF8A7A; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 800; border-radius: 18px; box-shadow: 0 6px 16px rgba(255, 138, 122, 0.35); text-align: center;">
                      새 이메일 주소로 변경 승인
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 보안 주의 안내 -->
              <div style="background-color: #F8F9FA; border-radius: 16px; padding: 16px; text-align: left; border: 1px solid #ECEEF0;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #2C302E;">🔒 계정 보안 안내</p>
                <p style="margin: 0; font-size: 11px; color: #7B8494; line-height: 1.5; word-break: keep-all;">
                  본인이 요청한 변경이 아닌 경우 본 링크를 절대 누르지 마시고, 기존 계정 비밀번호를 즉시 변경해 주시기 바랍니다.
                </p>
              </div>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FAFAFA; border-top: 1px solid #F0F2F4; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9AA1AF; line-height: 1.5;">
                본 메일은 발신 전용 메일입니다.<br>
                © 2026 오늘의 뚝딱 (Dduktak). All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. 비밀번호 재설정 (Reset Password) - [OTP 인증코드 방식] ⭐
* **메일 제목 (Subject)**: `[오늘의 뚝딱] 비밀번호 재설정 인증번호입니다`
* **설명**: 탭 복제 및 외부 브라우저 이탈 없이, 화면에서 바로 입력할 수 있는 **숫자 인증코드(`{{ .Token }}`)**를 직관적으로 강조하여 보여줍니다. (보조 옵션으로 원클릭 링크 `{{ .ConfirmationURL }}`도 하단에 함께 제공)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>오늘의 뚝딱 - 비밀번호 재설정 인증번호</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Pretendard', Roboto, 'Noto Sans KR', sans-serif; color: #2C302E;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #FFFFFF; border-radius: 28px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #ECEEF0;" cellspacing="0" cellpadding="0">
          <!-- 상단 코랄 그라데이션 포인트 바 -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #E5604F 0%, #FF8A7A 100%);"></td>
          </tr>

          <!-- 메인 콘텐츠 영역 -->
          <tr>
            <td style="padding: 40px 32px 32px 32px; text-align: center;">
              <div style="margin-bottom: 24px;">
                <span style="font-size: 24px; font-weight: 900; color: #FF8A7A; letter-spacing: -0.5px;">오늘의 뚝딱</span>
                <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 700; color: #8E95A2; text-transform: uppercase; letter-spacing: 1px;">Smart Fridge & Recipe Solution</p>
              </div>

              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #1E232A; line-height: 1.4;">
                비밀번호 재설정 인증번호
              </h1>
              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #5A6270; word-break: keep-all;">
                비밀번호를 재설정하기 위한 인증번호입니다.<br>
                화면의 <strong>인증번호 입력창</strong>에 아래 숫자를 입력해 주세요.
              </p>

              <!-- OTP 인증코드 강조 박스 -->
              <div style="margin-bottom: 32px; padding: 24px 20px; background: linear-gradient(135deg, #FFF5F4 0%, #FFF0EE 100%); border: 2px dashed #FF8A7A; border-radius: 20px; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #E5604F; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #FF8A7A; font-family: 'Courier New', Courier, monospace;">
                  {{ .Token }}
                </div>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #8E95A2;">유효시간: 10분 이내 입력</p>
              </div>

              <!-- 보조 옵션: 직접 링크 클릭 -->
              <div style="margin-bottom: 28px; text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #7B8494;">인증번호 입력 대신 바로 변경 화면으로 이동하시려면:</p>
                <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #F8F9FA; border: 1px solid #E2E5E9; color: #4A5160; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 12px;">
                  비밀번호 재설정 페이지 직접 열기 →
                </a>
              </div>

              <!-- 안내 팁 박스 -->
              <div style="background-color: #F8F9FA; border-radius: 16px; padding: 16px; text-align: left; border: 1px solid #ECEEF0;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #2C302E;">💡 주의사항</p>
                <p style="margin: 0; font-size: 11px; color: #7B8494; line-height: 1.5; word-break: keep-all;">
                  • 본 인증번호는 10분간만 유효하며 1회 인증 후 만료됩니다.<br>
                  • 비밀번호 재설정을 요청하지 않으셨다면 타인이 고객님의 이메일을 잘못 입력했을 수 있으니 본 메일을 무시해 주세요.
                </p>
              </div>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FAFAFA; border-top: 1px solid #F0F2F4; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9AA1AF; line-height: 1.5;">
                본 메일은 발신 전용 메일입니다.<br>
                © 2026 오늘의 뚝딱 (Dduktak). All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```
