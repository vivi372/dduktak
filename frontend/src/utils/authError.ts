/**
 * Supabase Auth 및 인증 API 영문 에러 메시지를 사용자 친화적인 한글로 매핑하는 유틸
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

  const message: string = error?.message || error?.error_description || String(error);

  if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }

  if (message.includes('Email not confirmed')) {
    return '이메일 인증이 완료되지 않았습니다. 메일함(받은편지함/스팸함)을 확인해 주세요.';
  }

  if (message.includes('User already registered') || message.includes('already registered')) {
    return '이미 등록된 이메일 주소입니다. 로그인을 진행해 주세요.';
  }

  if (message.includes('Password should be at least')) {
    return '비밀번호는 최소 8자 이상이어야 합니다.';
  }

  if (message.includes('over_email_send_rate_limit') || message.includes('rate limit')) {
    return '이메일 발송 요청이 너무 빈번합니다. 잠시 후 다시 시도해 주세요.';
  }

  if (message.includes('Auth session missing') || message.includes('session expired')) {
    return '인증 세션이 만료되었거나 올바르지 않습니다. 다시 로그인해 주세요.';
  }

  if (message.includes('New password should be different')) {
    return '이전 비밀번호와 다른 새로운 비밀번호를 입력해 주세요.';
  }

  return message;
}
