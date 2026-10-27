import { useState, useMemo, useEffect } from 'react';
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
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ServingsCalculator,
  IngredientBadgeList,
  RecipeStepList,
  CookConfirmationModal,
  RecipeDeleteModal,
} from '@/components/recipe';
import { RecipeDetailSkeleton } from '@/components/common/Skeleton';
import {
  useRecipeDetail,
  useToggleRecipeLike,
  useToggleRecipeScrap,
  useDeleteRecipe,
} from '@/hooks/useRecipe';
import { useMyIngredients } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { calculateRecipeMatching } from '@/utils/matchingCalculator';
import { ROUTES } from '@/constants/routes';
import { DEFAULT_RECIPE_THUMBNAIL_URL } from '@/constants/images';
import { deleteStorageFiles } from '@/services/storageService';
import { cn } from '@/utils/cn';

/**
 * 모듈 3 & 모듈 4: 레시피 상세 화면 (RecipeDetailPage)
 * - GET /api/v1/recipes/:id 실데이터 조회
 * - useMyIngredients 연동 4색 식재료 상태 배지 ([보유 🟢], [부족 🔴], [대체가능 🟡], [양념류 ⚪])
 * - 인분 변환 계산기 (1~10인분 비례 자동 연산)
 * - 좋아요 & 스크랩 토글 API 원자적 갱신
 * - [이 레시피로 요리하기] 2-Step 확인 차감 모달 연동
 */
