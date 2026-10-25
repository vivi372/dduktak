import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LogIn, Plus, Sparkles, ChefHat, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DDayBadge } from '@/components/common/DDayBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { RecipeCard } from '@/components/common/RecipeCard';
import { SectionHeader } from '@/components/common/SectionHeader';
import { HorizontalCarousel } from '@/components/common/HorizontalCarousel';
import { ROUTES } from '@/constants/routes';
import { mockPopularRecipes, mockRecipes } from '@/mocks';
import { useAuth } from '@/hooks/useAuth';
import { useHomeBriefing } from '@/hooks/useHome';
import type { RecipeSummary, RecipeDifficulty } from '@/types/recipe';
import logo from '@/assets/logo.png';

/** 난이도 문자열을 RecipeDifficulty 유니온으로 안전 변환 */
function normalizeDifficulty(diff?: string): RecipeDifficulty {
  if (diff === '보통') return '보통';
  if (diff === '조금복잡' || diff === '어려움') return '조금복잡';
  return '쉬움';
}


/**
 * 모듈 6: 메인 홈 화면 (HomePage)
 * - 유저 닉네임 환영 Hero 섹션
 * - 냉장고 브리핑 위젯 (GET /api/v1/home/briefing 연동, 정상 임박 집계 vs 재료 0개 Empty State)
 * - 오늘 뭐 먹지? 스마트 매칭 캐러셀 (정상 매칭 vs 재료 0개 인기 레시피 0% 폴백)
 * - 지금 인기있는 뚝딱 요리 세로 리스트
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // 실제 메인 홈 브리핑 API 쿼리 훅 연동
  const { data: briefing, isLoading: isBriefingLoading } = useHomeBriefing();

  // 임박 재료 보유 여부 (0 <= D-Day <= 3 범위 집계)
  const hasExpiringIngredients =
    Boolean(briefing && briefing.expiringIngredientsCount > 0 && briefing.imminentIngredients.length > 0);

  // topRecipe 데이터가 있고 실제 매칭률이 0보다 큰지 여부
  const hasSmartMatch = Boolean(briefing?.topRecipe && briefing.topRecipe.matchingRate > 0);

  // topRecipe를 RecipeSummary 모델 형태로 정규화
  const topRecipeSummary: RecipeSummary | null = briefing?.topRecipe
    ? {
        recipeId: briefing.topRecipe.recipeId,
        recipeCategoryId: 1,
        categoryName: '뚝딱 추천',
        title: briefing.topRecipe.title,
        thumbnailUrl: briefing.topRecipe.thumbnailUrl || mockRecipes[0]?.thumbnailUrl,
        cookingTime: briefing.topRecipe.cookingTime ?? 15,
        difficulty: normalizeDifficulty(briefing.topRecipe.difficulty),
        likeCount: 12,
        cookedCount: 8,
        authorNickname: '뚝딱 셰프',
        authorTag: '1024',
      }
    : null;

  /** 하단 FAB 재료 추가 바텀시트 호출 */
  const handleOpenAddTray = () => {
    const fabButton = document.querySelector<HTMLButtonElement>('[aria-label="재료 추가"]');
    if (fabButton) {
      fabButton.click();
    } else {
      navigate(ROUTES.INVENTORY);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 비로그인 상태 안내 배너 (비로그인 상태일 때만 노출) */}
      {!isAuthenticated && (
        <div className="flex items-center justify-between rounded-2xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-brand-foreground shadow-soft">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>로그인하고 나만의 스마트한 냉장고 관리를 시작하세요!</span>
          </span>
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-brand-700 shadow-sm transition-transform active:scale-95"
          >
            <LogIn className="h-3 w-3" />
            <span>로그인</span>
          </Link>
        </div>
      )}

      {/* 2. 환영 Hero 섹션: 브랜드 공식 로고 & 웰컴 메시지 */}
      <section
        className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-brand-100 via-cream-100 to-mint-100 p-3.5 sm:p-5 shadow-soft dark:border-white/10 dark:from-brand-900/40 dark:via-card dark:to-mint-700/20 dark:shadow-[0_2px_14px_rgba(0,0,0,0.5)]"
        aria-label="환영 인사"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src={logo}
            alt="오늘의 뚝딱 로고"
            className="h-20 w-20 sm:h-28 sm:w-28 shrink-0 rounded-2xl object-cover shadow-card"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-bold font-heading text-brand-700 dark:text-brand-300 truncate">
              {isAuthenticated ? `안녕하세요, ${briefing?.nickname || user?.nickname || '회원'}님 👋` : '반가워요, 자취 요리사님 👋'}
            </p>
            <h1 className="mt-1 text-base sm:text-xl font-black leading-tight sm:leading-snug tracking-tight text-foreground break-keep">
              오늘도 냉장고를
              <br />
              뚝딱 비워볼까요?
            </h1>
            <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground break-keep leading-tight">
              {hasExpiringIngredients
                ? '남은 재료로 맛있는 요리를 추천해요'
                : '재료를 등록하고 맞춤 요리를 찾아보세요'}
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/40 blur-2xl dark:bg-brand-500/10" aria-hidden />
      </section>

      {/* 3. 내 냉장고 브리핑 위젯 (06_UI_UX_GUIDELINES.md & module_06_main.md 2.1절) */}
      <section aria-label="내 냉장고 브리핑">
        {isBriefingLoading ? (
          <Card className="flex items-center justify-center p-8 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            <span className="text-xs text-muted-foreground">냉장고 상태를 확인하는 중...</span>
          </Card>
        ) : hasExpiringIngredients && briefing ? (
          /* [정상 브리핑 상태]: D-0 ~ D-3 범위 임박 집계 및 상위 3개 재료 노출 */
          <Link to={ROUTES.INVENTORY} className="block group">
            <Card className="p-4 transition-all group-hover:border-brand-300 group-hover:shadow-soft active:scale-[0.99]">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <span className="flex h-2 w-2 rounded-full bg-dday-urgent animate-ping" />
                  <span>소비기한 임박 재료</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden />
              </div>
              <p className="text-2xl font-black text-foreground">
                <span className="text-dday-urgent">{briefing.expiringIngredientsCount}개</span>
                <span className="ml-1.5 text-base font-bold">가 곧 만료돼요! ⏰</span>
              </p>
              <ul className="mt-3.5 flex flex-wrap gap-2">
                {briefing.imminentIngredients.map((ing) => (
                  <li
                    key={ing.ingredientId}
                    className="flex items-center gap-1.5 rounded-full bg-muted/80 py-1 pl-3 pr-1.5 text-xs font-bold text-foreground"
                  >
                    <span>{ing.name}</span>
                    <DDayBadge dDay={ing.dDay} />
                  </li>
                ))}
              </ul>
            </Card>
          </Link>
        ) : (
          /* [재료 0개 Empty State]: 안내 일러스트/문구 및 대형 CTA 버튼 */
          <EmptyState
            emoji="🧊"
            title="아직 냉장고에 등록된 재료가 없어요!"
            description="재료를 등록하면 유통기한 알림과 맞춤 레시피를 뚝딱 알려드려요."
          >
            <Button
              size="lg"
              className="w-full text-base font-bold shadow-soft"
              onClick={handleOpenAddTray}
            >
              <Plus className="h-5 w-5" />
              <span>첫 재료 등록하기</span>
            </Button>
          </EmptyState>
        )}
      </section>

      {/* 4. 스마트 매칭 레시피 (오늘 뭐 먹지? 가로 스크롤 캐러셀) */}
      <section aria-label="스마트 매칭 레시피">
        <SectionHeader
          title="오늘 뭐 먹지? 🍳"
          description={hasSmartMatch ? '내 냉장고 재료 매칭 순서예요' : '재료 등록 전 둘러보는 추천 요리'}
          moreTo={ROUTES.RECIPES}
        />

        {hasSmartMatch && topRecipeSummary ? (
          /* [정상 매칭 캐러셀]: 백엔드 브리핑 topRecipe 및 높은 매칭률 순 탐색 */
          <HorizontalCarousel>
            <RecipeCard
              key={topRecipeSummary.recipeId}
              recipe={topRecipeSummary}
              matchingRate={briefing?.topRecipe?.matchingRate}
              variant="carousel"
            />
            {mockRecipes.slice(0, 3).map((recipe) => (
              <RecipeCard
                key={recipe.recipeId}
                recipe={recipe}
                matchingRate={recipe.matchingRate}
                variant="carousel"
              />
            ))}
          </HorizontalCarousel>
        ) : (
          /* [재료 0개 또는 매칭 불가 폴백]: 백엔드 반환 인기 레시피(0% 매칭률) 폴백 바인딩 */
          <div className="space-y-3">
            {/* 0개 유저용 폴백 가이드 카드 */}
            <Card className="flex items-center gap-3.5 bg-brand-50/60 p-4 border-dashed border-brand-300 dark:bg-brand-900/10 dark:border-brand-800">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-brand-foreground shadow-soft">
                <ChefHat className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-brand-700 dark:text-brand-300">스마트 매칭 레시피</p>
                <p className="text-sm font-extrabold text-foreground">
                  냉장고에 재료를 등록하고 맞춤 레시피를 추천받아보세요!
                </p>
              </div>
            </Card>

            {/* 인기 레시피 1건 폴백 (매칭률 0% 표기) */}
            {topRecipeSummary ? (
              <RecipeCard
                key={topRecipeSummary.recipeId}
                recipe={topRecipeSummary}
                matchingRate={0}
                variant="list"
              />
            ) : (
              mockPopularRecipes.slice(0, 1).map((fallbackRecipe) => (
                <RecipeCard
                  key={fallbackRecipe.recipeId}
                  recipe={fallbackRecipe}
                  matchingRate={0}
                  variant="list"
                />
              ))
            )}
          </div>
        )}
      </section>

      {/* 5. 커뮤니티 인기 레시피 (세로 리스트) */}
      <section aria-label="커뮤니티 인기 레시피">
        <SectionHeader
          title="지금 인기있는 뚝딱 요리 🔥"
          description="자취생들이 가장 많이 따라 한 요리"
          moreTo={ROUTES.RECIPES}
        />
        <div className="space-y-3">
          {mockPopularRecipes.slice(0, 3).map((recipe) => (
            <RecipeCard key={recipe.recipeId} recipe={recipe} variant="list" />
          ))}
        </div>
      </section>
    </div>
  );
}
