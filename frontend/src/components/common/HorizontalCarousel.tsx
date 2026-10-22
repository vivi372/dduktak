import { useRef, useState, useEffect, type ReactNode, type WheelEvent, type MouseEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface HorizontalCarouselProps {
  children: ReactNode;
  className?: string;
  /** 한 번 클릭 시 스크롤할 거리 (기본값: 카드 너비 240px) */
  scrollDistance?: number;
}

/**
 * PC / 모바일 공용 스마트 가로 스크롤 캐러셀
 * - 모바일: 네이티브 터치 스와이프
 * - PC: 마우스 휠(수평 변환), 마우스 드래그 앤 드롭 스크롤, 좌/우 네비게이션 버튼 제공
 */
export function HorizontalCarousel({
  children,
  className,
  scrollDistance = 240,
}: HorizontalCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 마우스 드래그 스크롤 상태
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isDraggingRef = useRef(false);

  // 스크롤 가능 여부 체크
  const updateScrollButtons = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, []);

  // 좌우 버튼 클릭 시 부드럽게 스크롤
  const scrollBy = (offset: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // 1. 마우스 휠 수평 스크롤 변환 (Shift를 누르지 않아도 일반 휠로 가로 이동 가능)
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    // 수직 휠 움직임이 큰 경우 가로 스크롤로 전환
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && Math.abs(e.deltaY) > 5) {
      const atLeft = el.scrollLeft <= 0 && e.deltaY < 0;
      const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && e.deltaY > 0;

      // 스크롤 가능한 구간일 때만 수평으로 이동
      if (!atLeft && !atRight) {
        el.scrollLeft += e.deltaY * 0.9;
        updateScrollButtons();
      }
    }
  };

  // 2. 마우스 드래그 앤 드롭 스크롤
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    isMouseDownRef.current = true;
    isDraggingRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !containerRef.current) return;
    e.preventDefault();

    const x = e.pageX - containerRef.current.offsetLeft;
    const distance = x - startXRef.current;

    // 4px 이상 이동했을 때 드래그로 판정
    if (Math.abs(distance) > 4) {
      isDraggingRef.current = true;
    }

    containerRef.current.scrollLeft = scrollLeftRef.current - distance * 1.2;
    updateScrollButtons();
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  return (
    <div className="group/carousel relative">
      {/* 좌측 스크롤 화살표 버튼 */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-scrollDistance)}
          aria-label="이전 레시피 보기"
          className="absolute -left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/95 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background hover:scale-110 active:scale-95 dark:border-white/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* 우측 스크롤 화살표 버튼 */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(scrollDistance)}
          aria-label="다음 레시피 보기"
          className="absolute -right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/95 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background hover:scale-110 active:scale-95 dark:border-white/10"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* 메인 스크롤 컨테이너 */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={cn(
          'no-scrollbar flex snap-x gap-3.5 overflow-x-auto pb-3 pt-1 select-none cursor-grab active:cursor-grabbing',
          className,
        )}
      >
        {children}
        {/* 오른쪽 끝 여백 스페이서 */}
        <div className="w-3 shrink-0" aria-hidden />
      </div>
    </div>
  );
}
