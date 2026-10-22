// @testing-library/jest-dom의 커스텀 매처(Matcher) 등록
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 각 테스트 종료 후 DOM 정리
afterEach(() => {
  cleanup();
});
