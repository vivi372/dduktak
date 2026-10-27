import { BookMarked, Utensils, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/common/Skeleton';
import { ROUTES } from '@/constants/routes';

interface MyRecipeShortcutCardProps {
  myRecipeCount?: number;
  scrapCount?: number;
  isLoading?: boolean;
}

/**
 * 마이페이지 내 활동 숏컷 카드 (USER-PAGE-02 내가 작성한 레시피 & USER-PAGE-03 스크랩북)
 */
export function MyRecipeShortcutCard({
  myRecipeCount = 0,
  scrapCount = 0,
  isLoading = false,
}: MyRecipeShortcutCardProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 내가 작성한 레시피 바로가기 */}
      <Card
        role="button"
        tabIndex={0}
        onClick={() => navigate(`${ROUTES.RECIPES}?filter=MY`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`${ROUTES.RECIPES}?filter=MY`);
          }
        }}
        className="group flex cursor-pointer flex-col justify-between p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 transition group-hover:bg-brand-500 group-hover:text-white dark:bg-brand-900/40 dark:text-brand-300">
            <Utensils className="h-5 w-5" />
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
        </div>
        <div className="mt-3">
          <p className="text-xs font-bold text-muted-foreground">내가 쓴 레시피</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-6 w-12 rounded" />
          ) : (
            <p className="mt-0.5 text-lg font-black tracking-tight text-foreground">
              {myRecipeCount}
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">개</span>
            </p>
          )}
        </div>
      </Card>

      {/* 스크랩북(북마크) 바로가기 */}
      <Card
        role="button"
        tabIndex={0}
        onClick={() => navigate(`${ROUTES.RECIPES}?filter=SCRAP`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`${ROUTES.RECIPES}?filter=SCRAP`);
          }
        }}
        className="group flex cursor-pointer flex-col justify-between p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint-100 text-mint-700 transition group-hover:bg-mint-500 group-hover:text-white dark:bg-mint-700/30 dark:text-mint-300">
            <BookMarked className="h-5 w-5" />
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
        </div>
        <div className="mt-3">
          <p className="text-xs font-bold text-muted-foreground">스크랩북</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-6 w-12 rounded" />
          ) : (
            <p className="mt-0.5 text-lg font-black tracking-tight text-foreground">
              {scrapCount}
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">개</span>
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
