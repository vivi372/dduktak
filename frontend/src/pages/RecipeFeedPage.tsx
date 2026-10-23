import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { RecipeCard } from '@/components/common/RecipeCard';
import { RecipeMatchingToggle, RecipeCategoryTabs } from '@/components/recipe';
import { mockRecipeDetails } from '@/mocks/recipes.mock';
import { calculateRecipeMatching } from '@/mocks/matching.mock';
import { mockInventory } from '@/mocks/inventory.mock';
import { ROUTES } from '@/constants/routes';

type SortOption = 'matching' | 'latest' | 'popular' | 'cooked' | 'time';

/**
 * 모듈 3 & 모듈 4: 뚝딱 레시피 커뮤니티 피드 (RecipeFeedPage)
 * - 8대 고정 카테고리 탭 (국/찌개/탕, 메인반찬, 밑반찬, 한그릇/밥 등)
 * - [🟢 내 냉장고 뚝딱 매칭] 실시간 토글 (Hard Gate 주재료 검증 및 매칭 스코어 정렬)
 * - 키워드 실시간 검색 및 다채로운 정렬 지원
 * - [+ 레시피 작성] 버튼
 */
export default function RecipeFeedPage() {
  const [categoryId, setCategoryId] = useState<number>(0);
  const [matchOn, setMatchOn] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  // 모든 레시피에 대해 내 냉장고 기반 매칭 스코어 사전 연산
  const recipeScores = useMemo(() => {
    const map = new Map<number, ReturnType<typeof calculateRecipeMatching>>();
    mockRecipeDetails.forEach((r) => {
      map.set(r.recipeId, calculateRecipeMatching(r, mockInventory));
    });
    return map;
  }, []);

  // 주재료를 1개 이상 보유하여 매칭 가능한 레시피 수
  const matchableCount = useMemo(() => {
    let count = 0;
    mockRecipeDetails.forEach((r) => {
      const score = recipeScores.get(r.recipeId);
      if (score?.isHardGatePassed && score.finalScore > 0) count++;
    });
    return count;
  }, [recipeScores]);

  // 필터링 및 정렬된 레시피 목록
  const displayedRecipes = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();

    return mockRecipeDetails
      .filter((r) => {
        // 1. 카테고리 필터
        if (categoryId !== 0 && r.recipeCategoryId !== categoryId) return false;

        // 2. 검색어 필터 (제목 또는 사용 재료명)
        if (trimmed) {
          const matchTitle = r.title.toLowerCase().includes(trimmed);
          const matchIngredients = r.ingredients.some((i) =>
            i.name.toLowerCase().includes(trimmed),
          );
          if (!matchTitle && !matchIngredients) return false;
        }

        // 3. 내 냉장고 뚝딱 매칭 토글 ON 시: 주재료 Hard Gate 필터링
        if (matchOn) {
          const score = recipeScores.get(r.recipeId);
          if (!score?.isHardGatePassed || score.finalScore === 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const scoreA = recipeScores.get(a.recipeId)?.finalScore ?? 0;
        const scoreB = recipeScores.get(b.recipeId)?.finalScore ?? 0;

        // 매칭 모드 ON일 때는 기본적으로 매칭 점수 내림차순 우선
        if (matchOn) {
          if (scoreB !== scoreA) return scoreB - scoreA;
          return b.cookedCount + b.likeCount - (a.cookedCount + a.likeCount);
        }

        // 일반 정렬
        switch (sortBy) {
          case 'matching':
            return scoreB - scoreA;
          case 'popular':
            return b.likeCount - a.likeCount;
          case 'cooked':
            return b.cookedCount - a.cookedCount;
          case 'time':
            return a.cookingTime - b.cookingTime;
          case 'latest':
          default:
            return b.recipeId - a.recipeId;
        }
      });
  }, [categoryId, matchOn, searchQuery, sortBy, recipeScores]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. 상단 타이틀 & 레시피 등록 CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            뚝딱 레시피 커뮤니티
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            1인 가구 자취생들의 리얼 냉장고 파먹기 레시피를 만나보세요.
          </p>
        </div>

        <Link
          to={ROUTES.RECIPE_NEW}
          className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-xs sm:text-sm font-extrabold text-white shadow-soft transition-all hover:bg-brand-600 active:scale-95"
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

        <div className="relative shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="레시피 정렬 순서"
            className="min-h-[44px] appearance-none rounded-2xl border border-border/80 bg-card pl-8 pr-7 text-xs sm:text-sm font-bold text-foreground hover:bg-accent focus:outline-none"
          >
            <option value="latest">최신순</option>
            <option value="matching">매칭률순</option>
            <option value="popular">인기순 (좋아요)</option>
            <option value="cooked">요리완료순</option>
            <option value="time">조리시간 단축순</option>
          </select>
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* 4. 8대 고정 카테고리 수평 탭 */}
      <RecipeCategoryTabs selectedId={categoryId} onSelect={setCategoryId} />

      {/* 5. 레시피 카드 목록 렌더링 */}
      {displayedRecipes.length === 0 ? (
        <EmptyState
          emoji={matchOn ? '🍳' : '🍽'}
          title={
            matchOn
              ? '내 냉장고 재료로 만들 수 있는 요리가 없어요'
              : '해당 조건의 레시피를 찾지 못했어요'
          }
          description={
            matchOn
              ? '냉장고에 새로운 주재료를 추가하거나 매칭 토글을 꺼보세요.'
              : '다른 카테고리나 검색어를 입력해 보세요.'
          }
        />
      ) : (
        <div className="space-y-3 pt-1">
          {displayedRecipes.map((r) => {
            const score = recipeScores.get(r.recipeId);
            return (
              <RecipeCard
                key={r.recipeId}
                recipe={r}
                matchingRate={score?.finalScore}
                variant="list"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
