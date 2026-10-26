import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { RecipeCard } from '@/components/common/RecipeCard';
import { RecipeCardSkeleton } from '@/components/common/Skeleton';
import {
  RecipeMatchingToggle,
  RecipeCategoryTabs,
  RecipeSortDropdown,
} from '@/components/recipe';
import type { RecipeSortOption } from '@/components/recipe';
import { useRecipes } from '@/hooks/useRecipe';
import { useMatchingRecommendations } from '@/hooks/useMatching';
import { ROUTES } from '@/constants/routes';
import { DEFAULT_RECIPE_THUMBNAIL_URL } from '@/constants/images';
import type { RecipeSummary, RecipeDifficulty } from '@/types/recipe';

/**
 * 모듈 3 & 모듈 4: 뚝딱 레시피 커뮤니티 피드 (RecipeFeedPage)
 * - 8대 고정 카테고리 탭 (GET /api/v1/recipes/categories)
 * - [🟢 내 냉장고 뚝딱 매칭] 실시간 토글 (GET /api/v1/matching/recommendations)
 * - 키워드 실시간 검색 및 다채로운 정렬 지원 (GET /api/v1/recipes)
 * - 마이페이지 연계 필터 (내가 쓴 레시피 ?filter=MY / 스크랩북 ?filter=SCRAP)
 * - [+ 레시피 작성] 버튼 연동
 */
export default function RecipeFeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = (searchParams.get('filter') as 'MY' | 'SCRAP' | null) || undefined;

  const [categoryId, setCategoryId] = useState<number>(0);
  const [matchOn, setMatchOn] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<RecipeSortOption>('latest');

  // 백엔드 sort 파라미터 매핑: 'latest' | 'like' | 'cooked'
  const backendSort = useMemo<'latest' | 'like' | 'cooked'>(() => {
    if (sortBy === 'popular') return 'like';
    if (sortBy === 'cooked') return 'cooked';
    return 'latest';
  }, [sortBy]);

  // 1. 일반 레시피 목록 쿼리 (매칭 모드 OFF일 때 활성화)
  const {
    data: recipeListData,
    isLoading: isRecipesLoading,
  } = useRecipes(
    {
      query: searchQuery.trim() || undefined,
      filter: filterParam,
      recipeCategoryId: categoryId === 0 ? undefined : categoryId,
      sort: backendSort,
      page: 0,
      size: 30,
    },
    { enabled: !matchOn },
  );

  // 2. 스마트 매칭 맞춤 추천 쿼리 (매칭 모드 ON일 때 활성화)
  const {
    data: recommendations = [],
    isLoading: isMatchingLoading,
  } = useMatchingRecommendations(
    {
      recipeCategoryId: categoryId === 0 ? undefined : categoryId,
      page: 0,
      size: 30,
    },
    { enabled: matchOn },
  );

  // 매칭 가능한 레시피 건수 (주재료 하드게이트 통과된 결과 수)
  const matchableCount = recommendations.length;

  // 매칭 모드일 때 클라이언트 검색어 필터링 적용
  const displayedRecommendations = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return recommendations;
    return recommendations.filter(
      (r) =>
        r.title.toLowerCase().includes(trimmed) ||
        r.matchIngredients.some((i) => i.toLowerCase().includes(trimmed)),
    );
  }, [recommendations, searchQuery]);

  const isLoading = matchOn ? isMatchingLoading : isRecipesLoading;
  const regularRecipes = recipeListData?.recipes ?? [];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. 상단 타이틀 & 레시피 등록 CTA */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground whitespace-nowrap">
              {filterParam === 'MY'
                ? '내가 작성한 레시피'
                : filterParam === 'SCRAP'
                  ? '내 스크랩북 📌'
                  : '뚝딱 레시피 커뮤니티'}
            </h1>
            {filterParam && (
              <button
                type="button"
                onClick={() => {
                  searchParams.delete('filter');
                  setSearchParams(searchParams, { replace: true });
                }}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground transition hover:bg-muted/80"
              >
                <span>전체보기</span>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground break-keep">
            {filterParam === 'MY'
              ? '내가 직접 등록한 뚝딱 요리 레시피 목록입니다.'
              : filterParam === 'SCRAP'
                ? '보관해 둔 나만의 즐겨찾기 레시피 모음입니다.'
                : '1인 가구 자취생들의 알뜰한 냉장고 비우기 맞춤 레시피를 만나보세요.'}
          </p>
        </div>

        <Link
          to={ROUTES.RECIPE_NEW}
          className="flex min-h-[44px] shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full bg-brand-500 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-extrabold text-white shadow-soft transition-all hover:bg-brand-600 active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>레시피 등록</span>
        </Link>
      </div>

      {/* 2. 내 냉장고 뚝딱 매칭 토글 스위치 */}
      <RecipeMatchingToggle
        enabled={matchOn}
        onChange={(val) => {
          setMatchOn(val);
          if (val) setSortBy('matching');
        }}
        matchedCount={matchableCount}
      />

      {/* 3. 검색창 및 정렬 드롭다운 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="요리명이나 보유 재료(계란, 김치 등) 검색"
            className="min-h-[44px] w-full rounded-2xl border border-border/80 bg-card pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {!matchOn && (
          <RecipeSortDropdown value={sortBy} onChange={setSortBy} />
        )}
      </div>

      {/* 4. 8대 고정 카테고리 수평 탭 */}
      <RecipeCategoryTabs selectedId={categoryId} onSelect={setCategoryId} />

      {/* 5. 로딩 중 UI */}
      {isLoading ? (
        <div className="space-y-3 pt-1">
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
        </div>
      ) : matchOn ? (
        /* 6. 스마트 매칭 추천 레시피 목록 */
        displayedRecommendations.length === 0 ? (
          <EmptyState
            emoji="🍳"
            title="내 냉장고 재료로 만들 수 있는 요리가 없어요"
            description="냉장고에 새로운 주재료를 추가하거나 매칭 토글을 꺼보세요."
          />
        ) : (
          <div className="space-y-3 pt-1">
            {displayedRecommendations.map((r) => {
              const summary: RecipeSummary = {
                recipeId: r.recipeId,
                recipeCategoryId: categoryId || 1,
                categoryName: '맞춤 추천',
                title: r.title,
                thumbnailUrl: r.thumbnailUrl || DEFAULT_RECIPE_THUMBNAIL_URL,
                cookingTime: r.cookingTime,
                difficulty: (r.difficulty as RecipeDifficulty) || '쉬움',
                likeCount: 0,
                cookedCount: 0,
                authorNickname: '뚝딱',
                authorTag: '추천',
                matchingRate: r.matchingRate,
              };
              return (
                <RecipeCard
                  key={r.recipeId}
                  recipe={summary}
                  matchingRate={r.matchingRate}
                  variant="list"
                />
              );
            })}
          </div>
        )
      ) : (
        /* 7. 일반 레시피 목록 */
        regularRecipes.length === 0 ? (
          <EmptyState
            emoji="🍽"
            title="해당 조건의 레시피를 찾지 못했어요"
            description="다른 카테고리나 검색어를 입력해 보세요."
          />
        ) : (
          <div className="space-y-3 pt-1">
            {regularRecipes.map((r) => (
              <RecipeCard
                key={r.recipeId}
                recipe={r}
                matchingRate={r.matchingRate}
                variant="list"
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
