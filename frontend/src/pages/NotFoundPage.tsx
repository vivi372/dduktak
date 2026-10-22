import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

/** 404 페이지 */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
      <div className="mb-4 text-6xl" aria-hidden>🍳</div>
      <h1 className="text-2xl font-black tracking-tight">길을 잃었어요</h1>
      <p className="mt-2 text-sm text-muted-foreground">찾으시는 페이지가 없거나 옮겨졌어요.</p>
      <Button asChild size="lg" className="mt-6">
        <Link to={ROUTES.HOME}>홈으로 돌아가기</Link>
      </Button>
    </div>
  );
}
