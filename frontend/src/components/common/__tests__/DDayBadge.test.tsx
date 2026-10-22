import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DDayBadge } from '@/components/common/DDayBadge';

describe('DDayBadge 컴포넌트 단위 테스트', () => {
  it('verbose=false(기본값)일 때 짧은 D-Day 형식("D-3")으로 렌더링해야 한다', () => {
    render(<DDayBadge dDay={3} />);
    expect(screen.getByText('D-3')).toBeInTheDocument();
  });

  it('dDay가 0일 때 "D-Day"로 렌더링해야 한다', () => {
    render(<DDayBadge dDay={0} />);
    expect(screen.getByText('D-Day')).toBeInTheDocument();
  });

  it('소비기한 초과(음수) 시 "D+N" 형식으로 렌더링해야 한다', () => {
    render(<DDayBadge dDay={-2} />);
    expect(screen.getByText('D+2')).toBeInTheDocument();
  });

  it('verbose=true일 때 긴 형식 문구("소비기한 N일 남음")로 렌더링해야 한다', () => {
    render(<DDayBadge dDay={5} verbose />);
    expect(screen.getByText('소비기한 5일 남음')).toBeInTheDocument();
  });

  it('verbose=true이고 dDay가 0일 때 "오늘까지"로 렌더링해야 한다', () => {
    render(<DDayBadge dDay={0} verbose />);
    expect(screen.getByText('오늘까지')).toBeInTheDocument();
  });

  it('verbose=true이고 음수일 때 "소비기한 N일 지남"으로 렌더링해야 한다', () => {
    render(<DDayBadge dDay={-1} verbose />);
    expect(screen.getByText('소비기한 1일 지남')).toBeInTheDocument();
  });

  it('임박(urgent, 0~3일)일 때 urgent 신호등 클래스가 적용되어야 한다', () => {
    render(<DDayBadge dDay={2} />);
    const badge = screen.getByText('D-2');
    expect(badge).toHaveClass('text-dday-urgent');
  });

  it('초과(expired, 음수)일 때 bg-dday-expired 클래스가 적용되어야 한다', () => {
    render(<DDayBadge dDay={-1} />);
    const badge = screen.getByText('D+1');
    expect(badge).toHaveClass('bg-dday-expired');
  });
});
