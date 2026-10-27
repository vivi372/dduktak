import { describe, it, expect } from 'vitest';
import { getFriendlyAuthErrorMessage } from '../authError';

describe('getFriendlyAuthErrorMessage 유틸 단위 테스트', () => {
  it('기존 비밀번호와 동일한 경우 ("New password should be different...")를 올바르게 안내해야 한다', () => {
    const error = new Error('New password should be different from the old password.');
    const result = getFriendlyAuthErrorMessage(error);
    expect(result).toBe('기존 비밀번호와 다른 새로운 비밀번호를 입력해 주세요.');
  });

  it('비밀번호 복잡도 미충족 ("Password should contain at least one character...") 에러를 친절한 한글로 변환해야 한다', () => {
    const error = new Error(
      'Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz, ABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789, !@#$%^&*()_+-=[]{};\':"|<>?,./`~.',
    );
    const result = getFriendlyAuthErrorMessage(error);
    expect(result).toBe(
      '비밀번호는 8자 이상이며, 영문 대/소문자, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.',
    );
  });

  it('회원가입 시 이미 등록된 이메일인 경우 ("User already registered") 로그인 유도 안내를 해야 한다', () => {
    const error = new Error('User already registered');
    const result = getFriendlyAuthErrorMessage(error, 'signup');
    expect(result).toBe('이미 가입된 이메일 주소입니다. 로그인을 진행해 주세요.');
  });

  it('마이페이지 이메일 변경 시 중복 이메일인 경우 ("email already in use") 중복 안내를 해야 한다', () => {
    const error = new Error('A user with this email address has already been registered');
    const result = getFriendlyAuthErrorMessage(error, 'change-email');
    expect(result).toBe('이미 다른 계정에서 사용 중인 이메일 주소입니다.');
  });

  it('로그인 실패 ("Invalid login credentials") 시 친절한 안내를 해야 한다', () => {
    const error = new Error('Invalid login credentials');
    const result = getFriendlyAuthErrorMessage(error);
    expect(result).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
  });

  it('요청 빈도 초과 ("over_email_send_rate_limit") 시 잠시 후 시도 안내를 해야 한다', () => {
    const error = new Error('over_email_send_rate_limit');
    const result = getFriendlyAuthErrorMessage(error);
    expect(result).toContain('요청이 너무 빈번합니다.');
  });
});