export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const recipeId = Number(id);

  // 1. 레시피 상세 API 조회
  const {
    data: recipe,
    isLoading: isRecipeLoading,
    isError: isRecipeError,
  } = useRecipeDetail(recipeId);

  // 2. 내 냉장고 보유 식재료 API 조회 (매칭률 및 4색 배지 실시간 계산용)
  const { data: myIngredients = [] } = useMyIngredients();

  // 3. 좋아요 / 스크랩 / 삭제 뮤테이션
  const toggleLikeMutation = useToggleRecipeLike();
  const toggleScrapMutation = useToggleRecipeScrap();
  const deleteRecipeMutation = useDeleteRecipe();

  // 로컬 상호작용 상태
  const [servings, setServings] = useState<number>(1);
  const [cookModalOpen, setCookModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // 레시피 로드 시 레시피의 기본 인분수로 동기화
  useEffect(() => {
    if (recipe?.servings) {
      setServings(recipe.servings);
    }
  }, [recipe?.servings]);

  // 현재 인분 기준 스마트 매칭 스코어 및 재료 상태 실시간 연산 (실제 myIngredients 연동)
  const matchingScore = useMemo(() => {
    if (!recipe) {
      return {
        recipeId,
        baseScore: 0,
        bonusScore: 0,
        finalScore: 0,
        isHardGatePassed: false,
        matchedMainCount: 0,
        urgentIngredients: [],
        ingredientStatuses: [],
      };
    }
    return calculateRecipeMatching(recipe, myIngredients, servings);
  }, [recipe, myIngredients, servings, recipeId]);

  // 본인 작성 레시피 여부
  const isAuthor = Boolean(user?.userId && recipe?.authorId && user.userId === recipe.authorId);

  // 좋아요 토글 핸들러
  const handleToggleLike = () => {
    if (!recipe) return;
    toggleLikeMutation.mutate(recipe.recipeId, {
      onSuccess: (res) => {
        toast.success(res.liked ? '이 레시피를 좋아해요! ❤️' : '좋아요를 취소했어요.');
      },
    });
  };

  // 스크랩 토글 핸들러
  const handleToggleScrap = () => {
    if (!recipe) return;
    toggleScrapMutation.mutate(recipe.recipeId, {
      onSuccess: (res) => {
        toast.success(res.scrapped ? '레시피를 보관함에 담았어요! 📌' : '보관함에서 제외했어요.');
      },
    });
  };

  // 레시피 삭제 모달 오픈 핸들러
  const handleDeleteRecipe = () => {
    if (!recipe) return;
    setIsDeleteModalOpen(true);
  };

  // 레시피 삭제 실제 확정 핸들러
  const handleConfirmDelete = () => {
    if (!recipe || deleteRecipeMutation.isPending) return;
    deleteRecipeMutation.mutate(recipe.recipeId, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);

        // 레시피 관련 이미지 Supabase Storage 버킷 일괄 정리 (고아 파일 방지)
        const targetImages = [
          recipe.thumbnailUrl,
          ...recipe.steps.map((s) => s.imageUrl).filter(Boolean),
        ];
        deleteStorageFiles('recipes', targetImages);

        toast.success('레시피가 성공적으로 삭제되었습니다.');
        navigate(ROUTES.RECIPES, { replace: true });
      },
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          '레시피 삭제에 실패했습니다.';
        toast.error(msg);
      },
    });
  };

  // 공유 핸들러
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('레시피 링크가 클립보드에 복사되었어요! 📋');
    }
  };

  // 요리 완료 확정 콜백
  const handleConfirmCook = (deductInventory: boolean, cookedServings: number) => {
    if (deductInventory) {
      toast.success(
        `맛있는 요리가 완성되었어요! ${cookedServings}인분 재료가 냉장고에서 차감되었습니다. 🍳`,
        { duration: 4000 },
      );
    } else {
      toast.success('오늘의 요리 완료를 기록했어요! 📝', { duration: 3000 });
    }
  };

  // 로딩 상태 표시 (스켈레톤 UI를 통해 상세 진입 시 깜빡임 및 레이아웃 시프트 방지)
  if (isRecipeLoading) {
    return <RecipeDetailSkeleton />;
  }

  if (isRecipeError || !recipe) {
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

  const isLiked = recipe.isLiked ?? false;
  const isScrapped = recipe.isScrapped ?? false;

  return (
    <div className="space-y-6 pb-6">
      {/* 1. 레시피 대표 히어로 썸네일 & 오버레이 */}
      <div className="relative -mx-4 -mt-4 overflow-hidden aspect-[16/10] sm:aspect-[2/1] sm:rounded-3xl sm:mx-0 sm:mt-0 bg-muted">
        <img
          src={recipe.thumbnailUrl || DEFAULT_RECIPE_THUMBNAIL_URL}
          alt={recipe.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

        {/* 상단 액션 아이콘들 (공유, 수정, 삭제) */}
        <div className="absolute right-3.5 top-3.5 flex items-center gap-2">
          {isAuthor && (
            <>
              <Link
                to={`/recipes/${recipe.recipeId}/edit`}
                aria-label="레시피 수정"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={handleDeleteRecipe}
                aria-label="레시피 삭제"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-rose-400 backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
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
              {!recipe.authorNickname || recipe.authorNickname === '(알 수 없음)' || recipe.authorNickname.trim() === ''
                ? '관리자'
                : `${recipe.authorNickname}${recipe.authorTag ? `#${recipe.authorTag}` : ''}`}
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
            <span className="text-foreground">{recipe.cookedCount}회 요리됨</span>
          </div>
        </div>

        {/* 소셜 버튼 (좋아요 & 스크랩) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={toggleLikeMutation.isPending}
            aria-label={isLiked ? '좋아요 취소' : '좋아요'}
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all active:scale-95',
              isLiked
                ? 'bg-rose-500/15 text-rose-500 dark:bg-rose-950/40'
                : 'hover:bg-accent text-muted-foreground',
            )}
          >
            <Heart className={cn('h-4 w-4', isLiked && 'fill-current text-rose-500')} />
            <span>{recipe.likeCount}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleScrap}
            disabled={toggleScrapMutation.isPending}
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
      <div className="rounded-2xl border border-mint-500/40 bg-mint-50/70 p-4 shadow-soft dark:bg-card dark:border-mint-500/40 dark:ring-1 dark:ring-mint-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-500 text-slate-950 font-black shadow-sm dark:bg-mint-400 dark:text-slate-950">
              <Sparkles className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-foreground">내 냉장고 뚝딱 매칭률</span>
                <span className="rounded-full bg-mint-500 px-2.5 py-0.5 text-xs font-black text-slate-950 dark:bg-mint-400 dark:text-slate-950">
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

        {/* 소비기한 임박 재료 포함 안내 칩 */}
        {matchingScore.urgentIngredients.length > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-background/90 p-2.5 text-xs font-bold text-foreground border border-mint-500/30 dark:bg-muted/40 dark:border-mint-500/30">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>
              소비기한이 임박한 재료(
              <strong className="text-rose-500 dark:text-rose-400">
                {matchingScore.urgentIngredients.join(', ')}
              </strong>
              )가 포함되어 있어 먼저 활용하기 좋아요! ⏰
            </span>
          </div>
        )}
      </div>

      {/* 4. 인분 변환 계산기 및 퀵 요리하기 */}
      <div className="space-y-3">
        <ServingsCalculator
          servings={servings}
          baseServings={recipe.servings}
          onChange={setServings}
        />
        <button
          type="button"
          onClick={() => setCookModalOpen(true)}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 font-black text-sm text-white shadow-soft transition-all hover:bg-brand-600 active:scale-[0.98]"
        >
          <ChefHat className="h-5 w-5" />
          <span>이 레시피로 요리하기 ({servings}인분)</span>
        </button>
      </div>

      {/* 5. 식재료 보유 현황 배지 리스트 */}
      <IngredientBadgeList ingredientStatuses={matchingScore.ingredientStatuses} />

      {/* 6. 조리 순서 Step 리스트 */}
      <RecipeStepList steps={recipe.steps} />

      {/* 7. 조리 완료 & 재료 차감 유도 카드 */}
      <div className="space-y-3 rounded-3xl border border-brand-500/25 bg-gradient-to-br from-brand-50/70 via-background to-mint-50/50 p-5 text-center shadow-card dark:border-brand-500/20 dark:from-card dark:via-card dark:to-card/80">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
          <ChefHat className="h-6 w-6 stroke-[2.2]" />
        </div>
        <div>
          <h4 className="text-base font-black text-foreground">
            레시피 확인 완료! 이제 요리해볼까요?
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            선택하신 <strong>{servings}인분</strong> 기준으로 냉장고 재료를 차감 검수하고 요리를 시작합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCookModalOpen(true)}
          className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 font-black text-sm text-white shadow-soft transition-all hover:bg-brand-600 active:scale-[0.98]"
        >
          <ChefHat className="h-5 w-5" />
          <span>이 레시피로 요리하기 ({servings}인분)</span>
        </button>
      </div>

      {/* 2차 확인 차감 모달 */}
      <CookConfirmationModal
        open={cookModalOpen}
        onClose={() => setCookModalOpen(false)}
        recipe={recipe}
        initialServings={servings}
        onConfirmCook={handleConfirmCook}
      />

      {/* 레시피 삭제 전용 2차 확인 모달 */}
      <RecipeDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteRecipeMutation.isPending}
        recipeTitle={recipe.title}
      />
    </div>
  );
}
