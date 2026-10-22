import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HorizontalCarousel } from '@/components/common/HorizontalCarousel';

describe('HorizontalCarousel 컴포넌트 단위 테스트', () => {
  it('자식 컴포넌트들을 정상적으로 렌더링해야 한다', () => {
    render(
      <HorizontalCarousel>
        <div>카드 1</div>
        <div>카드 2</div>
        <div>카드 3</div>
      </HorizontalCarousel>,
    );

    expect(screen.getByText('카드 1')).toBeInTheDocument();
    expect(screen.getByText('카드 2')).toBeInTheDocument();
    expect(screen.getByText('카드 3')).toBeInTheDocument();
  });

  it('기본 스크롤 컨테이너에 cursor-grab 클래스가 적용되어 있어야 한다', () => {
    const { container } = render(
      <HorizontalCarousel>
        <div>테스트 아이템</div>
      </HorizontalCarousel>,
    );

    const scrollContainer = container.querySelector('.cursor-grab');
    expect(scrollContainer).toBeInTheDocument();
  });
});
