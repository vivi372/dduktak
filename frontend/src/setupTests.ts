// @testing-library/jest-dom의 커스텀 매처(Matcher) 등록
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom 환경을 위한 URL.createObjectURL 및 revokeObjectURL 모킹
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost:5173/mock-blob-url');
  window.URL.revokeObjectURL = vi.fn();
}

// 각 테스트 종료 후 DOM 정리
afterEach(() => {
  cleanup();
});
