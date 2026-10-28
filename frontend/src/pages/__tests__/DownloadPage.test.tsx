import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DownloadPage } from '@/pages/DownloadPage';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DownloadPage (실기기 APK 다운로드 페이지) 단위 테스트', () => {
  it('앱 제목, 브랜드 설명 및 최신 APK 다운로드 버튼을 렌더링해야 한다', () => {
    render(<DownloadPage />);

    expect(screen.getByRole('heading', { level: 1, name: '오늘의 뚝딱' })).toBeInTheDocument();
    expect(screen.getByText('1인 가구를 위한 냉장고 파먹기 & 맞춤 요리 솔루션')).toBeInTheDocument();

    const downloadLink = screen.getByRole('link', { name: /최신 APK 다운로드/ });
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute('href', '/downloads/dduktak-app.apk');
    expect(downloadLink).toHaveAttribute('download', 'dduktak-app.apk');
  });

  it('안드로이드 3단계 설치 가이드와 동일 Wi-Fi 주의사항을 렌더링해야 한다', () => {
    render(<DownloadPage />);

    expect(screen.getByText(/동일 Wi-Fi 네트워크 필수 확인/)).toBeInTheDocument();
    expect(screen.getByText('안드로이드 설치 가이드 (3단계)')).toBeInTheDocument();
    expect(screen.getByText('APK 다운로드 및 확인')).toBeInTheDocument();
    expect(screen.getByText('출처를 알 수 없는 앱 허용')).toBeInTheDocument();
    expect(screen.getByText('설치 완료 및 앱 실행')).toBeInTheDocument();
  });

  it('주소 복사 버튼 클릭 시 클립보드에 현재 주소를 복사하고 토스트를 띄워야 한다', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    render(<DownloadPage />);

    const copyBtn = screen.getByRole('button', { name: /주소 복사/ });
    expect(copyBtn).toBeInTheDocument();

    await user.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('다운로드 페이지 링크가 복사되었습니다!');
  });
});
