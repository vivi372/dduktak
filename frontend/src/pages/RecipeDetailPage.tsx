import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  Heart,
  ChefHat,
  Bookmark,
  Share2,
  Sparkles,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ServingsCalculator,
  IngredientBadgeList,
  RecipeStepList,
  CookConfirmationModal,
} from '@/components/recipe';
import { mockRecipeDetails } from '@/mocks/recipes.mock';
import { calculateRecipeMatching } from '@/mocks/matching.mock';
import { mockInventory } from '@/mocks/inventory.mock';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

/**
 * 모듈 3 & 모듈 4: 레시피 상세 화면 (RecipeDetailPage)
 * - 인분 변환 계산기 (1~10인분 비례 자동 연산)
 * - 4색 식재료 상태 배지 ([보유], [부족], [대체가능], [양념류])
 * - 조리 순서 Step 리스트 (완료 체크 지원)
 * - [이 레시피로 요리하기] 2-Step 확인 차감 모달 연동
 */
export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 레시피 데이터 조회
  const recipe = useMemo(() => {
    const numId = Number(id);
    return mockRecipeDetails.find((r) => r.recipeId === numId) ?? mockRecipeDetails[0];
  }, [id]);

  // 로컬 상호작용 상태
  const [servings, setServings] = useState<number>(recipe.servings || 1);
  const [isLiked, setIsLiked] = useState<boolean>(recipe.isLiked ?? false);
  const [likeCount, setLikeCount] = useState<number>(recipe.likeCount);
  const [isScrapped, setIsScrapped] = useState<boolean>(recipe.isScrapped ?? false);
  const [cookedCount, setCookedCount] = useState<number>(recipe.cookedCount);
  const [cookModalOpen, setCookModalOpen] = useState<boolean>(false);

  // 현재 인분 기준 스마트 매칭 스코어 및 재료 상태 재연산
  const matchingScore = useMemo(() => {
    return calculateRecipeMatching(recipe, mockInventory, servings);
  }, [recipe, servings]);

  // 좋아요 토글 핸들러
  const handleToggleLike = () => {
    setIsLiked((prev) => {
      const next = !prev;
      setLikeCount((c) => (next ? c + 1 : c - 1));
      toast.success(next ? '이 레시피를 좋아해요! ❤️' : '좋아요를 취소했어요.');
      return next;
    });
  };

  // 스크랩 토글 핸들러
  const handleToggleScrap = () => {
    setIsScrapped((prev) => {
      const next = !prev;
      toast.success(next ? '레시피를 보관함에 담았어요! 📌' : '보관함에서 제외했어요.');
      return next;
    });
  };

  // 공유 핸들러
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('레시피 링크가 클립보드에 복사되었어요! 📋');
    }
  };

  // 요리 완료 확정 핸들러
  const handleConfirmCook = (deductInventory: boolean, cookedServings: number) => {
    setCookedCount((prev) => prev + 1);
    if (deductInventory) {
      toast.success(
        `맛있는 요리가 완성되었어요! ${cookedServings}인분 재료를 냉장고에서 차감했어요. 🍳`,
        { duration: 4000 },
      );
    } else {
      toast.success('오늘의 요리 완료를 기록했어요! 📝', { duration: 3000 });
    }
  };

  if (!recipe) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">레시피를 찾을 수 없습니다.</p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.RECIPES)}
          className="mt-4 rounded-xl bg-brand-500 px-4 py-2 font-bold text-white text-sm"
        >
          레시피 목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* 1. 레시피 대표 히어로 썸네일 & 오버레이 */}
      <div className="relative -mx-4 -mt-4 overflow-hidden aspect-[16/10] sm:aspect-[2/1] sm:rounded-3xl sm:mx-0 sm:mt-0 bg-muted">
        <img
          src={recipe.thumbnailUrl}
          alt={recipe.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

        {/* 상단 액션 아이콘들 (공유, 수정) */}
        <div className="absolute right-3.5 top-3.5 flex items-center gap-2">
          <Link
            to={`/recipes/${recipe.recipeId}/edit`}
            aria-label="레시피 수정"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={handleShare}
            aria-label="레시피 공유하기"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {/* 하단 타이틀 오버레이 */}
        <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-[11px] font-black">
              {recipe.categoryName}
            </span>
            <span className="text-xs text-white/80">
              by {recipe.authorNickname}#{recipe.authorTag}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">{recipe.title}</h1>
        </div>
      </div>

      {/* 2. 레시피 메타 정보 바 (시간, 난이도, 좋아요, 요리완료) */}
      <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5 shadow-card dark:border-white/10">
        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-brand-500" />
            <span className="text-foreground">{recipe.cookingTime}분</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">난이도:</span>
            <span className="text-foreground">{recipe.difficulty}</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <ChefHat className="h-4 w-4 text-amber-500" />
            <span className="text-foreground">{cookedCount}회 요리됨</span>
          </div>
        </div>

        {/* 소셜 버튼 (좋아요 & 스크랩) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleLike}
            aria-label={isLiked ? '좋아요 취소' : '좋아요'}
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all active:scale-95',
              isLiked
                ? 'bg-rose-500/15 text-rose-500 dark:bg-rose-950/40'
                : 'hover:bg-accent text-muted-foreground',
            )}
          >
            <Heart className={cn('h-4 w-4', isLiked && 'fill-current text-rose-500')} />
            <span>{likeCount}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleScrap}
            aria-label={isScrapped ? '스크랩 취소' : '스크랩'}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-95',
              isScrapped
                ? 'bg-brand-500/15 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300'
                : 'hover:bg-accent text-muted-foreground',
            )}
          >
            <Bookmark className={cn('h-4 w-4', isScrapped && 'fill-current text-brand-500')} />
          </button>
        </div>
      </div>

      {/* 한 줄 소개 */}
      {recipe.description && (
        <p className="text-sm text-muted-foreground leading-relaxed px-1">
          {recipe.description}
        </p>
      )}

      {/* 3. 스마트 매칭 스코어 브리핑 배너 */}
      <div className="rounded-2xl border border-mint-500/40 bg-mint-50/70 p-4 shadow-soft dark:bg-mint-950/25 dark:border-mint-600/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-500 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-foreground">내 냉장고 뚝딱 매칭률</span>
                <span className="rounded-full bg-mint-500 px-2 py-0.5 text-xs font-black text-white">
                  {matchingScore.finalScore}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {matchingScore.isHardGatePassed
                  ? `주재료 ${matchingScore.matchedMainCount}개를 보유하고 있어요!`
                  : '주재료를 보유하고 있지 않아 즉시 조리가 어려워요.'}
              </p>
            </div>
          </div>
        </div>

        {/* 임박 가산점 안내 칩 */}
        {matchingScore.urgentIngredients.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-background/80 p-2 text-xs font-bold text-foreground border border-mint-500/30">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>
              소비기한 임박 재료({matchingScore.urgentIngredients.join(', ')}) 포함 가산점{' '}
              <strong className="text-mint-600 dark:text-mint-400">+{matchingScore.bonusScore}점</strong> 반영!
            </span>
          </div>
        )}
      </div>

      {/* 4. 인분 변환 계산기 */}
      <ServingsCalculator
        servings={servings}
        baseServings={recipe.servings}
        onChange={setServings}
      />

      {/* 5. 식재료 보유 현황 배지 리스트 */}
      <IngredientBadgeList ingredientStatuses={matchingScore.ingredientStatuses} />

      {/* 6. 조리 순서 Step 리스트 */}
      <RecipeStepList steps={recipe.steps} />

      {/* 7. 하단 고정 액션 바 [이 레시피로 요리하기] CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/80 bg-background/90 p-3 backdrop-blur-md dark:border-white/10 dark:bg-background/95">
        <div className="mx-auto max-w-[480px] lg:max-w-5xl flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleLike}
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all active:scale-95',
              isLiked ? 'border-rose-400 bg-rose-50 text-rose-500 dark:bg-rose-950/40' : 'bg-card text-muted-foreground',
            )}
          >
            <Heart className={cn('h-5 w-5', isLiked && 'fill-current text-rose-500')} />
          </button>

          <button
            type="button"
            onClick={() => setCookModalOpen(true)}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-500 font-black text-sm text-white shadow-soft hover:bg-brand-600 active:scale-[0.98] transition-all"
          >
            <ChefHat className="h-5 w-5" />
            <span>이 레시피로 요리하기 ({servings}인분)</span>
          </button>
        </div>
      </div>

      {/* 2차 확인 차감 모달 */}
      <CookConfirmationModal
        open={cookModalOpen}
        onClose={() => setCookModalOpen(false)}
        recipe={recipe}
        initialServings={servings}
        onConfirmCook={handleConfirmCook}
      />
    </div>
  );
}
