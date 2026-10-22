import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DDayBadge } from '@/components/common/DDayBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { RecipeCard } from '@/components/common/RecipeCard';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ROUTES } from '@/constants/routes';
import { mockEmptyHomeBriefing, mockHomeBriefing, mockPopularRecipes, mockRecipes } from '@/mocks';
import { cn } from '@/utils/cn';
import logo from '@/assets/logo.png';

/** 메인 홈 프레임 (상세 UI 고도화는 Step 3A-2) */
export default function HomePage() {
  // 디자인 확인용: 재료 보유 / 재료 0개(신규 유저) 상태 전환
  const [hasIngredients, setHasIngredients] = useState(true);
  const briefing = hasIngredients ? mockHomeBriefing : mockEmptyHomeBriefing;

  return (
    <div className="space-y-7">
      {/* Hero: 원본 전체 로고는 홈 Hero에서만 통으로 노출 */}
      <section
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-100 via-cream-100 to-mint-100 p-4 shadow-soft dark:from-brand-900/40 dark:via-card dark:to-mint-700/20"
        aria-label="환영 인사"
      >
        <div className="flex items-center gap-4">
          <img src={logo} alt="오늘의 뚝딱 - 1인 가구를 위한 쉽고 빠른 요리" className="h-28 w-28 shrink-0 rounded-2xl shadow-card" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-200">안녕하세요, {briefing.nickname}님 👋</p>
            <h1 className="mt-1 text-xl font-black leading-snug tracking-tight">
              오늘도 냉장고를
              <br />
              뚝딱 비워볼까요?
            </h1>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/40 blur-2xl" aria-hidden />
      </section>

      {/* 내 냉장고 브리핑 */}
      <section aria-label="내 냉장고 브리핑">
        {briefing.imminentIngredients.length > 0 ? (
          <Link to={ROUTES.INVENTORY} className="block">
            <Card className="p-4 transition-transform active:scale-[0.99]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">소비기한 임박 재료</p>
                <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>
              <p className="text-2xl font-black">
                <span className="text-dday-urgent">{briefing.expiringIngredientsCount}개</span>
                <span className="ml-1.5 text-base font-bold">가 곧 만료돼요</span>
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {briefing.imminentIngredients.map((ing) => (
                  <li key={ing.ingredientId} className="flex items-center gap-1.5 rounded-full bg-muted py-1 pl-3 pr-1.5 text-sm font-semibold">
                    {ing.name}
                    <DDayBadge dDay={ing.dDay} />
                  </li>
                ))}
              </ul>
            </Card>
          </Link>
        ) : (
          <EmptyState emoji="🧊" title="아직 냉장고에 등록된 재료가 없어요!" description="재료를 넣으면 소비기한과 맞춤 레시피를 알려드려요.">
            <Button size="lg" className="w-full" onClick={() => document.querySelector<HTMLButtonElement>('[aria-label="재료 추가"]')?.click()}>
              <Plus /> 첫 재료 등록하기
            </Button>
          </EmptyState>
        )}
      </section>

      {/* 오늘 뭐 먹지? (가로 스크롤 캐러셀) */}
      <section aria-label="오늘 뭐 먹지?">
        <SectionHeader title="오늘 뭐 먹지? 🍳" description="내 냉장고 재료로 뚝딱 만들 수 있어요" />
        {hasIngredients ? (
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {mockRecipes.map((r) => (
              <RecipeCard key={r.recipeId} recipe={r} matchingRate={r.matchingRate} variant="carousel" />
            ))}
          </div>
        ) : (
          <Card className="flex items-center gap-3 p-4">
            <Sparkles className="h-8 w-8 shrink-0 text-brand-500" aria-hidden />
            <p className="text-sm font-semibold">냉장고에 재료를 등록하고 맞춤 레시피를 추천받아보세요!</p>
          </Card>
        )}
      </section>

      {/* 지금 인기있는 뚝딱 요리 (세로 리스트) */}
      <section aria-label="인기 레시피">
        <SectionHeader title="지금 인기있는 뚝딱 요리 🔥" moreTo={ROUTES.RECIPES} />
        <div className="space-y-3">
          {mockPopularRecipes.slice(0, 3).map((r) => (
            <RecipeCard key={r.recipeId} recipe={r} variant="list" />
          ))}
        </div>
      </section>

      {/* 디자인 검수용 상태 전환 (3B 단계에서 제거) */}
      <div className="rounded-2xl border border-dashed p-3 text-center text-xs text-muted-foreground">
        <p className="mb-2 font-semibold">🛠 디자인 확인용 · 화면 상태 미리보기</p>
        <div className="inline-flex rounded-full bg-muted p-1">
          {[
            { v: true, label: '재료 있음' },
            { v: false, label: '재료 0개' },
          ].map(({ v, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setHasIngredients(v)}
              aria-pressed={hasIngredients === v}
              className={cn(
                'min-h-9 rounded-full px-4 text-xs font-bold transition-colors',
                hasIngredients === v ? 'bg-brand-500 text-brand-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
