import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge 컴포넌트 단위 테스트', () => {
  it('전달된 텍스트를 정상적으로 렌더링해야 한다', () => {
    render(<Badge>신선 재료</Badge>);
    expect(screen.getByText('신선 재료')).toBeInTheDocument();
  });

  it('기본 variant는 bg-brand-100 스타일이 적용되어야 한다', () => {
    render(<Badge>기본 배지</Badge>);
    const badge = screen.getByText('기본 배지');
    expect(badge).toHaveClass('bg-brand-100');
  });

  it('variant="mint"일 경우 bg-mint-100 스타일이 적용되어야 한다', () => {
    render(<Badge variant="mint">민트 배지</Badge>);
    const badge = screen.getByText('민트 배지');
    expect(badge).toHaveClass('bg-mint-100');
  });

  it('variant="outline"일 경우 border border-border 스타일이 적용되어야 한다', () => {
    render(<Badge variant="outline">외곽선 배지</Badge>);
    const badge = screen.getByText('외곽선 배지');
    expect(badge).toHaveClass('border');
    expect(badge).toHaveClass('border-border');
  });
});
