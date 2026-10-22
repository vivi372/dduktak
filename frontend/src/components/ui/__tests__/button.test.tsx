import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button 컴포넌트 단위 테스트', () => {
  it('자식 텍스트를 정상적으로 렌더링해야 한다', () => {
    render(<Button>뚝딱 요리하기</Button>);
    expect(screen.getByRole('button', { name: '뚝딱 요리하기' })).toBeInTheDocument();
  });

  it('클릭 시 onClick 핸들러가 호출되어야 한다', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>클릭 테스트</Button>);
    const button = screen.getByRole('button', { name: '클릭 테스트' });

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 상태일 경우 클릭 이벤트가 동작하지 않아야 한다', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button disabled onClick={handleClick}>
        비활성화 버튼
      </Button>,
    );
    const button = screen.getByRole('button', { name: '비활성화 버튼' });

    expect(button).toBeDisabled();
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('variant="primary"일 때 브랜드 코랄 배경 클래스가 적용되어야 한다', () => {
    render(<Button variant="primary">기본 버튼</Button>);
    const button = screen.getByRole('button', { name: '기본 버튼' });
    expect(button).toHaveClass('bg-brand-500');
  });

  it('variant="secondary"일 때 민트 배경 클래스가 적용되어야 한다', () => {
    render(<Button variant="secondary">민트 버튼</Button>);
    const button = screen.getByRole('button', { name: '민트 버튼' });
    expect(button).toHaveClass('bg-mint-500');
  });

  it('variant="destructive"일 때 destructive 클래스가 적용되어야 한다', () => {
    render(<Button variant="destructive">삭제 버튼</Button>);
    const button = screen.getByRole('button', { name: '삭제 버튼' });
    expect(button).toHaveClass('bg-destructive');
  });

  it('size="lg"일 때 높이 h-12 클래스가 적용되어야 한다', () => {
    render(<Button size="lg">큰 버튼</Button>);
    const button = screen.getByRole('button', { name: '큰 버튼' });
    expect(button).toHaveClass('h-12');
  });

  it('asChild prop 전달 시 Radix Slot을 통해 감싸진 태그로 렌더링되어야 한다', () => {
    render(
      <Button asChild>
        <a href="/login">로그인 링크 버튼</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: '로그인 링크 버튼' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
    expect(link).toHaveClass('bg-brand-500');
  });
});
