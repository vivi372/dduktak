/**
 * Supabase Auth 및 인증 API 영문 에러 메시지를 사용자 친화적인 한글로 매핑하는 유틸
 * - 비밀번호 복잡도 (대/소문자, 숫자, 특수문자 요구조건)
 * - 회원가입 및 이메일 변경 시 이메일 중복
 * - 전송 빈도 초과(Rate Limit) 및 로그인 실패
 */
export function getFriendlyAuthErrorMessage(
  error: any,
  context?: 'signup' | 'change-email' | 'login' | 'reset-password',
): string {
  if (!error) return '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

  const rawMessage: string = error?.message || error?.error_description || String(error);
  const message = rawMessage.toLowerCase();

  // 1. 기존 비밀번호와 동일한 경우 (최우선 판별: 'password should be' 문자열보다 먼저 매칭)
  if (
    message.includes('new password should be different') ||
    message.includes('different from the old password') ||
    message.includes('same as the old password') ||
    message.includes('same_password')
  ) {
    return '기존 비밀번호와 다른 새로운 비밀번호를 입력해 주세요.';
  }

  // 2. 비밀번호 복잡도 / 길이 에러
  if (
    message.includes('password should contain') ||
    (message.includes('password should be') && !message.includes('different')) ||
    message.includes('weak_password') ||
    message.includes('password is too weak')
  ) {
    return '비밀번호는 8자 이상이며, 영문 대/소문자, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.';
  }

  // 2. 이메일 중복 에러
  if (
    message.includes('user already registered') ||
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('email already in use') ||
    message.includes('email_exists') ||
    message.includes('already exists')
  ) {
    if (context === 'change-email') {
      return '이미 다른 계정에서 사용 중인 이메일 주소입니다.';
    }
    return '이미 가입된 이메일 주소입니다. 로그인을 진행해 주세요.';
  }

  // 3. 로그인 인증 정보 불일치
  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid_credentials') ||
    message.includes('invalid email or password')
  ) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }

  // 4. 이메일 미인증
  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return '이메일 인증이 완료되지 않았습니다. 메일함(받은편지함/스팸함)을 확인해 주세요.';
  }

  // 5. 전송 빈도 초과 (Rate Limit)
  if (
    message.includes('over_email_send_rate_limit') ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  ) {
    return '요청이 너무 빈번합니다. 보안을 위해 잠시 후(약 1분 뒤) 다시 시도해 주세요.';
  }

  // 6. 세션 만료
  if (
    message.includes('auth session missing') ||
    message.includes('session expired') ||
    message.includes('jwt expired')
  ) {
    return '인증 세션이 만료되었거나 올바르지 않습니다. 다시 로그인해 주세요.';
  }


  // 8. 올바르지 않은 이메일 형식
  if (message.includes('unable to validate email') || message.includes('invalid email')) {
    return '올바른 이메일 주소 형식을 입력해 주세요.';
  }

  // 9. 사용자 미존재 (비밀번호 찾기 등)
  if (message.includes('user not found')) {
    return '등록되지 않은 이메일 계정입니다.';
  }

  return rawMessage;
}
