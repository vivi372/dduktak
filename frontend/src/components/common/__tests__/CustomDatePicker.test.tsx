import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CustomDatePicker } from '../CustomDatePicker';

describe('CustomDatePicker 컴포넌트 단위 테스트', () => {
  it('기본 렌더링 시 전달받은 날짜와 D-Day 배지가 정상 노출되어야 한다', () => {
    const handleChange = vi.fn();
    render(<CustomDatePicker value="2026-10-25" onChange={handleChange} />);

    // 날짜 텍스트 확인 (2026년 10월 25일)
    expect(screen.getByText(/2026년 10월 25일/)).toBeInTheDocument();
    // D-Day 배지 확인 (D-Day, D-N, D+N 등)
    expect(screen.getByText(/D[-+]?\d+|D-Day/)).toBeInTheDocument();
  });


  it('트리거 버튼 클릭 시 커스텀 캘린더 팝오버가 열리고 날짜 그리드가 렌더링되어야 한다', () => {
    const handleChange = vi.fn();
    render(<CustomDatePicker value="2026-10-25" onChange={handleChange} />);

    const triggerBtn = screen.getByRole('button', { name: /2026년 10월 25일/ });
    fireEvent.click(triggerBtn);

    // 캘린더 헤더 년월 표시 확인
    expect(screen.getByText('2026년 10월')).toBeInTheDocument();
    // 요일 헤더 표시 확인
    expect(screen.getByText('일')).toBeInTheDocument();
    expect(screen.getByText('토')).toBeInTheDocument();
    // 오늘 버튼 표시 확인
    expect(screen.getByText('오늘')).toBeInTheDocument();
  });

  it('캘린더에서 특정 날짜를 클릭하면 onChange 콜백이 호출되어야 한다', () => {
    const handleChange = vi.fn();
    render(<CustomDatePicker value="2026-10-25" onChange={handleChange} />);

    const triggerBtn = screen.getByRole('button', { name: /2026년 10월 25일/ });
    fireEvent.click(triggerBtn);

    // 15일 버튼 클릭 (10월 15일)
    const dayBtn = screen.getByRole('button', { name: '15' });
    fireEvent.click(dayBtn);

    expect(handleChange).toHaveBeenCalledWith('2026-10-15');
  });
});
